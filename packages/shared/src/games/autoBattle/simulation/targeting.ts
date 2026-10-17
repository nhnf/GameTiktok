import { BATTLE_ARENA, BATTLE_TUNING as T } from "../constants.js";
import type { StructureKind } from "../types.js";
import { FORWARD, OTHER, dist, type SimStructure, type SimUnit, type Target } from "./simTypes.js";
import { SimCombat } from "./combat.js";

/** Target selection and the enemy front line (PRD §9–10). */
export abstract class SimTargeting extends SimCombat {
  protected computeFrontlines(): void {
    for (const team of ["A", "B"] as const) {
      let best: SimUnit | null = null;
      for (const o of this.units) {
        if (o.team === team || o.state === "DEATH" || o.state === "SPAWNING") continue;
        if (!best || FORWARD[team] * o.y < FORWARD[team] * best.y) best = o;
      }
      this.frontline[team] = best;
    }
  }

  /** The furthest a unit may advance: just short of the enemy's most advanced unit. */
  protected frontLimit(u: SimUnit): number | null {
    const front = this.frontline[u.team];
    return front ? front.y - FORWARD[u.team] * u.radius * 0.6 : null;
  }

  /** Never let a move (or a separation push) carry a unit further past the enemy front. */
  protected holdFrontline(u: SimUnit, fromY: number): void {
    const limit = this.frontLimit(u);
    if (limit === null) return;
    const f = FORWARD[u.team];
    if (f * (u.y - limit) > 0 && f * (u.y - fromY) > 0) u.y = f * (fromY - limit) > 0 ? fromY : limit;
  }

  /**
   * At the enemy front line every unit — including building-hunters like
   * Golem, Siege and Spearman — must fight its way through: keep a target
   * that is already in reach, otherwise take on the front-most enemy.
   */
  protected engageFrontline(u: SimUnit): void {
    const front = this.frontline[u.team];
    const limit = this.frontLimit(u);
    if (!front || limit === null || FORWARD[u.team] * (u.y - limit) < -14) return;
    const t = u.target;
    if (t && this.targetValid(u, t)) {
      if (t.unit && t.unit.team === u.team) return; // healer busy healing
      const [tx, ty, tr] = this.targetPos(t);
      if (dist(u.x, u.y, tx, ty) - u.radius - tr <= this.reachPx(u.stats.range) + 2) return;
      if (t.unit === front) return;
    }
    u.target = { unit: front };
  }

  protected clamp(u: SimUnit): void {
    u.x = Math.min(BATTLE_ARENA.maxX - u.radius, Math.max(BATTLE_ARENA.minX + u.radius, u.x));
    u.y = Math.min(BATTLE_ARENA.maxY - u.radius, Math.max(BATTLE_ARENA.minY + u.radius, u.y));
  }

  protected targetValid(u: SimUnit, t: Target | null): boolean {
    if (!t) return false;
    if (t.struct) return t.struct.hp > 0;
    const other = t.unit;
    if (other.state === "DEATH" || other.hp <= 0) return false;
    if (other.team === u.team) return u.type === "SUPPORT";
    return other.state !== "SPAWNING";
  }

  protected nearestStructure(u: SimUnit, kinds: StructureKind[]): SimStructure | null {
    for (const kind of kinds) {
      const s = this.nearest(u, this.liveStructures(OTHER[u.team], kind));
      if (s) return s;
    }
    return null;
  }

  protected acquireTarget(u: SimUnit): void {
    const prev = u.target;
    const sight = Math.max(320, this.reachPx(u.stats.range) + 200);
    const unitsInSight = () => this.enemyUnits(u.team).filter((o) => dist(u.x, u.y, o.x, o.y) <= sight);
    const toTarget = (x: SimUnit | SimStructure | null): Target | null =>
      x ? ("stats" in x ? { unit: x } : { struct: x }) : null;

    let next: Target | null = null;
    switch (u.stats.targetPriority) {
      case "DEFENSE_THEN_BASE":
        next = toTarget(this.nearestStructure(u, ["TOWER", "BASE"]));
        break;
      case "BASE_THEN_DEFENSE_THEN_UNIT":
        next =
          toTarget(this.nearestStructure(u, ["BASE", "TOWER"])) ?? toTarget(this.nearest(u, this.enemyUnits(u.team)));
        break;
      case "LARGEST_CLUSTER": {
        const candidates = unitsInSight();
        let best: SimUnit | null = null;
        let bestScore = -Infinity;
        for (const c of candidates) {
          let neighbours = 0;
          for (const o of candidates) if (dist(c.x, c.y, o.x, o.y) <= T.clusterRadius) neighbours++;
          const score = neighbours * 1000 - dist(u.x, u.y, c.x, c.y);
          if (score > bestScore) {
            bestScore = score;
            best = c;
          }
        }
        next = toTarget(best) ?? toTarget(this.nearestStructure(u, ["TOWER", "BASE"]));
        break;
      }
      case "LOWEST_HP_ALLY": {
        const hurt = this.units.filter(
          (o) => o !== u && o.team === u.team && o.state !== "DEATH" && o.state !== "SPAWNING" && o.hp < o.maxHp && dist(u.x, u.y, o.x, o.y) <= 520,
        );
        hurt.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        if (hurt[0]) {
          next = { unit: hurt[0] };
          break;
        }
        // Nobody to heal: fight whatever is close, else escort the frontline.
        const enemy = this.nearest(u, unitsInSight());
        if (enemy) {
          next = { unit: enemy };
          break;
        }
        const allies = this.units.filter((o) => o !== u && o.team === u.team && o.state !== "DEATH" && o.type !== "SUPPORT");
        const lead = allies.sort((a, b) => FORWARD[u.team] * (b.y - a.y))[0];
        next = lead ? { unit: lead } : toTarget(this.nearestStructure(u, ["TOWER", "BASE"]));
        break;
      }
      case "NEAREST_ENEMY":
      default:
        next = toTarget(this.nearest(u, unitsInSight())) ?? toTarget(this.nearestStructure(u, ["TOWER", "BASE"]));
        break;
    }

    // Target locking (PRD §10): keep a still-valid target unless the new pick
    // is a strictly higher priority kind of thing (e.g. a unit wandered into sight).
    if (prev && this.targetValid(u, prev) && next && prev !== next) {
      const sameKind = Boolean(prev.unit) === Boolean(next.unit);
      if (sameKind && u.stats.targetPriority !== "LOWEST_HP_ALLY") {
        const [px, py] = this.targetPos(prev);
        const [nx, ny] = this.targetPos(next);
        if (dist(u.x, u.y, px, py) <= dist(u.x, u.y, nx, ny) + 40) next = prev;
      }
    }
    u.target = next;
  }
}
