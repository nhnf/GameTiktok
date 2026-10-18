import { describe, expect, it } from "vitest";
import {
  calculateMathExpression,
  calculateMathPoints,
  calculateStreakBonus,
  formatOperatorSymbol,
  generateBossMathQuestion,
  generateMathQuestion,
  normalizeMathAnswer,
} from "../../src/games/matematika/engine.js";
import { DEFAULT_MATH_CONFIG } from "../../src/games/matematika/constants.js";

describe("Math Engine - normalizeMathAnswer", () => {
  it("normalizes clean integer numbers", () => {
    expect(normalizeMathAnswer("79")).toBe(79);
    expect(normalizeMathAnswer("  42  ")).toBe(42);
    expect(normalizeMathAnswer("0")).toBe(0);
    expect(normalizeMathAnswer("-15")).toBe(-15);
    expect(normalizeMathAnswer("−7")).toBe(-7);
    expect(normalizeMathAnswer("- 7")).toBe(-7);
    expect(normalizeMathAnswer("–15")).toBe(-15);
  });

  it("returns null for non-numeric or mixed text", () => {
    expect(normalizeMathAnswer("abc")).toBeNull();
    expect(normalizeMathAnswer("79a")).toBeNull();
    expect(normalizeMathAnswer("jawabannya 79")).toBeNull();
    expect(normalizeMathAnswer("")).toBeNull();
  });
});

describe("Math Engine - calculateMathExpression", () => {
  it("calculates addition and subtraction from left to right", () => {
    // 27 + 14 + 38 = 41 + 38 = 79
    const r1 = calculateMathExpression(27, "+", 14, "+", 38)!;
    expect(r1.intermediate).toBe(41);
    expect(r1.answer).toBe(79);

    // 86 - 24 + 17 = 62 + 17 = 79
    const r2 = calculateMathExpression(86, "-", 24, "+", 17)!;
    expect(r2.intermediate).toBe(62);
    expect(r2.answer).toBe(79);

    // 95 - 24 - 17 = 71 - 17 = 54
    const r3 = calculateMathExpression(95, "-", 24, "-", 17)!;
    expect(r3.intermediate).toBe(71);
    expect(r3.answer).toBe(54);
  });

  it("calculates multiplication and division with correct operator precedence", () => {
    // 5 + 4 * 3 = 5 + 12 = 17
    const r1 = calculateMathExpression(5, "+", 4, "*", 3)!;
    expect(r1.answer).toBe(17);

    // 20 - 12 / 4 = 20 - 3 = 17
    const r2 = calculateMathExpression(20, "-", 12, "/", 4)!;
    expect(r2.answer).toBe(17);

    // 6 * 4 / 2 = 24 / 2 = 12
    const r3 = calculateMathExpression(6, "*", 4, "/", 2)!;
    expect(r3.answer).toBe(12);

    // 24 / 4 * 3 = 6 * 3 = 18
    const r4 = calculateMathExpression(24, "/", 4, "*", 3)!;
    expect(r4.answer).toBe(18);
  });

  it("returns null for invalid / non-integer division", () => {
    // 10 / 3 is non-integer
    expect(calculateMathExpression(10, "/", 3, "+", 1)).toBeNull();
    // division by zero
    expect(calculateMathExpression(10, "/", 0, "+", 1)).toBeNull();
  });
});

describe("Math Engine - calculateMathPoints", () => {
  it("computes points according to default speed ranking", () => {
    expect(calculateMathPoints(1)).toBe(100);
    expect(calculateMathPoints(2)).toBe(90);
    expect(calculateMathPoints(3)).toBe(80);
    expect(calculateMathPoints(4)).toBe(70);
    expect(calculateMathPoints(5)).toBe(60);
    expect(calculateMathPoints(6)).toBe(50);
    expect(calculateMathPoints(7)).toBe(40);
    expect(calculateMathPoints(8)).toBe(30);
    expect(calculateMathPoints(9)).toBe(20);
    expect(calculateMathPoints(10)).toBe(10);
    expect(calculateMathPoints(11)).toBe(10);
    expect(calculateMathPoints(50)).toBe(10);
  });

  it("supports host custom rank points 1-9 and 10+", () => {
    const customConfig = {
      ...DEFAULT_MATH_CONFIG,
      rankPoints: [100, 80, 60, 50, 40, 30, 20, 15, 10],
      rank10PlusPoints: 5,
    };

    expect(calculateMathPoints(1, customConfig)).toBe(100);
    expect(calculateMathPoints(2, customConfig)).toBe(80);
    expect(calculateMathPoints(3, customConfig)).toBe(60);
    expect(calculateMathPoints(9, customConfig)).toBe(10);
    expect(calculateMathPoints(10, customConfig)).toBe(5);
    expect(calculateMathPoints(25, customConfig)).toBe(5);
  });
});

describe("Math Engine - generateMathQuestion", () => {
  it("generates a valid 3-number question within range and without negative results", () => {
    for (let i = 0; i < 50; i++) {
      const q = generateMathQuestion(DEFAULT_MATH_CONFIG);
      expect(q.number1).toBeGreaterThanOrEqual(1);
      expect(q.number2).toBeGreaterThanOrEqual(1);
      expect(q.number3).toBeGreaterThanOrEqual(1);

      expect(["+", "-", "*", "/"]).toContain(q.operator1);
      expect(["+", "-", "*", "/"]).toContain(q.operator2);

      const calculated = calculateMathExpression(
        q.number1,
        q.operator1,
        q.number2,
        q.operator2,
        q.number3,
      );
      expect(calculated).not.toBeNull();
      expect(q.answer).toBe(calculated!.answer);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(calculated!.intermediate).toBeGreaterThanOrEqual(0);
    }
  });

  it("handles multiplication only mode", () => {
    const q = generateMathQuestion({
      ...DEFAULT_MATH_CONFIG,
      operationMode: "multiplication",
    });
    expect(q.operator1).toBe("*");
    expect(q.operator2).toBe("*");
    expect(q.answer).toBe(q.number1 * q.number2 * q.number3);
  });

  it("handles division only mode with integer answers", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateMathQuestion({
        ...DEFAULT_MATH_CONFIG,
        operationMode: "division",
      });
      expect(q.operator1).toBe("/");
      expect(q.operator2).toBe("/");
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("avoids duplicate question expressions", () => {
    const prev = "27 + 14 + 38";
    const q = generateMathQuestion(DEFAULT_MATH_CONFIG, {
      previousExpression: prev,
    });
    expect(q.expression).not.toBe(prev);
  });

  it("generates valid Boss Round questions with multiplier 3", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateBossMathQuestion(DEFAULT_MATH_CONFIG);
      expect(q.isBoss).toBe(true);
      expect(q.pointMultiplier).toBe(3);
      expect(q.answer).toBeGreaterThan(0);
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.expression.length).toBeGreaterThan(0);
    }
  });

  it("calculates streak bonus at milestones (3x, 5x, 10x)", () => {
    expect(calculateStreakBonus(1)).toBe(0);
    expect(calculateStreakBonus(2)).toBe(0);
    expect(calculateStreakBonus(3)).toBe(20);
    expect(calculateStreakBonus(4)).toBe(0);
    expect(calculateStreakBonus(5)).toBe(50);
    expect(calculateStreakBonus(10)).toBe(150);
    expect(calculateStreakBonus(15)).toBe(200);
  });
});
