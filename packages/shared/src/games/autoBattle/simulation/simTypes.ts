import type {
  BattleConfig,
  BattleGiftMapping,
  StructureKind,
  TeamId,
  TeamRuntimeStats,
  UnitState,
  UnitStats,
  UnitType,
} from "../types.js";

export interface Contributor {
  viewerId: string;
  viewerName: string;
  avatarUrl?: string;
}

export interface SimStructure {
  id: string;
  team: TeamId;
  kind: StructureKind;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  nextAttackAt: number;
  criticalAnnounced: boolean;
}

export interface SimUnit {
  id: number;
  team: TeamId;
  type: UnitType;
  stats: UnitStats;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  state: UnitState;
  stateUntil: number;
  target: Target | null;
  nextAttackAt: number;
  abilityReadyAt: number;
  healReadyAt: number;
  attackCount: number;
  shieldUntil: number;
  rageUntil: number;
  rageUsed: boolean;
  stunUntil: number;
  dashUntil: number;
  dashTarget: Target | null;
  abilityAnimUntil: number;
  laneOffset: number;
  /** y before this step's separation pass (frontline enforcement). */
  prevY?: number;
  /** Render hint: which way the unit last attacked (1 = down, −1 = up). */
  facingY?: 1 | -1;
  owner: Contributor | null;
}

export type Target = { unit: SimUnit; struct?: undefined } | { struct: SimStructure; unit?: undefined };

export interface QueueEntry {
  unitType: UnitType;
  remaining: number;
  owner: Contributor | null;
}

export const OTHER: Record<TeamId, TeamId> = { A: "B", B: "A" };
/** Team A marches down the screen (+y), Team B up (−y). */
export const FORWARD: Record<TeamId, 1 | -1> = { A: 1, B: -1 };

export interface BattleSimulationOptions {
  config?: Partial<BattleConfig>;
  mappings?: BattleGiftMapping[];
  /** Deterministic RNG for tests; defaults to Math.random. */
  random?: () => number;
  newMatchId?: () => string;
}

export function emptyTeamStats(): TeamRuntimeStats {
  return { activeUnits: 0, queued: 0, gifts: 0, unitsSpawned: 0, damageDealt: 0, buildingDamage: 0 };
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}
