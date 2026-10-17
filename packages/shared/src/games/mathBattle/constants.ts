import type { MathBattleConfig, MathBattleGiftMapping } from "./types.js";

export const DEFAULT_MATH_BATTLE_CONFIG: MathBattleConfig = {
  totalRounds: 10,
  roundDurationSeconds: 10,
  difficulty: "normal",
  operators: ["+", "-"],
  assignmentMode: "COMMENT",
  minRopeMovement: 2,
  maxRopeMovement: 20,
  winLineDistance: 100,
  streakEnabled: true,
  powerDisplayEnabled: true,
  playerCountEnabled: true,
  giftNotificationEnabled: true,
  soundEnabled: true,
  giftSmallPower: 5,
  giftMediumPower: 15,
  giftLargePower: 40,
};

/** Phase timings of a match (ms). */
export const MATH_BATTLE_TIMINGS = {
  starting: 3000,
  ropeAnimation: 2500,
  roundResult: 3000,
  nextRound: 1500,
  victoryToResult: 5000,
} as const;

/**
 * Starter gift table. Uses real TikTok gifts (ids from the public gift
 * catalog, region ID) with matching coin prices per tier so both teams
 * are equally cheap to support.
 */
export const DEFAULT_MATH_BATTLE_GIFT_MAPPINGS: MathBattleGiftMapping[] = [
  { id: "default-blue-small", giftId: "5655", giftName: "Rose", team: "BLUE", tier: "SMALL", power: 5, enabled: true, diamondCount: 1 },
  { id: "default-blue-med", giftId: "9947", giftName: "Friendship Necklace", team: "BLUE", tier: "MEDIUM", power: 15, enabled: true, diamondCount: 10 },
  { id: "default-blue-large", giftId: "5660", giftName: "Hand Heart", team: "BLUE", tier: "LARGE", power: 40, enabled: true, diamondCount: 100 },
  { id: "default-red-small", giftId: "5269", giftName: "TikTok", team: "RED", tier: "SMALL", power: 5, enabled: true, diamondCount: 1 },
  { id: "default-red-med", giftId: "8913", giftName: "Rosa", team: "RED", tier: "MEDIUM", power: 15, enabled: true, diamondCount: 10 },
  { id: "default-red-large", giftId: "5585", giftName: "Confetti", team: "RED", tier: "LARGE", power: 40, enabled: true, diamondCount: 100 },
  { id: "default-neutral-small", giftId: "5827", giftName: "Ice Cream Cone", team: "NEUTRAL", tier: "NEUTRAL", power: 0, enabled: true, diamondCount: 1 },
];

/**
 * The very first release seeded placeholder names that TikTok never sends.
 * Rows still exactly matching these are upgraded to the defaults above.
 */
export const LEGACY_MATH_BATTLE_GIFT_NAMES: Record<string, string> = {
  "default-blue-small": "Mawar Biru",
  "default-blue-med": "Donat Biru",
  "default-blue-large": "Paus Biru",
  "default-red-small": "Mawar Merah",
  "default-red-med": "Cokelat Hati",
  "default-red-large": "Naga Merah",
  "default-neutral-small": "Kopi",
};

/** Comments that put a viewer on a team. */
export const MATH_BATTLE_JOIN_WORDS: Record<string, "BLUE" | "RED"> = {
  BIRU: "BLUE",
  BLUE: "BLUE",
  TIMBIRU: "BLUE",
  MERAH: "RED",
  RED: "RED",
  TIMMERAH: "RED",
};
