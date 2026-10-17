import type { MathConfig } from "./types.js";

export const DEFAULT_MATH_CONFIG: MathConfig = {
  durationSeconds: 10,
  minNumber: 1,
  maxNumber: 99,
  operationMode: "mixed",
  allowNegative: false,
  autoNext: true,
  minPoints: 10,
  firstPlacePoints: 100,
  rankPoints: [100, 90, 80, 70, 60, 50, 40, 30, 20],
  rank10PlusPoints: 10,
};

export const MATH_TIMER_PRESETS = [5, 10, 15, 20, 30] as const;

/** Delay before the next question starts after time-up / reveal. */
export const MATH_AUTO_ADVANCE_MS = 2400;

export const MATH_OPERATION_MODES = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "add_sub",
  "mul_div",
  "mixed",
] as const;
