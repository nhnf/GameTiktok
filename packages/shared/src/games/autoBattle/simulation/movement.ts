import { BATTLE_TUNING as T } from "../constants.js";
import { FORWARD, dist, type SimUnit } from "./simTypes.js";
import { SimTargeting } from "./targeting.js";

/** Per-unit state machine, movement and soft separation (PRD §10, §31). */
export abstract class SimMovement extends SimTargeting {
  // -------------------------------------------------------------------------
  // Unit AI (PRD §9–10, §31)
  // -------------------------------------------------------------------------

  protected updateUnit(u: SimUnit, dt: number, search: boolean): void {
    if (u.state === "DEATH") return;
    if (u.state === "SPAWNING") {
      if (this.now < u.stateUntil) return;
      u.state = "IDLE";
      search = true;
    }

    // Berserker Rage: one-shot trigger below 40% HP.
    if (u.type === "BERSERKER" && !u.rageUsed && u.hp / u.maxHp < T.rageThreshold) {
      u.rageUsed = true;
      u.rageUntil = this.now + T.rageDurationMs * u.stats.abilityPower;
      u.abilityAnimUntil = this.now + 400;
      this.pushFx({ k: "skill", id: u.id });
    }

    if (this.now < u.stunUntil) return;

    if (search || !this.targetValid(u, u.target)) this.acquireTarget(u);
    this.engageFrontline(u);
    const target = u.target;
    if (!target) {
      this.advance(u, u.x + u.laneOffset * 0.01, u.y + FORWARD[u.team] * 100, dt);
      return;
    }

    const [tx, ty, tr] = this.targetPos(target);
    const gap = dist(u.x, u.y, tx, ty) - u.radius - tr;
    const reach = this.reachPx(u.stats.range);

    if (gap > reach) {
      if (u.type === "SPEARMAN" && u.dashTarget !== target && this.now >= u.abilityReadyAt) {
        u.dashTarget = target;
        u.dashUntil = this.now + T.dashDurationMs;
        u.abilityReadyAt = this.now + u.stats.abilityCooldown * 1000;
        u.abilityAnimUntil = this.now + T.dashDurationMs;
      }
      this.advance(u, tx, ty, dt, gap - reach);
      return;
    }

    u.state = "ATTACKING";
    this.tryAbility(u, target);
    if (u.type === "SUPPORT" && target.unit && target.unit.team === u.team) {
      if (this.now >= u.healReadyAt) {
        u.healReadyAt = this.now + T.healCooldownMs;
        this.pushFx({ k: "atk", id: u.id });
        this.heal(u, target.unit, T.healAmount * u.stats.abilityPower);
        this.pushFx({ k: "shot", from: [u.x, u.y], to: [tx, ty], team: u.team, style: "heal" });
      }
      return;
    }
    if (this.now >= u.nextAttackAt) this.attack(u, target, tx, ty);
  }

  protected advance(u: SimUnit, tx: number, ty: number, dt: number, maxStep = Infinity): void {
    u.state = "MOVING";
    const dashing = this.now < u.dashUntil;
    const speed = u.stats.moveSpeed * this.config.speedUnitPx * (dashing ? T.dashSpeedFactor : 1);
    const dx = tx - u.x;
    const dy = ty - u.y;
    const len = Math.hypot(dx, dy) || 1;
    const stepLen = Math.min(speed * dt, maxStep);
    const fromY = u.y;
    u.x += (dx / len) * stepLen;
    u.y += (dy / len) * stepLen;
    this.holdFrontline(u, fromY);
    this.clamp(u);
  }

  /** PRD §10 soft separation — units never collapse into one stack. */
  protected separate(): void {
    const live = this.units.filter((u) => u.state !== "DEATH");
    for (const u of live) u.prevY = u.y;
    for (let i = 0; i < live.length; i++) {
      const a = live[i];
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j];
        const min = (a.radius + b.radius) * 0.95;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= min) continue;
        const push = (min - (d || 0.01)) / 2;
        const nx = d > 0 ? dx / d : this.random() - 0.5;
        const ny = d > 0 ? dy / d : this.random() - 0.5;
        const wa = b.radius / (a.radius + b.radius);
        a.x -= nx * push * 2 * wa;
        a.y -= ny * push * 2 * wa;
        b.x += nx * push * 2 * (1 - wa);
        b.y += ny * push * 2 * (1 - wa);
      }
      for (const s of this.structures) {
        if (s.hp <= 0) continue;
        const dx = a.x - s.x;
        const dy = a.y - s.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const min = a.radius + s.radius;
        if (d < min) {
          a.x = s.x + (dx / d) * min;
          a.y = s.y + (dy / d) * min;
        }
      }
      this.clamp(a);
    }
    for (const u of live) this.holdFrontline(u, u.prevY ?? u.y);
  }
}
