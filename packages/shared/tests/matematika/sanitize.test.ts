import { describe, expect, it } from "vitest";
import { DEFAULT_MATH_CONFIG, generateMathQuestion, sanitizeMathConfig } from "../../src/index.js";

describe("Matematika config safety", () => {
  it("still generates questions when min/max are swapped", () => {
    const q = generateMathQuestion({ ...DEFAULT_MATH_CONFIG, minNumber: 50, maxNumber: 10, operationMode: "addition" });
    for (const n of [q.number1, q.number2, q.number3]) {
      expect(n).toBeGreaterThanOrEqual(10);
      expect(n).toBeLessThanOrEqual(50);
    }
  });

  it("clamps host input", () => {
    const c = sanitizeMathConfig({ ...DEFAULT_MATH_CONFIG, durationSeconds: 0, minNumber: 80, maxNumber: 5 });
    expect(c.durationSeconds).toBe(3);
    expect(c.minNumber).toBe(5);
    expect(c.maxNumber).toBe(80);
  });

  it("keeps a × operand small even when it follows a +", () => {
    for (let i = 0; i < 200; i++) {
      const q = generateMathQuestion({ ...DEFAULT_MATH_CONFIG, operationMode: "mixed" });
      if (q.operator2 === "*") expect(q.number2).toBeLessThanOrEqual(12);
    }
  });

  it("division chains use real divisors (no 'a ÷ 1 ÷ c') and stay whole", () => {
    for (let i = 0; i < 300; i++) {
      const q = generateMathQuestion({ ...DEFAULT_MATH_CONFIG, operationMode: "division" });
      expect(Number.isInteger(q.answer)).toBe(true);
      if (q.operator1 === "/" && q.operator2 === "/") expect(q.number2).toBeGreaterThan(1);
    }
  });
});
