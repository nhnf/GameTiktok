/**
 * Auto Battle Arena — domain types shared between apps/server and apps/web.
 * Mirrors Auto Battle Arena/PRD_TikTok_LIVE_Auto_Battle_Arena.md.
 *
 * Coordinates are overlay pixels (1080×1920, PRD §3.1) so the renderer can
 * draw the simulation without any transform.
 */

/** Team A = Blue (top, moves down). Team B = Red (bottom, moves up). */
export type TeamId = "A" | "B";

export type UnitType =
  | "TANK"
  | "ARCHER"
  | "BERSERKER"
  | "HEAVY"
  | "MAGE"
  | "SPEARMAN"
  | "SUPPORT"
  | "SIEGE";

/** PRD §9 — Targeting System. */
export type TargetPriority =
  | "NEAREST_ENEMY"
  | "DEFENSE_THEN_BASE"
  | "LARGEST_CLUSTER"
  | "BASE_THEN_DEFENSE_THEN_UNIT"
  | "LOWEST_HP_ALLY";

/** PRD §31 — Unit State Machine. */
export type UnitState = "SPAWNING" | "IDLE" | "MOVING" | "ATTACKING" | "DEATH";

/** PRD §8 — per-unit tunables, all host-editable (PRD §33). */
export interface UnitStats {
  hp: number;
  damage: number;
  /** Seconds between attacks. */
  attackSpeed: number;
  /** In range units (1 = melee). Converted to px via BattleConfig.rangeUnitPx. */
  range: number;
  /** Multiplier on BattleConfig.speedUnitPx (px/sec). */
  moveSpeed: number;
  abilityCooldown: number;
  /** Ability strength multiplier (1 = PRD default). */
  abilityPower: number;
  /**
   * Multiplier on damage dealt to towers/bases. Lets building specialists
   * (Heavy, Siege) matter and stops cheap raiders melting a base in seconds.
   */
  buildingDamage: number;
  targetPriority: TargetPriority;
}

export interface TeamSettings {
  name: string;
  /** Short emblem shown in HUD (emoji or 1–3 chars). */
  emblem: string;
  color: string;
}

export interface BattleConfig {
  /** Seconds — PRD §19 (default 300). */
  matchDuration: number;
  baseHp: number;
  towerHp: number;
  towerDamage: number;
  towerRange: number;
  towerAttackSpeed: number;
  /** Castle defense: the base shoots too (0 = off, as in the PRD baseline). */
  baseDamage: number;
  baseRange: number;
  baseAttackSpeed: number;
  maxUnitsPerTeam: number;
  suddenDeath: boolean;
  /** Global damage multiplier (PRD §32 Battle Settings). */
  damageMultiplier: number;
  /** Seconds of 3→2→1 countdown. */
  countdownSeconds: number;
  /** Seconds the victory screen stays up before returning to lobby. */
  resultSeconds: number;
  /** Automatically start the next match after `lobbySeconds` in lobby. */
  autoNextMatch: boolean;
  lobbySeconds: number;
  /** Minimum ms between two spawns of the same team (PRD §12 stagger). */
  spawnStaggerMs: number;
  rangeUnitPx: number;
  speedUnitPx: number;
  teams: Record<TeamId, TeamSettings>;
  units: Record<UnitType, UnitStats>;
  /** PRD §16 — contribution points per unit spawned. */
  spawnScore: Record<UnitType, number>;
}

/** PRD §13 / §34 — Gift → Team → Unit → Quantity. */
export interface BattleGiftMapping {
  id: string;
  /** TikTok numeric gift id as a string (e.g. "5655" = Rose). Null = match by name only. */
  giftId: string | null;
  giftName: string;
  team: TeamId;
  unitType: UnitType;
  /** Units spawned per single gift (multiplied by the combo/repeat count). */
  quantity: number;
  enabled: boolean;
  /** Coin value, informational only (PRD §38: value is NOT power). */
  diamondCount?: number | null;
  /** Gift icon URL (TikTok CDN), filled from the gift catalog. */
  imageUrl?: string | null;
}

/** A normalized, validated gift event ready for the battle engine (PRD §15). */
export interface BattleGiftInput {
  eventId: string;
  viewerId: string;
  viewerName: string;
  avatarUrl?: string;
  giftId: string;
  giftName?: string;
  /** How many of this gift this event represents (combo delta). */
  count: number;
  /** Server receive time, ms. */
  receivedAt: number;
}

export type GiftRejectReason = "DUPLICATE" | "UNMAPPED" | "DISABLED" | "INVALID" | "MATCH_OVER";

export type GiftProcessResult =
  | {
      ok: true;
      mapping: BattleGiftMapping;
      team: TeamId;
      unitType: UnitType;
      quantity: number;
      /** How many of `quantity` spawn immediately vs. wait in the FIFO queue. */
      queued: number;
    }
  | { ok: false; reason: GiftRejectReason };

export type MatchStatus = "WAITING" | "COUNTDOWN" | "BATTLE" | "SUDDEN_DEATH" | "PAUSED" | "ENDED";

export type StructureKind = "BASE" | "TOWER";

export interface StructureView {
  id: string;
  team: TeamId;
  kind: StructureKind;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
}

/**
 * Compact per-unit wire shape (sent ~10×/sec, so keep it small):
 * [id, team, type, x, y, hpRatio(0–1000), state, facing(1=down,-1=up), flags]
 * flags bit 1 = shield, 2 = rage, 4 = stunned, 8 = ability anim.
 */
export type UnitWire = [number, TeamId, UnitType, number, number, number, UnitState, 1 | -1, number];

export const UNIT_FLAG_SHIELD = 1;
export const UNIT_FLAG_RAGE = 2;
export const UNIT_FLAG_STUN = 4;
export const UNIT_FLAG_ABILITY = 8;

/** Short-lived visual events for the renderer (PRD §26 VFX). */
export type BattleFx =
  | { k: "shot"; from: [number, number]; to: [number, number]; team: TeamId; style: "arrow" | "magic" | "bomb" | "tower" | "heal" | "spear" }
  | { k: "hit"; x: number; y: number; amount: number; heal?: boolean }
  | { k: "aoe"; x: number; y: number; r: number; style: "meteor" | "smash" | "bomb" | "holy" }
  | { k: "spawn"; x: number; y: number; team: TeamId }
  | { k: "death"; x: number; y: number; team: TeamId }
  | { k: "destroy"; x: number; y: number; team: TeamId; kind: StructureKind }
  | { k: "shake"; power: number }
  /** Unit `id` swung/shot/healed this frame — drives the 3D attack animation. */
  | { k: "atk"; id: number }
  /** Unit `id` used its special ability this frame. */
  | { k: "skill"; id: number };

/** Throttled human-readable feed items (PRD §17 — aggregated, max 5 visible). */
export interface BattleFeedItem {
  id: string;
  kind: "SPAWN" | "TOWER_DOWN" | "BASE_CRITICAL" | "SUDDEN_DEATH" | "INFO";
  team: TeamId | null;
  text: string;
  viewerName?: string;
  avatarUrl?: string;
  unitType?: UnitType;
  count?: number;
  at: number;
}

export interface ContributionEntry {
  viewerId: string;
  viewerName: string;
  avatarUrl?: string;
  totalGifts: number;
  unitsSpawned: number;
  damage: number;
  buildingDamage: number;
  healing: number;
  score: number;
  teamAUnits: number;
  teamBUnits: number;
}

export interface TeamRuntimeStats {
  activeUnits: number;
  queued: number;
  gifts: number;
  unitsSpawned: number;
  damageDealt: number;
  buildingDamage: number;
}

export interface MatchResult {
  matchId: string;
  winner: TeamId;
  reason: "BASE_DESTROYED" | "TIMER_HP" | "SUDDEN_DEATH" | "HOST";
  durationSeconds: number;
  baseHp: Record<TeamId, number>;
  teams: Record<TeamId, TeamRuntimeStats>;
  totalGifts: number;
  topContributors: ContributionEntry[];
  mvp: {
    mostUnits: ContributionEntry | null;
    mostDamage: ContributionEntry | null;
    mostBuildingDamage: ContributionEntry | null;
    mostHealing: ContributionEntry | null;
  };
}

/** Full realtime frame (BATTLE_TICK). */
export interface BattleSnapshot {
  matchId: string;
  status: MatchStatus;
  /** Status before a pause, so the overlay can keep showing the right phase. */
  pausedFrom: MatchStatus | null;
  /** Sim clock in ms (monotonic within a match; used for interpolation). */
  t: number;
  /** Seconds left in the match timer (null during sudden death / lobby). */
  timeLeft: number | null;
  /** Seconds left of the current countdown/lobby/result phase. */
  phaseTimeLeft: number | null;
  teams: Record<TeamId, TeamSettings & TeamRuntimeStats>;
  structures: StructureView[];
  units: UnitWire[];
  fx: BattleFx[];
  feed: BattleFeedItem[];
  top: ContributionEntry[];
  result: MatchResult | null;
}

/** Low-frequency summary embedded in SESSION_STATE for the host dashboard/overlay bootstrap. */
export interface BattlePublicState {
  matchId: string;
  status: MatchStatus;
  config: Pick<BattleConfig, "matchDuration" | "baseHp" | "towerHp" | "maxUnitsPerTeam" | "teams">;
  result: MatchResult | null;
  matchNumber: number;
  /** Enabled gift mappings, shown to viewers as "which gift spawns what". */
  giftGuide: BattleGiftMapping[];
}

export interface BattleHostState extends BattlePublicState {
  mappings: BattleGiftMapping[];
  fullConfig: BattleConfig;
}

/** Host-facing log line for every gift the battle game saw (accepted or not). */
export interface BattleGiftLogView {
  id: string;
  at: string;
  viewerName: string;
  giftId: string;
  giftName: string;
  count: number;
  ok: boolean;
  reason?: GiftRejectReason;
  team?: TeamId;
  unitType?: UnitType;
  quantity?: number;
  queued?: number;
}

/** Realtime events. */
export type AutoBattleServerEvent =
  | { type: "BATTLE_TICK"; payload: BattleSnapshot }
  | { type: "BATTLE_GIFT"; payload: BattleGiftLogView };
