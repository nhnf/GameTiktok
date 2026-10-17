import { normalizeGiftName, randomId } from "../../core/gift.js";
import { MATH_BATTLE_JOIN_WORDS } from "./constants.js";
import type {
  MathBattleConfig,
  MathBattleDifficulty,
  MathBattleGiftMapping,
  MathBattleOperator,
  MathBattleQuestion,
  MathBattleStreakState,
  MathBattleTeamId,
} from "./types.js";

/**
 * Generate a single math question according to difficulty and allowed operators.
 */
export function generateQuestion(
  difficulty: MathBattleDifficulty,
  allowedOperators: MathBattleOperator[] = ["+", "-"],
): MathBattleQuestion {
  const op: MathBattleOperator =
    allowedOperators.length > 0
      ? allowedOperators[Math.floor(Math.random() * allowedOperators.length)]
      : "+";

  let minA = 10;
  let maxA = 50;
  let minB = 10;
  let maxB = 50;

  switch (difficulty) {
    case "easy":
      minA = 10;
      maxA = 50;
      minB = 5;
      maxB = 30;
      break;
    case "normal":
      minA = 25;
      maxA = 99;
      minB = 15;
      maxB = 89;
      break;
    case "hard":
      minA = 100;
      maxA = 599;
      minB = 100;
      maxB = 499;
      break;
    case "extreme":
      minA = 300;
      maxA = 999;
      minB = 200;
      maxB = 899;
      break;
  }

  let operandA = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
  let operandB = Math.floor(Math.random() * (maxB - minB + 1)) + minB;

  if (op === "-" && operandA < operandB) {
    // Swap so answer is always positive
    const tmp = operandA;
    operandA = operandB;
    operandB = tmp;
  }

  const answer = op === "+" ? operandA + operandB : operandA - operandB;

  return {
    id: randomId("q"),
    operandA,
    operandB,
    operator: op,
    expression: `${operandA} ${op} ${operandB}`,
    answer,
    difficulty,
  };
}

/**
 * Generate a fair pair of questions for Blue and Red teams with equivalent difficulty.
 */
export function generateFairQuestionPair(
  difficulty: MathBattleDifficulty,
  allowedOperators: MathBattleOperator[] = ["+", "-"]
): { blue: MathBattleQuestion; red: MathBattleQuestion } {
  let blue = generateQuestion(difficulty, allowedOperators);
  let red = generateQuestion(difficulty, allowedOperators);

  // Guarantee questions aren't identical expressions
  let attempts = 0;
  while (blue.expression === red.expression && attempts < 10) {
    red = generateQuestion(difficulty, allowedOperators);
    attempts++;
  }

  return { blue, red };
}

/**
 * Calculate Answer Power awarded for a correct answer based on speed.
 * PRD §20:
 * 0–2 seconds: +3
 * >2–5 seconds: +2
 * >5–10 seconds (or beyond): +1
 */
export function calculateAnswerPower(answeredAtSeconds: number): number {
  if (answeredAtSeconds <= 2.0) {
    return 3;
  }
  if (answeredAtSeconds <= 5.0) {
    return 2;
  }
  return 1;
}

/**
 * Parse an incoming comment to see if it's a numeric math answer.
 */
export function parseMathAnswer(rawComment: string): number | null {
  const trimmed = rawComment.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const num = parseInt(trimmed, 10);
  return Number.isSafeInteger(num) ? num : null;
}

/**
 * Parse a team join comment: "BIRU" / "MERAH" (also "blue", "red",
 * "tim biru", "#merah!"). Numbers never join a team — they are answers.
 */
export function parseTeamJoinComment(rawComment: string): MathBattleTeamId | null {
  const key = rawComment.normalize("NFKC").toUpperCase().replace(/[^A-Z]/g, "");
  return MATH_BATTLE_JOIN_WORDS[key] ?? null;
}

/** Gift mapping lookup: TikTok gift id first, then the (normalized) gift name. */
export function findMathBattleGiftMapping(
  mappings: readonly MathBattleGiftMapping[],
  giftId: string | null | undefined,
  giftName?: string | null,
): MathBattleGiftMapping | null {
  const id = (giftId ?? "").trim();
  if (id) {
    const byId = mappings.find((m) => m.giftId !== null && m.giftId.trim() === id);
    if (byId) return byId;
  }
  const name = normalizeGiftName(giftName);
  return name ? (mappings.find((m) => normalizeGiftName(m.giftName) === name) ?? null) : null;
}

/**
 * Calculate rope displacement delta based on Blue Total Power vs Red Total Power.
 * Delta is negative when moving towards Blue, positive when moving towards Red.
 * Clamped by minRopeMovement and maxRopeMovement.
 */
export function calculateRopeDelta(
  blueTotal: number,
  redTotal: number,
  minMovement: number = 2,
  maxMovement: number = 20
): { delta: number; roundWinner: MathBattleTeamId | "DRAW" } {
  if (blueTotal === redTotal) {
    return { delta: 0, roundWinner: "DRAW" };
  }

  const diff = Math.abs(blueTotal - redTotal);
  // Scale diff proportionally: diff / 5 clamped between min and max
  const rawMovement = Math.max(minMovement, Math.round(diff / 5));
  const movement = Math.min(maxMovement, rawMovement);

  if (blueTotal > redTotal) {
    return { delta: -movement, roundWinner: "BLUE" };
  } else {
    return { delta: movement, roundWinner: "RED" };
  }
}

/**
 * Update streak tracking on round completion.
 */
export function updateStreak(
  currentStreak: MathBattleStreakState,
  roundWinner: MathBattleTeamId | "DRAW"
): MathBattleStreakState {
  if (roundWinner === "DRAW") {
    return {
      ...currentStreak,
      brokenTeam: null,
      brokenCount: 0,
    };
  }

  if (currentStreak.team === roundWinner) {
    return {
      team: roundWinner,
      count: currentStreak.count + 1,
      brokenTeam: null,
      brokenCount: 0,
    };
  }

  // Streak broken
  const brokenTeam = currentStreak.team;
  const brokenCount = currentStreak.count >= 2 ? currentStreak.count : 0;

  return {
    team: roundWinner,
    count: 1,
    brokenTeam: brokenCount >= 2 ? brokenTeam : null,
    brokenCount,
  };
}
