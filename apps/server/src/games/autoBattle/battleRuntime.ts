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

/** Runs the BattleSimulation on a fixed clock, broadcasts frames and persists match phases. */
export abstract class AutoBattleRuntime {
  protected readonly sim = new BattleSimulation({ config: { autoNextMatch: true } });
  protected readonly store = new BattleMatchStore();
  protected loop: NodeJS.Timeout | null = null;
  protected lastClock = 0;
  protected stepsSinceBroadcast = 0;
  protected lastStatus: MatchStatus = "WAITING";
  protected lastMatchId = "";
  private readonly credited = new Map<string, number>();
  private creditedMatchId = "";

  constructor(
    protected readonly broadcaster: Broadcaster,
    protected readonly ctx: GameAdapterContext,
  ) {}

  protected afterHostAction(): void {
    this.detectTransitions();
    this.broadcastFrame();
    this.ctx.broadcastFullState();
  }

  protected stopLoop(): void {
    if (this.loop) clearInterval(this.loop);
    this.loop = null;
  }

  protected tick(): void {
    const now = performance.now();
    let steps = Math.floor((now - this.lastClock) / STEP_MS);
    if (steps <= 0) return;
    this.lastClock += steps * STEP_MS;
    if (steps > MAX_CATCHUP_STEPS) {
      steps = MAX_CATCHUP_STEPS;
      this.lastClock = now;
    }
    try {
      for (let i = 0; i < steps; i++) this.sim.step(STEP_MS);
      this.detectTransitions();
      this.stepsSinceBroadcast += steps;
      const status = this.sim.getStatus();
      const active = !this.sim.isPaused() && (status === "BATTLE" || status === "SUDDEN_DEATH" || status === "COUNTDOWN");
      if (this.stepsSinceBroadcast >= (active ? BROADCAST_EVERY_ACTIVE : BROADCAST_EVERY_IDLE)) this.broadcastFrame();
    } catch (err) {
      console.error("[autoBattle] simulation step failed:", err);
    }
  }

  protected broadcastFrame(): void {
    this.stepsSinceBroadcast = 0;
    this.broadcaster.publish({ type: "BATTLE_TICK", payload: this.sim.snapshot() });
  }

  protected ensureMatchRow(matchId: string): Promise<unknown> {
    return this.store.ensureMatch(matchId, {
      sessionId: this.ctx.getSessionId(),
      matchNumber: this.sim.getMatchNumber(),
      status: this.sim.getStatus(),
      teams: this.sim.getConfig().teams,
    });
  }

  /** Persist + announce match phase changes (low frequency). */
  protected detectTransitions(): void {
    const status = this.sim.getStatus();
    const matchId = this.sim.getMatchId();
    if (status === this.lastStatus && matchId === this.lastMatchId) return;

    const prevMatchId = this.lastMatchId;
    const prevStatus = this.lastStatus;
    this.lastStatus = status;
    this.lastMatchId = matchId;

    const fighting = (s: MatchStatus) => s === "BATTLE" || s === "SUDDEN_DEATH";
    if (fighting(status) && !fighting(prevStatus)) {
      this.ensureMatchRow(matchId)
        .then(() => this.store.markBattleStarted(matchId))
        .catch(() => {});
      void this.ctx.logEvent("BATTLE_STARTED", { matchId, matchNumber: this.sim.getMatchNumber() });
    }

    const result = this.sim.getResult();
    if (status === "ENDED" && result && prevStatus !== "ENDED") void this.persistResult(result);
    if (matchId !== prevMatchId) this.store.forget(prevMatchId);
    this.ctx.broadcastFullState();
  }

  /**
   * Adds match contribution scores to the shared session leaderboard. Only
   * the not-yet-credited part is added, so calling it when a session ends
   * mid-match and again when that match finishes never counts twice.
   */
  protected creditContributions(): void {
    const matchId = this.sim.getMatchId();
    if (matchId !== this.creditedMatchId) {
      this.credited.clear();
      this.creditedMatchId = matchId;
    }
    let changed = false;
    for (const c of this.sim.allContributions()) {
      const delta = c.score - (this.credited.get(c.viewerId) ?? 0);
      if (delta <= 0) continue;
      const player = this.ctx.getOrCreatePlayer({ platformUserId: c.viewerId, username: c.viewerName, avatarUrl: c.avatarUrl });
      player.points += delta;
      this.credited.set(c.viewerId, c.score);
      changed = true;
    }
    if (changed) this.ctx.updateLeaderboard();
  }

  protected async persistResult(result: MatchResult): Promise<void> {
    const all = this.sim.allContributions();
    await this.ensureMatchRow(result.matchId).catch(() => {});
    await this.store.saveResult(result, all);

    this.creditContributions();
    await this.ctx.logEvent("BATTLE_ENDED", { matchId: result.matchId, winner: result.winner, reason: result.reason });
  }
}
