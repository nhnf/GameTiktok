/** Shared fixtures for the Auto Battle tests. */
import { expect } from "vitest";
import {
  BattleSimulation,
  type BattleGiftInput,
  type BattleGiftMapping,
  type BattleConfig,
} from "../../src/index.js";

export const MAPPINGS: BattleGiftMapping[] = [
  { id: "1", giftId: "5655", giftName: "Rose", team: "A", unitType: "TANK", quantity: 1, enabled: true },
  { id: "2", giftId: "5269", giftName: "TikTok", team: "B", unitType: "ARCHER", quantity: 2, enabled: true },
  { id: "3", giftId: null, giftName: "Corgi", team: "B", unitType: "HEAVY", quantity: 1, enabled: true },
  { id: "4", giftId: "999", giftName: "Off", team: "A", unitType: "MAGE", quantity: 1, enabled: false },
  { id: "5", giftId: "11046", giftName: "Galaxy", team: "A", unitType: "SIEGE", quantity: 1, enabled: true },
];

/** Deterministic LCG so spawn offsets are reproducible. */
export function seeded(seed = 42): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

let eventSeq = 0;
export function gift(partial: Partial<BattleGiftInput> & { giftId: string }): BattleGiftInput {
  return {
    eventId: `e${++eventSeq}`,
    viewerId: "u-ahmad",
    viewerName: "Ahmad",
    count: 1,
    receivedAt: 0,
    ...partial,
  };
}

export function makeSim(config: Partial<BattleConfig> = {}): BattleSimulation {
  return new BattleSimulation({
    config: { autoNextMatch: false, countdownSeconds: 0, ...config },
    mappings: MAPPINGS,
    random: seeded(),
    newMatchId: (() => {
      let n = 0;
      return () => `match-${++n}`;
    })(),
  });
}

export function run(sim: BattleSimulation, ms: number): void {
  for (let t = 0; t < ms; t += 50) sim.step(50);
}

export function startBattle(sim: BattleSimulation): void {
  sim.startMatch();
  sim.step(50); // countdown 0s → BATTLE
  expect(sim.getStatus()).toBe("BATTLE");
}
