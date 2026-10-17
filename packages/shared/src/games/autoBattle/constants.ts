import type {
  BattleConfig,
  BattleGiftMapping,
  TeamId,
  UnitStats,
  UnitType,
} from "./types.js";

export const BATTLE_ARENA = {
  width: 1080,
  height: 1920,
  /** Playable rectangle — the dirt lane of the arena art (PRD §3.1 single open battlefield). */
  minX: 250,
  maxX: 830,
  minY: 250,
  maxY: 1720,
  /** Where the arena background image (public/battle/arena_bg.jpg, 1080×1617) is drawn. */
  backgroundTop: 150,
  backgroundHeight: 1617,
} as const;

/**
 * Structure layout (PRD §4–5): one base + two towers per team, aligned to the
 * castles/towers painted in the arena art. Team A top, Team B bottom.
 */
export const BATTLE_LAYOUT: Record<TeamId, { base: [number, number]; towers: [number, number][]; spawn: [number, number] }> = {
  A: { base: [540, 300], towers: [[333, 360], [748, 360]], spawn: [540, 470] },
  B: { base: [540, 1650], towers: [[322, 1665], [756, 1665]], spawn: [540, 1480] },
};

export const BASE_RADIUS = 105;
export const TOWER_RADIUS = 50;
export const UNIT_BASE_RADIUS = 18;

export const UNIT_TYPES: readonly UnitType[] = [
  "SPEARMAN",
  "ARCHER",
  "TANK",
  "BERSERKER",
  "MAGE",
  "HEAVY",
  "SUPPORT",
  "SIEGE",
];

export interface UnitMeta {
  label: string;
  role: string;
  /** Short role tag as on the character sheet (TANK / RANGED / DPS ...). */
  tag: string;
  icon: string;
  /** Relative size — PRD §7. */
  size: number;
  /** Gift tier — PRD §14. */
  tier: 1 | 2 | 3 | 4;
  ability: string;
}

export const UNIT_META: Record<UnitType, UnitMeta> = {
  TANK: { label: "Guardian", role: "Frontline / Defender", tag: "TANK", icon: "🛡️", size: 1.25, tier: 2, ability: "Shield Wall" },
  ARCHER: { label: "Ranger", role: "Ranged DPS", tag: "RANGED", icon: "🏹", size: 0.9, tier: 1, ability: "Multi Shot" },
  BERSERKER: { label: "Berserker", role: "High DPS", tag: "DPS", icon: "🪓", size: 1.1, tier: 2, ability: "Rage" },
  HEAVY: { label: "Golem", role: "Building Destroyer", tag: "HEAVY", icon: "🔨", size: 1.5, tier: 3, ability: "Ground Smash" },
  MAGE: { label: "Mage", role: "Area Damage", tag: "MAGIC", icon: "🔮", size: 1.0, tier: 3, ability: "Meteor" },
  SPEARMAN: { label: "Spearman", role: "Fast Raider", tag: "SPEED", icon: "⚡", size: 0.8, tier: 1, ability: "Dash" },
  SUPPORT: { label: "Priest", role: "Healer / Support", tag: "SUPPORT", icon: "✚", size: 1.0, tier: 3, ability: "Holy Light" },
  SIEGE: { label: "Siege", role: "Building Killer", tag: "SIEGE", icon: "⚙️", size: 1.2, tier: 4, ability: "Heavy Bomb" },
};

/** PRD §8 Unit Specifications (+ buildingDamage, a balancing knob — see UnitStats). */
export const DEFAULT_UNIT_STATS: Record<UnitType, UnitStats> = {
  TANK: { hp: 1500, damage: 80, attackSpeed: 1.5, range: 1, moveSpeed: 0.75, abilityCooldown: 8, abilityPower: 1, buildingDamage: 0.25, targetPriority: "NEAREST_ENEMY" },
  ARCHER: { hp: 550, damage: 120, attackSpeed: 1.2, range: 6, moveSpeed: 1.0, abilityCooldown: 0, abilityPower: 1, buildingDamage: 0.25, targetPriority: "NEAREST_ENEMY" },
  BERSERKER: { hp: 800, damage: 180, attackSpeed: 1.1, range: 1, moveSpeed: 1.2, abilityCooldown: 0, abilityPower: 1, buildingDamage: 0.3, targetPriority: "NEAREST_ENEMY" },
  HEAVY: { hp: 2500, damage: 150, attackSpeed: 2.2, range: 1, moveSpeed: 0.55, abilityCooldown: 10, abilityPower: 1, buildingDamage: 0.75, targetPriority: "DEFENSE_THEN_BASE" },
  MAGE: { hp: 700, damage: 220, attackSpeed: 2.0, range: 5, moveSpeed: 0.9, abilityCooldown: 12, abilityPower: 1, buildingDamage: 0.3, targetPriority: "LARGEST_CLUSTER" },
  SPEARMAN: { hp: 450, damage: 100, attackSpeed: 0.8, range: 2, moveSpeed: 1.5, abilityCooldown: 3, abilityPower: 1, buildingDamage: 0.25, targetPriority: "BASE_THEN_DEFENSE_THEN_UNIT" },
  SUPPORT: { hp: 600, damage: 40, attackSpeed: 1.8, range: 5, moveSpeed: 0.8, abilityCooldown: 12, abilityPower: 1, buildingDamage: 0.25, targetPriority: "LOWEST_HP_ALLY" },
  SIEGE: { hp: 900, damage: 300, attackSpeed: 3.0, range: 8, moveSpeed: 0.5, abilityCooldown: 8, abilityPower: 1, buildingDamage: 1, targetPriority: "DEFENSE_THEN_BASE" },
};

/** PRD §16 Contribution Score baseline (values configurable). */
export const DEFAULT_SPAWN_SCORE: Record<UnitType, number> = {
  SPEARMAN: 10,
  ARCHER: 10,
  TANK: 10,
  BERSERKER: 15,
  MAGE: 25,
  SUPPORT: 20,
  HEAVY: 30,
  SIEGE: 40,
};

/** Fixed simulation constants that aren't worth exposing to the host. */
export const BATTLE_TUNING = {
  stepMs: 50,
  /** Target search runs every N steps (20Hz / 2 = 10Hz, PRD §28 AI Tick). */
  targetSearchEvery: 2,
  spawnInvulnMs: 450,
  deathLingerMs: 600,
  separationRadiusFactor: 2.2,
  shieldDurationMs: 3000,
  shieldReduction: 0.4,
  rageThreshold: 0.4,
  rageDurationMs: 4000,
  rageAttackSpeedBonus: 0.4,
  multiShotEvery: 5,
  smashRadius: 95,
  smashStunMs: 1000,
  meteorRadius: 120,
  meteorDamageFactor: 1.6,
  bombRadius: 100,
  bombDamageFactor: 1.3,
  healAmount: 150,
  healCooldownMs: 2500,
  holyLightHeal: 250,
  holyLightRadius: 170,
  clusterRadius: 110,
  dashSpeedFactor: 3.2,
  dashDurationMs: 380,
  suddenDeathBaseMultiplier: 2,
  /** Each feed notification aggregates same viewer+gift within this window (PRD §17). */
  feedAggregateMs: 2500,
  feedMax: 5,
  fxMaxPerFrame: 140,
  topContributors: 5,
} as const;

/**
 * Defaults. Unit stats follow PRD §8; structure numbers were tuned with
 * simulated matches (PRD §38/§42 — "angka ... configurable agar dapat diuji
 * melalui simulasi"): with the PRD baseline (base 10k, towers 2.5k/100dmg,
 * no castle defense) one early skirmish snowballed into a ~1 minute match.
 * These values give ~2.5–4 minute matches with comebacks.
 */
export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  matchDuration: 300,
  baseHp: 15000,
  towerHp: 4000,
  towerDamage: 300,
  towerRange: 6,
  towerAttackSpeed: 1,
  baseDamage: 250,
  baseRange: 7,
  baseAttackSpeed: 1,
  maxUnitsPerTeam: 40,
  suddenDeath: true,
  damageMultiplier: 1,
  countdownSeconds: 3,
  resultSeconds: 8,
  autoNextMatch: true,
  lobbySeconds: 15,
  spawnStaggerMs: 100,
  rangeUnitPx: 40,
  speedUnitPx: 60,
  teams: {
    A: { name: "TEAM BIRU", emblem: "👑", color: "#2F7BFF" },
    B: { name: "TEAM MERAH", emblem: "👑", color: "#FF3B3B" },
  },
  units: DEFAULT_UNIT_STATS,
  spawnScore: DEFAULT_SPAWN_SCORE,
};

/**
 * Starter Gift → Team → Unit table (PRD §13). Ids and coin prices checked
 * against TikTok's public gift catalog (region ID, Sept 2026); the server
 * fills in icons from the same catalog. Matching falls back to the gift
 * name if TikTok ever serves a different id.
 */
export const DEFAULT_BATTLE_GIFT_MAPPINGS: Omit<BattleGiftMapping, "id">[] = [
  // Team A — Blue
  { giftId: "5655", giftName: "Rose", team: "A", unitType: "SPEARMAN", quantity: 1, enabled: true, diamondCount: 1 },
  { giftId: "6064", giftName: "GG", team: "A", unitType: "ARCHER", quantity: 1, enabled: true, diamondCount: 1 },
  { giftId: "5487", giftName: "Finger Heart", team: "A", unitType: "TANK", quantity: 1, enabled: true, diamondCount: 5 },
  { giftId: "5879", giftName: "Doughnut", team: "A", unitType: "BERSERKER", quantity: 1, enabled: true, diamondCount: 30 },
  { giftId: "5658", giftName: "Perfume", team: "A", unitType: "MAGE", quantity: 1, enabled: true, diamondCount: 20 },
  { giftId: "5660", giftName: "Hand Heart", team: "A", unitType: "HEAVY", quantity: 1, enabled: true, diamondCount: 100 },
  { giftId: "5585", giftName: "Confetti", team: "A", unitType: "SUPPORT", quantity: 2, enabled: true, diamondCount: 100 },
  { giftId: "11046", giftName: "Galaxy", team: "A", unitType: "SIEGE", quantity: 1, enabled: true, diamondCount: 1000 },
  // Team B — Red
  { giftId: "5269", giftName: "TikTok", team: "B", unitType: "SPEARMAN", quantity: 1, enabled: true, diamondCount: 1 },
  { giftId: "5827", giftName: "Ice Cream Cone", team: "B", unitType: "ARCHER", quantity: 1, enabled: true, diamondCount: 1 },
  { giftId: "9947", giftName: "Friendship Necklace", team: "B", unitType: "TANK", quantity: 1, enabled: true, diamondCount: 10 },
  { giftId: "8913", giftName: "Rosa", team: "B", unitType: "BERSERKER", quantity: 1, enabled: true, diamondCount: 10 },
  { giftId: "6427", giftName: "Hat and Mustache", team: "B", unitType: "MAGE", quantity: 1, enabled: true, diamondCount: 99 },
  { giftId: "6267", giftName: "Corgi", team: "B", unitType: "HEAVY", quantity: 1, enabled: true, diamondCount: 299 },
  { giftId: "5509", giftName: "Sunglasses", team: "B", unitType: "SUPPORT", quantity: 2, enabled: true, diamondCount: 199 },
  { giftId: "7168", giftName: "Money Gun", team: "B", unitType: "SIEGE", quantity: 1, enabled: true, diamondCount: 500 },
];

/** Merge a partial/stale stored config over the defaults so new fields always exist. */
export function resolveBattleConfig(partial?: Partial<BattleConfig> | null): BattleConfig {
  const p = partial ?? {};
  const units = { ...DEFAULT_UNIT_STATS };
  for (const type of UNIT_TYPES) {
    units[type] = { ...DEFAULT_UNIT_STATS[type], ...(p.units?.[type] ?? {}) };
  }
  return {
    ...DEFAULT_BATTLE_CONFIG,
    ...p,
    teams: {
      A: { ...DEFAULT_BATTLE_CONFIG.teams.A, ...(p.teams?.A ?? {}) },
      B: { ...DEFAULT_BATTLE_CONFIG.teams.B, ...(p.teams?.B ?? {}) },
    },
    units,
    spawnScore: { ...DEFAULT_SPAWN_SCORE, ...(p.spawnScore ?? {}) },
  };
}
