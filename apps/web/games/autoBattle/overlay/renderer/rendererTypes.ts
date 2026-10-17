/** Shared constants, shapes and math helpers of the Auto Battle canvas renderer. */
import {
  BATTLE_ARENA,
  UNIT_FLAG_ABILITY,
  UNIT_FLAG_RAGE,
  UNIT_FLAG_SHIELD,
  UNIT_FLAG_STUN,
  UNIT_META,
  type BattleFx,
  type BattleSnapshot,
  type StructureView,
  type TeamId,
  type UnitState,
  type UnitType,
} from "@tebak-kata/shared";

export const W = BATTLE_ARENA.width;
export const H = BATTLE_ARENA.height;
export const SPRITE_HEIGHT = 76;
export const MAX_NUMBERS = 36;
export const MAX_PARTICLES = 420;
export const DEFAULT_COLORS: Record<TeamId, string> = { A: "#2F7BFF", B: "#FF3B3B" };

export interface UnitVis {
  id: number;
  team: TeamId;
  type: UnitType;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  x: number;
  y: number;
  hp: number;
  state: UnitState;
  facing: 1 | -1;
  flags: number;
  bornAt: number;
  diedAt: number | null;
  flashUntil: number;
  moving: boolean;
}

export type Effect =
  | { k: "shot"; start: number; dur: number; from: [number, number]; to: [number, number]; team: TeamId; style: "arrow" | "magic" | "bomb" | "tower" | "heal" | "spear" }
  | { k: "aoe"; start: number; dur: number; x: number; y: number; r: number; style: "meteor" | "smash" | "bomb" | "holy"; impacted?: boolean }
  | { k: "ring"; start: number; dur: number; x: number; y: number; r: number; color: string }
  | { k: "number"; start: number; dur: number; x: number; y: number; amount: number; heal: boolean; text: string; color: string; size: number };

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  gravity: number;
  grow: number;
}

export interface StructVis extends StructureView {
  flashUntil: number;
  cracks: [number, number][][];
}

export const SHOT_DURATION: Record<string, number> = { arrow: 230, magic: 320, bomb: 480, tower: 220, heal: 300, spear: 160 };

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Deterministic jagged crack lines for a structure (stable across frames). */
export function makeCracks(seed: string, r: number): [number, number][][] {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const lines: [number, number][][] = [];
  for (let i = 0; i < 4; i++) {
    let x = (rand() - 0.5) * r * 1.1;
    let y = (rand() - 0.5) * r * 0.9;
    const line: [number, number][] = [[x, y]];
    for (let j = 0; j < 4; j++) {
      x += (rand() - 0.5) * r * 0.45;
      y += rand() * r * 0.28;
      line.push([x, y]);
    }
    lines.push(line);
  }
  return lines;
}
