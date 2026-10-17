import { BATTLE_TUNING as T, UNIT_META } from "../constants.js";
import { OTHER, dist, type SimStructure, type SimUnit, type Target } from "./simTypes.js";
import { SimCore } from "./core.js";

/** Attacks, abilities, damage, healing, deaths and tower fire (PRD §8–10, §26). */
export abstract class SimCombat extends SimCore {
  protected reachPx(range: number): number {
    return range <= 1 ? 8 : (range - 0.8) * this.config.rangeUnitPx;
  }

  protected attack(u: SimUnit, target: Target, tx: number, ty: number): void {
    const rage = this.now < u.rageUntil ? 1 + T.rageAttackSpeedBonus : 1;
    u.nextAttackAt = this.now + (u.stats.attackSpeed * 1000) / rage;
    u.attackCount++;
    this.pushFx({ k: "atk", id: u.id });
    u.facingY = ty >= u.y ? 1 : -1;

    const style = u.type === "ARCHER" ? "arrow" : u.type === "MAGE" ? "magic" : u.type === "SIEGE" ? "bomb" : u.type === "SUPPORT" ? "magic" : u.type === "SPEARMAN" ? "spear" : null;
    if (style) this.pushFx({ k: "shot", from: [u.x, u.y], to: [tx, ty], team: u.team, style });

    this.damage(u, target, u.stats.damage);

    if (u.type === "MAGE") {
      // Area damage role: small splash around the primary target.
      for (const o of this.enemyUnits(u.team)) {
        if (o !== target.unit && dist(o.x, o.y, tx, ty) <= 60) this.damage(u, { unit: o }, u.stats.damage * 0.5);
      }
    }

    if (u.type === "ARCHER" && u.attackCount % T.multiShotEvery === 0) {
      const reach = this.reachPx(u.stats.range);
      const extra =
        this.enemyUnits(u.team).find((o) => o !== target.unit && dist(u.x, u.y, o.x, o.y) - o.radius - u.radius <= reach) ?? null;
      const second: Target = extra ? { unit: extra } : target;
      const [sx, sy] = this.targetPos(second);
      this.pushFx({ k: "shot", from: [u.x, u.y], to: [sx, sy], team: u.team, style: "arrow" });
      this.damage(u, second, u.stats.damage * u.stats.abilityPower);
      u.abilityAnimUntil = this.now + 300;
    }
  }

  protected tryAbility(u: SimUnit, target: Target): void {
    if (this.now < u.abilityReadyAt) return;
    const power = u.stats.abilityPower;
    const [tx, ty] = this.targetPos(target);
    const cooldown = u.stats.abilityCooldown * 1000;

    switch (u.type) {
      case "TANK":
        if (target.unit?.team === u.team) return;
        u.shieldUntil = this.now + T.shieldDurationMs * power;
        break;
      case "HEAVY":
        this.pushFx({ k: "aoe", x: u.x, y: u.y, r: T.smashRadius, style: "smash" });
        this.pushFx({ k: "shake", power: 6 });
        this.areaDamage(u, u.x, u.y, T.smashRadius, u.stats.damage * power, T.smashStunMs);
        break;
      case "MAGE":
        if (target.unit?.team === u.team) return;
        this.pushFx({ k: "aoe", x: tx, y: ty, r: T.meteorRadius, style: "meteor" });
        this.pushFx({ k: "shake", power: 8 });
        this.areaDamage(u, tx, ty, T.meteorRadius, u.stats.damage * T.meteorDamageFactor * power, 0);
        break;
      case "SIEGE":
        this.pushFx({ k: "aoe", x: tx, y: ty, r: T.bombRadius, style: "bomb" });
        this.pushFx({ k: "shake", power: 7 });
        this.areaDamage(u, tx, ty, T.bombRadius, u.stats.damage * T.bombDamageFactor * power, 0);
        break;
      case "SUPPORT": {
        const allies = this.units.filter(
          (o) => o.team === u.team && o.state !== "DEATH" && o.hp < o.maxHp && dist(u.x, u.y, o.x, o.y) <= T.holyLightRadius,
        );
        if (allies.length === 0) return;
        this.pushFx({ k: "aoe", x: u.x, y: u.y, r: T.holyLightRadius, style: "holy" });
        for (const a of allies) this.heal(u, a, T.holyLightHeal * power);
        break;
      }
      default:
        return; // Archer/Berserker/Spearman abilities are triggered elsewhere.
    }
    u.abilityReadyAt = this.now + cooldown;
    u.abilityAnimUntil = this.now + 450;
    this.pushFx({ k: "skill", id: u.id });
  }

  protected areaDamage(u: SimUnit, x: number, y: number, r: number, amount: number, stunMs: number): void {
    for (const o of this.enemyUnits(u.team)) {
      if (dist(o.x, o.y, x, y) - o.radius > r) continue;
      this.damage(u, { unit: o }, amount);
      if (stunMs > 0) o.stunUntil = Math.max(o.stunUntil, this.now + stunMs);
    }
    for (const s of this.liveStructures(OTHER[u.team])) {
      if (dist(s.x, s.y, x, y) - s.radius <= r) this.damage(u, { struct: s }, amount);
    }
  }

  protected damage(source: SimUnit | SimStructure, target: Target, raw: number): void {
    let amount = raw * this.config.damageMultiplier;
    if (target.unit) {
      const v = target.unit;
      if (v.state === "DEATH" || v.state === "SPAWNING") return;
      if (this.now < v.shieldUntil) amount *= 1 - T.shieldReduction;
      amount = Math.min(amount, v.hp);
      v.hp -= amount;
      this.queueHit(`u${v.id}`, v.x, v.y, amount, false);
      if (v.hp <= 0) this.kill(v);
    } else {
      const s = target.struct;
      if (s.hp <= 0) return;
      if ("stats" in source) amount *= source.stats.buildingDamage;
      if (s.kind === "BASE" && this.status === "SUDDEN_DEATH") amount *= T.suddenDeathBaseMultiplier;
      amount = Math.min(amount, s.hp);
      s.hp -= amount;
      this.queueHit(s.id, s.x, s.y - s.radius * 0.4, amount, false);
      if ("stats" in source) {
        this.teamStats[source.team].buildingDamage += amount;
        if (source.owner) this.contributor(source.owner).buildingDamage += amount;
      }
      this.onStructureDamaged(s, "stats" in source ? source : null);
    }
    if ("stats" in source) {
      this.teamStats[source.team].damageDealt += amount;
      if (source.owner) this.contributor(source.owner).damage += amount;
    }
  }

  protected onStructureDamaged(s: SimStructure, attacker: SimUnit | null): void {
    const teamName = this.config.teams[s.team].name;
    if (s.hp <= 0) {
      s.hp = 0;
      if (s.kind === "TOWER") {
        this.pushFx({ k: "destroy", x: s.x, y: s.y, team: s.team, kind: "TOWER" });
        this.pushFx({ k: "shake", power: 8 });
        const by = attacker ? `${this.config.teams[attacker.team].name} ${UNIT_META[attacker.type].label.toUpperCase()}` : "Serangan";
        this.pushFeed({ kind: "TOWER_DOWN", team: attacker?.team ?? OTHER[s.team], text: `💥 ${by} menghancurkan TOWER ${teamName}!` });
      }
      return;
    }
    if (s.kind === "BASE" && !s.criticalAnnounced && s.hp / s.maxHp < 0.25) {
      s.criticalAnnounced = true;
      this.pushFeed({ kind: "BASE_CRITICAL", team: s.team, text: `👑 BASE ${teamName} KRITIS!` });
    }
  }

  protected heal(healer: SimUnit, target: SimUnit, amount: number): void {
    if (target.state === "DEATH") return;
    const healed = Math.min(amount, target.maxHp - target.hp);
    if (healed <= 0) return;
    target.hp += healed;
    this.queueHit(`u${target.id}`, target.x, target.y, healed, true);
    if (healer.owner) this.contributor(healer.owner).healing += healed;
  }

  protected kill(u: SimUnit): void {
    u.hp = 0;
    u.state = "DEATH";
    u.stateUntil = this.now + T.deathLingerMs;
    u.target = null;
    this.pushFx({ k: "death", x: u.x, y: u.y, team: u.team });
  }

  /** Towers — and the base, when `baseDamage` > 0 — shoot the nearest enemy unit in range. */
  protected updateTower(s: SimStructure): void {
    if (this.now < s.nextAttackAt) return;
    const isBase = s.kind === "BASE";
    const damage = isBase ? this.config.baseDamage : this.config.towerDamage;
    if (damage <= 0) return;
    const range = isBase ? this.config.baseRange : this.config.towerRange;
    const reach = range * this.config.rangeUnitPx + s.radius;
    let best: SimUnit | null = null;
    let bestD = Infinity;
    for (const o of this.enemyUnits(s.team)) {
      const d = dist(s.x, s.y, o.x, o.y);
      if (d <= reach && d < bestD) {
        bestD = d;
        best = o;
      }
    }
    if (!best) return;
    s.nextAttackAt = this.now + (isBase ? this.config.baseAttackSpeed : this.config.towerAttackSpeed) * 1000;
    this.pushFx({ k: "shot", from: [s.x, s.y - s.radius * 0.6], to: [best.x, best.y], team: s.team, style: "tower" });
    this.damage(s, { unit: best }, damage);
  }
}
