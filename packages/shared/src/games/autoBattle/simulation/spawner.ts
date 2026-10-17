import { BATTLE_LAYOUT, BATTLE_TUNING as T, UNIT_BASE_RADIUS, UNIT_META } from "../constants.js";
import { findGiftMapping } from "../gift.js";
import type { BattleGiftInput, GiftProcessResult, TeamId, UnitType } from "../types.js";
import type { Contributor, SimUnit } from "./simTypes.js";
import { SimMovement } from "./movement.js";

/** Gift pipeline (PRD §13–15): validate → de-duplicate → map → FIFO queue → staggered spawn. */
export abstract class SimSpawner extends SimMovement {
  /**
   * Validates and applies one gift event. Gifts are accepted in every phase
   * (lobby, countdown, pause, result screen): what can't spawn right now
   * waits in the team's FIFO queue and spawns as soon as the battle runs and
   * capacity frees up — a paid gift is never silently dropped.
   */
  receiveGift(input: BattleGiftInput): GiftProcessResult {
    if (!input.eventId || !input.viewerId || !input.giftId || !(input.count > 0)) {
      return { ok: false, reason: "INVALID" };
    }
    const mapping = findGiftMapping(this.mappings, input.giftId, input.giftName);
    if (!mapping) return { ok: false, reason: "UNMAPPED" };
    if (!mapping.enabled) return { ok: false, reason: "DISABLED" };
    // Only mark the id once we know the event is actionable, so a gift that
    // arrived before its mapping existed isn't burned forever.
    if (!this.deduper.markIfNew(input.eventId)) return { ok: false, reason: "DUPLICATE" };

    const count = Math.min(Math.floor(input.count), 10_000);
    const quantity = mapping.quantity * count;
    const team = mapping.team;
    const owner: Contributor = { viewerId: input.viewerId, viewerName: input.viewerName, avatarUrl: input.avatarUrl };

    const freeSlots = Math.max(0, this.config.maxUnitsPerTeam - this.activeCount(team) - this.queuedCount(team));
    const running = this.status === "BATTLE" || this.status === "SUDDEN_DEATH";
    const queued = running && !this.paused ? Math.max(0, quantity - freeSlots) : quantity;

    const tail = this.queues[team][this.queues[team].length - 1];
    if (tail && tail.unitType === mapping.unitType && tail.owner?.viewerId === owner.viewerId) tail.remaining += quantity;
    else this.queues[team].push({ unitType: mapping.unitType, remaining: quantity, owner });

    const c = this.contributor(owner);
    c.totalGifts += count;
    this.teamStats[team].gifts += count;
    this.pushSpawnFeed(owner, team, mapping.unitType, quantity);

    return { ok: true, mapping, team, unitType: mapping.unitType, quantity, queued };
  }

  protected processQueue(team: TeamId): void {
    const queue = this.queues[team];
    while (queue.length > 0 && this.now >= this.nextSpawnAt[team] && this.activeCount(team) < this.config.maxUnitsPerTeam) {
      const head = queue[0];
      this.spawnUnit(team, head.unitType, head.owner);
      head.remaining--;
      if (head.remaining <= 0) queue.shift();
      this.nextSpawnAt[team] = this.now + this.config.spawnStaggerMs;
    }
  }

  protected spawnUnit(team: TeamId, type: UnitType, owner: Contributor | null): SimUnit {
    const stats = { ...this.config.units[type] };
    const [sx, sy] = BATTLE_LAYOUT[team].spawn;
    const unit: SimUnit = {
      id: this.nextUnitId++,
      team,
      type,
      stats,
      x: sx + (this.random() * 2 - 1) * 40,
      y: sy + (this.random() * 2 - 1) * 30,
      hp: stats.hp,
      maxHp: stats.hp,
      radius: UNIT_BASE_RADIUS * UNIT_META[type].size,
      state: "SPAWNING",
      stateUntil: this.now + T.spawnInvulnMs,
      target: null,
      nextAttackAt: this.now + T.spawnInvulnMs,
      abilityReadyAt: this.now + stats.abilityCooldown * 500,
      healReadyAt: this.now,
      attackCount: 0,
      shieldUntil: 0,
      rageUntil: 0,
      rageUsed: false,
      stunUntil: 0,
      dashUntil: 0,
      dashTarget: null,
      abilityAnimUntil: 0,
      laneOffset: (this.random() * 2 - 1) * 170,
      owner,
    };
    this.units.push(unit);
    this.teamStats[team].unitsSpawned++;
    if (owner) {
      const c = this.contributor(owner);
      c.unitsSpawned++;
      c.score += this.config.spawnScore[type] ?? 0;
      if (team === "A") c.teamAUnits++;
      else c.teamBUnits++;
    }
    this.pushFx({ k: "spawn", x: unit.x, y: unit.y, team });
    return unit;
  }

  /** PRD §17 — "@Ahmad ×5 BLUE ARCHER" instead of five separate toasts. */
  protected pushSpawnFeed(owner: Contributor, team: TeamId, unitType: UnitType, count: number): void {
    const recent = [...this.feed]
      .reverse()
      .find(
        (f) =>
          f.kind === "SPAWN" &&
          f.team === team &&
          f.unitType === unitType &&
          f.viewerName === owner.viewerName &&
          this.now - f.at <= T.feedAggregateMs,
      );
    const label = `${this.config.teams[team].name} ${UNIT_META[unitType].label.toUpperCase()}`;
    if (recent) {
      recent.count = (recent.count ?? 1) + count;
      recent.at = this.now;
      recent.text = `@${owner.viewerName} ×${recent.count} ${label}`;
      // Move to the end so it reads as the newest item.
      this.feed = this.feed.filter((f) => f !== recent);
      this.feed.push(recent);
      return;
    }
    this.pushFeed({
      kind: "SPAWN",
      team,
      text: count > 1 ? `@${owner.viewerName} ×${count} ${label}` : `@${owner.viewerName} memanggil ${label}!`,
      viewerName: owner.viewerName,
      avatarUrl: owner.avatarUrl,
      unitType,
      count,
    });
  }
}
