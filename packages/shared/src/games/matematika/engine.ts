import type {
  MathConfig,
  MathOperator,
  MathOperationMode,
} from "./types.js";

/**
 * Normalizes incoming raw comment to an integer.
 * PRD section 22 — strict numeric format (e.g. " 79 " -> 79).
 */
export function normalizeMathAnswer(raw: string): number | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim();
  if (!/^-?\d+$/.test(cleaned)) return null;
  const parsed = parseInt(cleaned, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/**
 * Calculates points based on speed rank.
 * Supports custom rank points (rank 1-9 & rank 10+) or default 100-10 formula.
 */
export function calculateMathPoints(
  rank: number,
  configOrFirstPlace: MathConfig | number = 100,
  minPointsFallback = 10,
): number {
  const safeRank = rank < 1 ? 1 : rank;
  if (typeof configOrFirstPlace === "object" && configOrFirstPlace !== null) {
    const config = configOrFirstPlace;
    if (config.rankPoints && Array.isArray(config.rankPoints) && config.rankPoints.length > 0) {
      if (safeRank <= 9 && safeRank <= config.rankPoints.length) {
        return config.rankPoints[safeRank - 1] ?? config.minPoints ?? 10;
      }
      return config.rank10PlusPoints ?? config.minPoints ?? 10;
    }
    const firstPlace = config.firstPlacePoints ?? 100;
    const minP = config.minPoints ?? 10;
    const step = firstPlace >= 100 ? 10 : 1;
    return Math.max(minP, firstPlace - (safeRank - 1) * step);
  }

  const firstPlace = typeof configOrFirstPlace === "number" ? configOrFirstPlace : 100;
  const step = firstPlace >= 100 ? 10 : 1;
  return Math.max(minPointsFallback, firstPlace - (safeRank - 1) * step);
}

/**
 * Calculates bonus points for answer streak milestones (3x, 5x, 10x, etc.).
 */
export function calculateStreakBonus(streak: number): number {
  if (streak === 3) return 20;
  if (streak === 5) return 50;
  if (streak === 10) return 150;
  if (streak > 10 && streak % 5 === 0) return 200;
  return 0;
}

/**
 * Converts mathematical operators to clean display glyphs (+, -, ×, ÷).
 */
export function formatOperatorSymbol(op: MathOperator): string {
  if (op === "*") return "×";
  if (op === "/") return "÷";
  return op;
}

/**
 * Evaluates 3-number arithmetic using standard precedence (PEMDAS).
 * Returns null if intermediate or final division is invalid/non-integer.
 */
export function calculateMathExpression(
  n1: number,
  op1: MathOperator,
  n2: number,
  op2: MathOperator,
  n3: number,
): { intermediate: number; answer: number } | null {
  const isOp1High = op1 === "*" || op1 === "/";
  const isOp2High = op2 === "*" || op2 === "/";

  // Case 1: op2 has higher precedence (e.g., n1 + n2 * n3 or n1 - n2 / n3)
  if (!isOp1High && isOp2High) {
    let sub: number;
    if (op2 === "*") {
      sub = n2 * n3;
    } else {
      if (n3 === 0 || n2 % n3 !== 0) return null;
      sub = n2 / n3;
    }
    const answer = op1 === "+" ? n1 + sub : n1 - sub;
    return { intermediate: sub, answer };
  }

  // Case 2: op1 has higher precedence or same precedence -> evaluate left to right
  let intermediate: number;
  if (op1 === "+") {
    intermediate = n1 + n2;
  } else if (op1 === "-") {
    intermediate = n1 - n2;
  } else if (op1 === "*") {
    intermediate = n1 * n2;
  } else {
    if (n2 === 0 || n1 % n2 !== 0) return null;
    intermediate = n1 / n2;
  }

  let answer: number;
  if (op2 === "+") {
    answer = intermediate + n3;
  } else if (op2 === "-") {
    answer = intermediate - n3;
  } else if (op2 === "*") {
    answer = intermediate * n3;
  } else {
    if (n3 === 0 || intermediate % n3 !== 0) return null;
    answer = intermediate / n3;
  }

  if (!Number.isSafeInteger(answer) || !Number.isSafeInteger(intermediate)) {
    return null;
  }

  return { intermediate, answer };
}

export interface GeneratedMathQuestion {
  number1: number;
  number2: number;
  number3: number;
  operator1: MathOperator;
  operator2: MathOperator;
  expression: string;
  answer: number;
  isBoss?: boolean;
  pointMultiplier?: number;
}

function pickRandomOperator(
  mode: MathOperationMode,
  random: () => number,
): MathOperator {
  if (mode === "addition") return "+";
  if (mode === "subtraction") return "-";
  if (mode === "multiplication") return "*";
  if (mode === "division") return "/";
  if (mode === "add_sub") return random() < 0.5 ? "+" : "-";
  if (mode === "mul_div") return random() < 0.5 ? "*" : "/";
  
  // Mixed (all 4)
  const roll = random();
  if (roll < 0.25) return "+";
  if (roll < 0.5) return "-";
  if (roll < 0.75) return "*";
  return "/";
}

function getRandomInt(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Generates an advanced Boss Round question with 4 terms / heavy arithmetic.
 */
export function generateBossMathQuestion(
  config: MathConfig,
  random: () => number = Math.random,
): GeneratedMathQuestion {
  for (let attempt = 0; attempt < 200; attempt++) {
    const pattern = Math.floor(random() * 3);
    if (pattern === 0) {
      // (A * B) + C - D (4 terms)
      const a = getRandomInt(4, 15, random);
      const b = getRandomInt(3, 9, random);
      const c = getRandomInt(20, 99, random);
      const d = getRandomInt(10, 50, random);
      const ans = a * b + c - d;
      if (ans > 0 && ans < 1000) {
        return {
          number1: a,
          number2: b,
          number3: c,
          operator1: "*",
          operator2: "+",
          expression: `${a} × ${b} + ${c} - ${d}`,
          answer: ans,
          isBoss: true,
          pointMultiplier: 3,
        };
      }
    } else if (pattern === 1) {
      // A + B - (C * D) (4 terms)
      const c = getRandomInt(3, 9, random);
      const d = getRandomInt(3, 9, random);
      const mult = c * d;
      const a = getRandomInt(mult + 20, mult + 120, random);
      const b = getRandomInt(15, 80, random);
      const ans = a + b - mult;
      if (ans > 0 && ans < 1000) {
        return {
          number1: a,
          number2: b,
          number3: c,
          operator1: "+",
          operator2: "-",
          expression: `${a} + ${b} - ${c} × ${d}`,
          answer: ans,
          isBoss: true,
          pointMultiplier: 3,
        };
      }
    } else {
      // 3 large numbers: A + B - C (e.g. 125 + 75 - 40 = 160)
      const a = getRandomInt(60, 250, random);
      const b = getRandomInt(40, 200, random);
      const c = getRandomInt(30, Math.min(a + b - 10, 180), random);
      const ans = a + b - c;
      if (ans > 0) {
        return {
          number1: a,
          number2: b,
          number3: c,
          operator1: "+",
          operator2: "-",
          expression: `${a} + ${b} - ${c}`,
          answer: ans,
          isBoss: true,
          pointMultiplier: 3,
        };
      }
    }
  }

  // Fallback
  return {
    number1: 125,
    number2: 75,
    number3: 40,
    operator1: "+",
    operator2: "-",
    expression: "125 + 75 - 40",
    answer: 160,
    isBoss: true,
    pointMultiplier: 3,
  };
}

/**
 * Generates an arithmetic question according to PRD section 10-15, 30, 65.
 */
export function generateMathQuestion(
  config: MathConfig,
  options?: {
    previousExpression?: string | null;
    random?: () => number;
    maxAttempts?: number;
    isBoss?: boolean;
  },
): GeneratedMathQuestion {
  const { previousExpression, random = Math.random, maxAttempts = 200, isBoss } = options ?? {};
  if (isBoss) {
    return generateBossMathQuestion(config, random);
  }
  const { operationMode, allowNegative } = config;
  // Tolerate a swapped/invalid range coming from host input.
  const minNumber = Math.max(0, Math.min(config.minNumber, config.maxNumber));
  const maxNumber = Math.max(1, config.minNumber, config.maxNumber);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const op1 = pickRandomOperator(operationMode, random);
    const op2 = pickRandomOperator(operationMode, random);

    // Keep multipliers/divisors reasonable for 10-second mental math if maxNumber is high
    const maxOperand = (op: MathOperator) => (op === "*" || op === "/" ? Math.min(maxNumber, 12) : maxNumber);
    const minOperand = (op: MathOperator) => (op === "/" ? Math.max(1, minNumber) : minNumber);

    let n1 = getRandomInt(minOperand(op1), maxOperand(op1), random);
    // n2 is also an operand of op2 when op2 binds tighter ("a + b × c"), so keep it small then too.
    const n2Max = op2 === "*" ? Math.min(maxOperand(op1), maxOperand(op2)) : maxOperand(op1);
    let n2 = getRandomInt(Math.min(minOperand(op1), n2Max), n2Max, random);
    let n3 = getRandomInt(minOperand(op2), maxOperand(op2), random);

    // Smart generation for division to ensure clean divisibility
    if (op1 === "/" && op2 !== "*") {
      const divisor = getRandomInt(2, Math.min(12, Math.max(2, maxNumber)), random);
      const quotient = getRandomInt(1, Math.min(20, Math.max(1, maxNumber)), random);
      n2 = divisor;
      n1 = divisor * quotient;
    }

    if (op2 === "/") {
      const divisor = getRandomInt(2, Math.min(12, Math.max(2, maxNumber)), random);
      n3 = divisor;
      if (op1 === "/") {
        // n1 ÷ n2 ÷ n3 must stay whole: build n1 from both divisors.
        n2 = getRandomInt(2, Math.min(9, Math.max(2, maxNumber)), random);
        const quotient = getRandomInt(1, Math.max(1, Math.min(10, Math.floor(Math.max(100, maxNumber) / (n2 * divisor)))), random);
        n1 = n2 * divisor * quotient;
      } else if (op1 === "*") {
        // n1 × n2 must be divisible by n3: make n1 a multiple of it.
        const quotient = getRandomInt(1, Math.min(10, Math.max(1, maxNumber)), random);
        n1 = divisor * quotient;
        n2 = getRandomInt(2, Math.min(9, Math.max(2, maxNumber)), random);
      } else {
        // n2 must be divisible by n3
        const quotient = getRandomInt(1, Math.min(20, Math.max(1, maxNumber)), random);
        n2 = divisor * quotient;
      }
    }

    const calc = calculateMathExpression(n1, op1, n2, op2, n3);
    if (!calc) continue;

    const { intermediate, answer } = calc;

    // Negative answer validation (PRD section 13)
    if (!allowNegative) {
      if (intermediate < 0 || answer < 0) {
        continue;
      }
    }

    const sym1 = formatOperatorSymbol(op1);
    const sym2 = formatOperatorSymbol(op2);
    const expression = `${n1} ${sym1} ${n2} ${sym2} ${n3}`;

    // Duplicate question prevention (PRD section 15)
    if (previousExpression && expression === previousExpression) {
      continue;
    }

    return {
      number1: n1,
      number2: n2,
      number3: n3,
      operator1: op1,
      operator2: op2,
      expression,
      answer,
    };
  }

  // Fallback guaranteed positive addition
  const fb1 = getRandomInt(minNumber, maxNumber, random);
  const fb2 = getRandomInt(minNumber, maxNumber, random);
  const fb3 = getRandomInt(minNumber, maxNumber, random);
  const calc = calculateMathExpression(fb1, "+", fb2, "+", fb3);
  const answer = calc ? calc.answer : fb1 + fb2 + fb3;

  return {
    number1: fb1,
    number2: fb2,
    number3: fb3,
    operator1: "+",
    operator2: "+",
    expression: `${fb1} + ${fb2} + ${fb3}`,
    answer,
  };
}

/** Clamps host-provided settings into a range the generator and timer can handle. */
export function sanitizeMathConfig(config: MathConfig): MathConfig {
  const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const minNumber = clampInt(config.minNumber, 0, 999, 1);
  const maxNumber = clampInt(config.maxNumber, 1, 999, 99);
  const rankPoints = Array.isArray(config.rankPoints)
    ? config.rankPoints.slice(0, 9).map((p) => clampInt(p, 0, 1000, 1))
    : config.rankPoints;
  return {
    ...config,
    durationSeconds: clampInt(config.durationSeconds, 3, 120, 10),
    minNumber: Math.min(minNumber, maxNumber),
    maxNumber: Math.max(minNumber, maxNumber),
    minPoints: clampInt(config.minPoints, 0, 1000, 10),
    firstPlacePoints: clampInt(config.firstPlacePoints, 1, 1000, 100),
    rankPoints,
    rank10PlusPoints: clampInt(config.rank10PlusPoints ?? config.minPoints, 0, 1000, 10),
  };
}
