import { EventIdDeduper } from "../../../core/gift.js";
import { BATTLE_TUNING as T, resolveBattleConfig } from "../constants.js";
import type {
  BattleConfig,
  BattleFeedItem,
  BattleFx,
  BattleGiftMapping,
  ContributionEntry,
  MatchResult,
  MatchStatus,
  StructureKind,
  TeamId,
  TeamRuntimeStats,
} from "../types.js";
import {
  OTHER,
  dist,
  emptyTeamStats,
  type BattleSimulationOptions,
  type Contributor,
  type QueueEntry,
  type SimStructure,
  type SimUnit,
  type Target,
} from "./simTypes.js";

/**
 * Shared state and bookkeeping for the Auto Battle simulation. The rules are
 * layered on top in subclasses (combat → targeting → movement → spawner →
 * `BattleSimulation`) so each concern stays in its own file.
 */
export abstract class SimCore {

  protected config: BattleConfig;
  protected mappings: BattleGiftMapping[];
  protected readonly random: () => number;
  protected readonly newMatchId: () => string;
  protected readonly deduper = new EventIdDeduper();

  protected matchId = "";
  protected matchNumber = 0;
  protected status: MatchStatus = "WAITING";
  protected paused = false;
  protected now = 0;
  protected phaseEndsAt: number | null = null;
  protected battleStartedAt = 0;
  protected battleEndsAt = 0;
  protected stepCount = 0;
  protected nextUnitId = 1;

  protected units: SimUnit[] = [];
  protected structures: SimStructure[] = [];
  protected queues: Record<TeamId, QueueEntry[]> = { A: [], B: [] };
  protected nextSpawnAt: Record<TeamId, number> = { A: 0, B: 0 };
  protected teamStats: Record<TeamId, TeamRuntimeStats> = { A: emptyTeamStats(), B: emptyTeamStats() };
  protected contributions = new Map<string, ContributionEntry>();
  protected fx: BattleFx[] = [];
  protected pendingHits = new Map<string, { x: number; y: number; amount: number; heal: boolean }>();
  protected feed: BattleFeedItem[] = [];
  protected feedSeq = 0;
  protected result: MatchResult | null = null;
  /**
   * Per team: the most advanced living enemy unit. Nobody may walk past it —
   * it has to be beaten first (units can't slip through the enemy army).
   */
  protected frontline: Record<TeamId, SimUnit | null> = { A: null, B: null };

  constructor(options: BattleSimulationOptions = {}) {
    this.config = resolveBattleConfig(options.config);
    this.mappings = options.mappings ?? [];
    this.random = options.random ?? Math.random;
    this.newMatchId =
      options.newMatchId ?? (() => `m_${Date.now().toString(36)}${Math.floor(this.random() * 1e6).toString(36)}`);
  }

  /** Rebuilds bases/towers from the current config (defined by the match layer). */
  protected abstract buildStructures(): void;


  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  getConfig(): BattleConfig {
    return this.config;
  }

  /** New stats apply to units spawned from now on; HP pools apply from the next match. */
  setConfig(partial: Partial<BattleConfig>): void {
    this.config = resolveBattleConfig({ ...this.config, ...partial });
    if (this.status === "WAITING") this.buildStructures();
  }

  getMappings(): BattleGiftMapping[] {
    return this.mappings;
  }

  setMappings(mappings: BattleGiftMapping[]): void {
    this.mappings = mappings;
  }

  // -------------------------------------------------------------------------
  // Match flow (PRD §18)
  // -------------------------------------------------------------------------

  getStatus(): MatchStatus {
    return this.status;
  }

  isPaused(): boolean {
    return this.paused;
  }

  getMatchId(): string {
    return this.matchId;
  }

  getMatchNumber(): number {
    return this.matchNumber;
  }

  getResult(): MatchResult | null {
    return this.result;
  }

  protected contributor(owner: Contributor): ContributionEntry {
    let c = this.contributions.get(owner.viewerId);
    if (!c) {
      c = {
        viewerId: owner.viewerId,
        viewerName: owner.viewerName,
        avatarUrl: owner.avatarUrl,
        totalGifts: 0,
        unitsSpawned: 0,
        damage: 0,
        buildingDamage: 0,
        healing: 0,
        score: 0,
        teamAUnits: 0,
        teamBUnits: 0,
      };
      this.contributions.set(owner.viewerId, c);
    } else {
      c.viewerName = owner.viewerName || c.viewerName;
      c.avatarUrl = owner.avatarUrl ?? c.avatarUrl;
    }
    return c;
  }

  activeCount(team: TeamId): number {
    let n = 0;
    for (const u of this.units) if (u.team === team && u.state !== "DEATH") n++;
    return n;
  }

  queuedCount(team: TeamId): number {
    let n = 0;
    for (const q of this.queues[team]) n += q.remaining;
    return n;
  }

  protected base(team: TeamId): SimStructure {
    return this.structures.find((s) => s.team === team && s.kind === "BASE")!;
  }

  protected targetPos(t: Target): [number, number, number] {
    const o = t.unit ?? t.struct;
    return [o.x, o.y, o.radius];
  }

  protected enemyUnits(team: TeamId): SimUnit[] {
    return this.units.filter((o) => o.team !== team && o.state !== "DEATH" && o.state !== "SPAWNING");
  }

  protected liveStructures(team: TeamId, kind?: StructureKind): SimStructure[] {
    return this.structures.filter((s) => s.team === team && s.hp > 0 && (!kind || s.kind === kind));
  }

  protected nearest<T extends { x: number; y: number }>(u: SimUnit, list: T[]): T | null {
    let best: T | null = null;
    let bestD = Infinity;
    for (const o of list) {
      const d = dist(u.x, u.y, o.x, o.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  // -------------------------------------------------------------------------
  // FX, feed, snapshot
  // -------------------------------------------------------------------------

  protected pushFx(fx: BattleFx): void {
    if (this.fx.length < T.fxMaxPerFrame * 2) this.fx.push(fx);
  }

  /** Aggregates same-target hits within a step into one damage number (PRD §26). */
  protected queueHit(key: string, x: number, y: number, amount: number, heal: boolean): void {
    const k = `${key}:${heal ? "h" : "d"}`;
    const hit = this.pendingHits.get(k);
    if (hit) {
      hit.amount += amount;
      hit.x = x;
      hit.y = y;
    } else this.pendingHits.set(k, { x, y, amount, heal });
  }

  protected flushHits(): void {
    for (const hit of this.pendingHits.values()) {
      if (hit.amount < 1) continue;
      this.pushFx({ k: "hit", x: hit.x, y: hit.y, amount: Math.round(hit.amount), ...(hit.heal ? { heal: true } : {}) });
    }
    this.pendingHits.clear();
  }

  protected pushFeed(item: Omit<BattleFeedItem, "id" | "at">): void {
    this.feed.push({ ...item, id: `f${++this.feedSeq}`, at: this.now });
    if (this.feed.length > T.feedMax * 3) this.feed.splice(0, this.feed.length - T.feedMax * 3);
  }

  topContributors(limit: number = T.topContributors): ContributionEntry[] {
    return [...this.contributions.values()]
      .sort((a, b) => b.score - a.score || b.damage - a.damage)
      .slice(0, limit)
      .map((c) => ({ ...c, damage: Math.round(c.damage), buildingDamage: Math.round(c.buildingDamage), healing: Math.round(c.healing) }));
  }

  allContributions(): ContributionEntry[] {
    return this.topContributors(Number.MAX_SAFE_INTEGER);
  }
}
