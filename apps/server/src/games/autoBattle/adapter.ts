import { nanoid } from "nanoid";
import {
  BATTLE_TUNING,
  BattleSimulation,
  resolveBattleConfig,
  type BattleConfig,
  type BattleGiftLogView,
  type BattleGiftMapping,
  type BattleHostState,
  type BattlePublicState,
  type IncomingComment,
  type IncomingGift,
  type MatchResult,
  type MatchStatus,
  type SessionSettings,
} from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";
import type { Broadcaster } from "../../core/realtime/broadcaster.js";
import type { GameAdapter, GameAdapterContext } from "../../core/session/gameAdapter.js";
import { battleMappings } from "./mappings.js";
import { BattleMatchStore } from "./persistence.js";

const STEP_MS = BATTLE_TUNING.stepMs;
/** Realtime frames: every 2nd step while fighting (10/sec), slower when idle. */
const BROADCAST_EVERY_ACTIVE = 2;
const BROADCAST_EVERY_IDLE = 10;
/** Never replay more than this many missed steps after an event-loop stall. */
const MAX_CATCHUP_STEPS = 6;
const GIFT_LOG_LIMIT = 40;
import { AutoBattleRuntime } from "./battleRuntime.js";

/**
 * Auto Battle Arena (Auto Battle Arena/PRD_TikTok_LIVE_Auto_Battle_Arena.md).
 * Owns one `BattleSimulation` and drives it on a fixed 50ms clock while the
 * game is active; gifts become units, every outcome is logged for the host.
 */
export class AutoBattleAdapter extends AutoBattleRuntime implements GameAdapter {
  readonly gameType = "AUTO_BATTLE" as const;
  readonly giftMode = "PER_DELTA" as const;

  /** The simulation queues units while paused, so a paid gift is never lost. */
  readonly acceptsGiftsWhilePaused = true;

  private loaded: Promise<void> | null = null;
  private giftLog: BattleGiftLogView[] = [];

  async initialize(): Promise<void> {
    this.loaded ??= this.load().catch((err: unknown) => {
      this.loaded = null; // retry next time
      throw err;
    });
    await this.loaded;
  }

  private async load(): Promise<void> {
    const setting = await prisma.battleSetting.findUnique({ where: { id: "default" } });
    if (setting) {
      try {
        this.sim.setConfig(resolveBattleConfig(JSON.parse(setting.configJson) as Partial<BattleConfig>));
      } catch (err) {
        console.error("[autoBattle] stored config unreadable, using defaults:", err);
      }
    }
    await battleMappings.seedIfEmpty();
    await this.reloadMappings();
    void this.enrichMappings();
    this.lastStatus = this.sim.getStatus();
    this.lastMatchId = this.sim.getMatchId();
  }

  async start(_settings: SessionSettings): Promise<void> {
    await this.initialize();
    this.sim.resume();
    this.startLoop();
    this.broadcastFrame();
  }

  async pause(): Promise<void> {
    this.sim.pause();
    this.broadcastFrame();
  }

  async resume(): Promise<void> {
    this.sim.resume();
    this.broadcastFrame();
  }

  /** Switching game / ending the session freezes the arena (a later start resumes it). */
  async stop(): Promise<void> {
    this.creditContributions();
    this.sim.pause();
    this.stopLoop();
  }

  async handleComment(_comment: IncomingComment): Promise<void> {
    // PRD §2.2 — no comment-based team selection; comments don't affect the battle.
  }

  getProgress() {
    return {};
  }

  mockComment(): string | null {
    return null;
  }

  // -- Gift pipeline (PRD §15) ---------------------------------------------------

  async handleGift(gift: IncomingGift): Promise<void> {
    await this.initialize();
    const count = gift.count ?? 1;
    if (count <= 0) return; // combo-end marker with nothing new
    const eventId = gift.eventId ?? `local:${nanoid()}`;
    const matchId = this.sim.getMatchId();
    const result = this.sim.receiveGift({
      eventId,
      viewerId: gift.platformUserId,
      viewerName: gift.displayName || gift.username,
      avatarUrl: gift.avatarUrl,
      giftId: gift.giftId,
      giftName: gift.giftName,
      count,
      receivedAt: Date.now(),
    });

    const giftName = result.ok ? result.mapping.giftName : (gift.giftName ?? `Gift ${gift.giftId}`);
    const log: BattleGiftLogView = {
      id: nanoid(),
      at: new Date().toISOString(),
      viewerName: gift.username,
      giftId: gift.giftId,
      giftName,
      count,
      ok: result.ok,
      ...(result.ok
        ? { team: result.team, unitType: result.unitType, quantity: result.quantity, queued: result.queued }
        : { reason: result.reason }),
    };
    this.giftLog = [log, ...this.giftLog].slice(0, GIFT_LOG_LIMIT);
    this.broadcaster.publish({ type: "BATTLE_GIFT", payload: log }, "host");

    if (!result.ok) {
      if (result.reason !== "DUPLICATE") console.log(`[autoBattle] gift ${giftName} (id ${gift.giftId}) from @${gift.username} ignored: ${result.reason}`);
      return;
    }
    this.ctx.getOrCreatePlayer(gift); // counts as a session participant
    this.ensureMatchRow(matchId).catch(() => {});
    this.store.recordGift(matchId, {
      eventId,
      viewerId: gift.platformUserId,
      viewerName: gift.username,
      giftId: gift.giftId,
      giftName,
      team: result.team,
      unitType: result.unitType,
      quantity: result.quantity,
      giftCount: count,
    });
  }

  // -- Host controls (PRD §32) ---------------------------------------------------

  startMatch(): void {
    this.sim.startMatch();
    this.afterHostAction();
  }

  endMatch(): MatchResult | null {
    const result = this.sim.endMatch();
    if (!result) throw new Error("Tidak ada battle yang sedang berlangsung.");
    this.afterHostAction();
    return result;
  }

  resetMatch(): void {
    this.sim.reset();
    this.afterHostAction();
  }

  pauseMatch(): void {
    this.sim.pause();
    this.afterHostAction();
  }

  resumeMatch(): void {
    this.sim.resume();
    this.afterHostAction();
  }

  getConfig(): BattleConfig {
    return this.sim.getConfig();
  }

  async updateConfig(partial: Partial<BattleConfig>): Promise<BattleConfig> {
    await this.initialize();
    this.sim.setConfig(partial);
    const config = this.sim.getConfig();
    const configJson = JSON.stringify(config);
    await prisma.battleSetting.upsert({ where: { id: "default" }, create: { id: "default", configJson }, update: { configJson } });
    this.ctx.broadcastFullState();
    return config;
  }

  async reloadMappings(): Promise<BattleGiftMapping[]> {
    const mappings = await battleMappings.load();
    this.sim.setMappings(mappings);
    return mappings;
  }

  /** Fills ids/icons/prices from TikTok's gift catalog in the background. */
  async enrichMappings(): Promise<void> {
    const changed = await battleMappings.enrichFromCatalog();
    if (changed === 0) return;
    await this.reloadMappings();
    this.ctx.broadcastFullState();
    console.log(`[autoBattle] enriched ${changed} gift mapping(s) from the TikTok catalog`);
  }

  getMappings(): BattleGiftMapping[] {
    return this.sim.getMappings();
  }

  getGiftLog(): BattleGiftLogView[] {
    return this.giftLog;
  }

  // -- Loop ----------------------------------------------------------------------

  private startLoop(): void {
    if (this.loop) return;
    this.lastClock = performance.now();
    this.loop = setInterval(() => this.tick(), STEP_MS);
  }

  // -- State views ----------------------------------------------------------------

  getPublicState(): BattlePublicState {
    const config = this.sim.getConfig();
    return {
      matchId: this.sim.getMatchId(),
      status: this.sim.isPaused() ? "PAUSED" : this.sim.getStatus(),
      config: { matchDuration: config.matchDuration, baseHp: config.baseHp, towerHp: config.towerHp, maxUnitsPerTeam: config.maxUnitsPerTeam, teams: config.teams },
      result: this.sim.getResult(),
      matchNumber: this.sim.getMatchNumber(),
      giftGuide: this.sim.getMappings().filter((m) => m.enabled),
    };
  }

  getHostState(): BattleHostState {
    return { ...this.getPublicState(), mappings: this.sim.getMappings(), fullConfig: this.sim.getConfig() };
  }
}
