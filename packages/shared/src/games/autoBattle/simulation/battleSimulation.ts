import { BASE_RADIUS, BATTLE_LAYOUT, BATTLE_TUNING as T, TOWER_RADIUS } from "../constants.js";
import {
  UNIT_FLAG_ABILITY,
  UNIT_FLAG_RAGE,
  UNIT_FLAG_SHIELD,
  UNIT_FLAG_STUN,
  type BattleSnapshot,
  type ContributionEntry,
  type MatchResult,
  type TeamId,
  type UnitWire,
} from "../types.js";
import { FORWARD, OTHER, emptyTeamStats, type BattleSimulationOptions, type SimStructure } from "./simTypes.js";
import { SimSpawner } from "./spawner.js";

/**
 * Server-authoritative Auto Battle simulation (PRD §29). Pure TypeScript —
 * no timers, no I/O: the server calls `step()` on a fixed clock and
 * broadcasts `snapshot()`. Everything a viewer gift can cause flows through
 * `receiveGift()`:
 *
 *   validate → de-duplicate event_id → find mapping → team + unit →
 *   capacity check → FIFO queue → staggered spawn → contribution
 *
 * (PRD §15). Viewers never own a team; contribution is tracked per gift
 * event (PRD §2.1), so one viewer can reinforce both sides in a match.
 */
export class BattleSimulation extends SimSpawner {
  constructor(options: BattleSimulationOptions = {}) {
    super(options);
    this.resetMatch(false);
  }

  // -------------------------------------------------------------------------
  // Match flow (PRD §18)
  // -------------------------------------------------------------------------

  /** Host "Start": WAITING → COUNTDOWN (3→2→1) → BATTLE. */
  startMatch(): void {
    if (this.status === "ENDED") this.resetMatch(true);
    if (this.status !== "WAITING") throw new Error("Match sudah berjalan.");
    this.status = "COUNTDOWN";
    this.phaseEndsAt = this.now + this.config.countdownSeconds * 1000;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  /** Host "End Match": decide the winner from current HP. */
  endMatch(): MatchResult | null {
    if (this.status !== "BATTLE" && this.status !== "SUDDEN_DEATH") return null;
    this.finish(this.leaderByHp(), "HOST");
    return this.result;
  }

  /** Host "Reset": brand-new match in the lobby, clearing the queue too (PRD §41 "Reset membuat match baru"). */
  reset(): void {
    this.queues = { A: [], B: [] };
    this.paused = false;
    this.resetMatch(true);
  }

  protected resetMatch(bumpNumber: boolean): void {
    this.matchId = this.newMatchId();
    if (bumpNumber || this.matchNumber === 0) this.matchNumber++;
    this.status = "WAITING";
    this.units = [];
    this.fx = [];
    this.pendingHits.clear();
    this.feed = [];
    this.result = null;
    this.contributions.clear();
    this.teamStats = { A: emptyTeamStats(), B: emptyTeamStats() };
    this.buildStructures();
    this.phaseEndsAt = this.config.autoNextMatch ? this.now + this.config.lobbySeconds * 1000 : null;
  }

  protected buildStructures(): void {
    const s: SimStructure[] = [];
    for (const team of ["A", "B"] as const) {
      const layout = BATTLE_LAYOUT[team];
      s.push({
        id: `${team}-base`,
        team,
        kind: "BASE",
        x: layout.base[0],
        y: layout.base[1],
        radius: BASE_RADIUS,
        hp: this.config.baseHp,
        maxHp: this.config.baseHp,
        nextAttackAt: 0,
        criticalAnnounced: false,
      });
      layout.towers.forEach(([x, y], i) => {
        s.push({
          id: `${team}-tower-${i}`,
          team,
          kind: "TOWER",
          x,
          y,
          radius: TOWER_RADIUS,
          hp: this.config.towerHp,
          maxHp: this.config.towerHp,
          nextAttackAt: 0,
          criticalAnnounced: false,
        });
      });
    }
    this.structures = s;
  }

  // -------------------------------------------------------------------------
  // Simulation step
  // -------------------------------------------------------------------------

  /** Advance the simulation by `dtMs` (call with BATTLE_TUNING.stepMs). */
  step(dtMs: number = T.stepMs): void {
    if (this.paused) return;
    this.now += dtMs;
    this.stepCount++;

    if (this.status === "WAITING") {
      if (this.phaseEndsAt !== null && this.now >= this.phaseEndsAt) this.startMatch();
      return;
    }
    if (this.status === "COUNTDOWN") {
      if (this.phaseEndsAt !== null && this.now >= this.phaseEndsAt) this.beginBattle();
      return;
    }
    if (this.status === "ENDED") {
      if (this.phaseEndsAt !== null && this.now >= this.phaseEndsAt) this.resetMatch(true);
      return;
    }

    // BATTLE / SUDDEN_DEATH
    if (this.status === "BATTLE" && this.now >= this.battleEndsAt) {
      this.resolveTimeout();
      if (this.status !== "BATTLE" && this.status !== "SUDDEN_DEATH") return;
    }

    this.processQueue("A");
    this.processQueue("B");

    const dt = dtMs / 1000;
    const search = this.stepCount % T.targetSearchEvery === 0;
    this.computeFrontlines();
    for (const unit of this.units) this.updateUnit(unit, dt, search);
    this.separate();
    for (const s of this.structures) if (s.hp > 0) this.updateTower(s);

    this.flushHits();
    this.units = this.units.filter((u) => !(u.state === "DEATH" && this.now >= u.stateUntil));
    this.checkVictory();
  }

  protected beginBattle(): void {
    this.status = "BATTLE";
    this.phaseEndsAt = null;
    this.battleStartedAt = this.now;
    this.battleEndsAt = this.now + this.config.matchDuration * 1000;
    this.nextSpawnAt = { A: this.now, B: this.now };
    this.pushFeed({ kind: "INFO", team: null, text: "⚔️ BATTLE DIMULAI!" });
  }

  protected resolveTimeout(): void {
    const a = this.base("A").hp;
    const b = this.base("B").hp;
    if (a !== b) {
      this.finish(a > b ? "A" : "B", "TIMER_HP");
      return;
    }
    if (this.config.suddenDeath) {
      this.status = "SUDDEN_DEATH";
      this.pushFeed({ kind: "SUDDEN_DEATH", team: null, text: `💀 SUDDEN DEATH! Damage ke base ×${T.suddenDeathBaseMultiplier}` });
      return;
    }
    this.finish(this.leaderByHp(), "TIMER_HP");
  }

  /** Higher base HP, then total tower HP, then damage dealt; Team A on a perfect tie. */
  protected leaderByHp(): TeamId {
    const score = (team: TeamId): [number, number, number] => [
      this.base(team).hp,
      this.structures.filter((s) => s.team === team && s.kind === "TOWER").reduce((sum, s) => sum + Math.max(0, s.hp), 0),
      this.teamStats[team].damageDealt,
    ];
    const a = score("A");
    const b = score("B");
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i] ? "A" : "B";
    return "A";
  }

  protected checkVictory(): void {
    const aDead = this.base("A").hp <= 0;
    const bDead = this.base("B").hp <= 0;
    if (!aDead && !bDead) return;
    const reason = this.status === "SUDDEN_DEATH" ? "SUDDEN_DEATH" : "BASE_DESTROYED";
    if (aDead && bDead) this.finish(this.base("A").hp >= this.base("B").hp ? "A" : "B", reason);
    else this.finish(aDead ? "B" : "A", reason);
  }

  protected finish(winner: TeamId, reason: MatchResult["reason"]): void {
    this.status = "ENDED";
    this.phaseEndsAt = this.config.autoNextMatch ? this.now + this.config.resultSeconds * 1000 : null;
    const loserBase = this.base(OTHER[winner]);
    if (loserBase.hp <= 0) this.pushFx({ k: "destroy", x: loserBase.x, y: loserBase.y, team: loserBase.team, kind: "BASE" });
    this.pushFx({ k: "shake", power: 14 });

    const entries = [...this.contributions.values()];
    const best = (key: keyof Pick<ContributionEntry, "unitsSpawned" | "damage" | "buildingDamage" | "healing">) => {
      const top = [...entries].sort((x, y) => y[key] - x[key])[0];
      return top && top[key] > 0 ? { ...top } : null;
    };
    const teams = {
      A: { ...this.teamStats.A, activeUnits: this.activeCount("A"), queued: this.queuedCount("A") },
      B: { ...this.teamStats.B, activeUnits: this.activeCount("B"), queued: this.queuedCount("B") },
    };
    this.result = {
      matchId: this.matchId,
      winner,
      reason,
      durationSeconds: Math.round((this.now - this.battleStartedAt) / 1000),
      baseHp: { A: Math.max(0, Math.round(this.base("A").hp)), B: Math.max(0, Math.round(this.base("B").hp)) },
      teams,
      totalGifts: teams.A.gifts + teams.B.gifts,
      topContributors: this.topContributors(),
      mvp: {
        mostUnits: best("unitsSpawned"),
        mostDamage: best("damage"),
        mostBuildingDamage: best("buildingDamage"),
        mostHealing: best("healing"),
      },
    };
  }

  /** Builds a realtime frame and drains the FX buffer. */
  snapshot(): BattleSnapshot {
    const running = this.status === "BATTLE";
    const units: UnitWire[] = this.units.map((u) => {
      let flags = 0;
      if (this.now < u.shieldUntil) flags |= UNIT_FLAG_SHIELD;
      if (this.now < u.rageUntil) flags |= UNIT_FLAG_RAGE;
      if (this.now < u.stunUntil) flags |= UNIT_FLAG_STUN;
      if (this.now < u.abilityAnimUntil) flags |= UNIT_FLAG_ABILITY;
      const facing: 1 | -1 = u.facingY ?? FORWARD[u.team];
      return [u.id, u.team, u.type, Math.round(u.x), Math.round(u.y), Math.round((u.hp / u.maxHp) * 1000), u.state, facing, flags];
    });
    const fx = this.fx.slice(-T.fxMaxPerFrame);
    this.fx = [];

    const teamView = (team: TeamId) => ({
      ...this.config.teams[team],
      ...this.teamStats[team],
      damageDealt: Math.round(this.teamStats[team].damageDealt),
      buildingDamage: Math.round(this.teamStats[team].buildingDamage),
      activeUnits: this.activeCount(team),
      queued: this.queuedCount(team),
    });

    return {
      matchId: this.matchId,
      status: this.paused ? "PAUSED" : this.status,
      pausedFrom: this.paused ? this.status : null,
      t: this.now,
      timeLeft: running || (this.paused && this.status === "BATTLE") ? Math.max(0, Math.ceil((this.battleEndsAt - this.now) / 1000)) : null,
      phaseTimeLeft: this.phaseEndsAt !== null ? Math.max(0, Math.ceil((this.phaseEndsAt - this.now) / 1000)) : null,
      teams: { A: teamView("A"), B: teamView("B") },
      structures: this.structures.map((s) => ({
        id: s.id,
        team: s.team,
        kind: s.kind,
        x: s.x,
        y: s.y,
        radius: s.radius,
        hp: Math.max(0, Math.round(s.hp)),
        maxHp: s.maxHp,
      })),
      units,
      fx,
      feed: this.feed.slice(-T.feedMax),
      top: this.topContributors(),
      result: this.result,
    };
  }
}
