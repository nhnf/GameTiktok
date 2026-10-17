import { describe, expect, it } from "vitest";
import {
  calculateAnswerPower,
  calculateRopeDelta,
  generateFairQuestionPair,
  generateQuestion,
  parseMathAnswer,
  parseTeamJoinComment,
  updateStreak,
} from "../../src/games/mathBattle/engine.js";

describe("Math Battle Engine", () => {
  describe("Question Generator", () => {
    it("generates valid easy questions with positive answers", () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion("easy", ["+", "-"]);
        expect(q.id).toBeDefined();
        expect(q.difficulty).toBe("easy");
        expect(q.answer).toBeGreaterThanOrEqual(0);
        if (q.operator === "+") {
          expect(q.answer).toBe(q.operandA + q.operandB);
        } else {
          expect(q.answer).toBe(q.operandA - q.operandB);
        }
      }
    });

    it("generates valid normal questions with balanced range", () => {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion("normal", ["+", "-"]);
        expect(q.difficulty).toBe("normal");
        expect(q.operandA).toBeGreaterThanOrEqual(15);
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    });

    it("generates a fair pair for Blue and Red teams", () => {
      const { blue, red } = generateFairQuestionPair("normal", ["+", "-"]);
      expect(blue.difficulty).toBe("normal");
      expect(red.difficulty).toBe("normal");
      expect(blue.id).not.toBe(red.id);
    });
  });

  describe("Answer Power Calculation", () => {
    it("awards +3 for answers <= 2 seconds", () => {
      expect(calculateAnswerPower(0.5)).toBe(3);
      expect(calculateAnswerPower(1.99)).toBe(3);
      expect(calculateAnswerPower(2.0)).toBe(3);
    });

    it("awards +2 for answers between >2 and <= 5 seconds", () => {
      expect(calculateAnswerPower(2.01)).toBe(2);
      expect(calculateAnswerPower(4.0)).toBe(2);
      expect(calculateAnswerPower(5.0)).toBe(2);
    });

    it("awards +1 for answers > 5 seconds", () => {
      expect(calculateAnswerPower(5.01)).toBe(1);
      expect(calculateAnswerPower(9.5)).toBe(1);
    });
  });

  describe("Comment Parsing", () => {
    it("parses numeric answers correctly", () => {
      expect(parseMathAnswer("65")).toBe(65);
      expect(parseMathAnswer(" 120 ")).toBe(120);
      expect(parseMathAnswer("0")).toBe(0);
      expect(parseMathAnswer("halo")).toBeNull();
      expect(parseMathAnswer("65 benar")).toBeNull();
    });

    it("parses team join comments", () => {
      expect(parseTeamJoinComment("biru")).toBe("BLUE");
      expect(parseTeamJoinComment("BIRU")).toBe("BLUE");
      expect(parseTeamJoinComment("blue")).toBe("BLUE");
      expect(parseTeamJoinComment("merah")).toBe("RED");
      expect(parseTeamJoinComment("RED")).toBe("RED");
      expect(parseTeamJoinComment("acak")).toBeNull();
    });
  });

  describe("Rope Delta & Movement", () => {
    it("returns 0 delta and DRAW for equal powers", () => {
      const res = calculateRopeDelta(100, 100);
      expect(res.delta).toBe(0);
      expect(res.roundWinner).toBe("DRAW");
    });

    it("returns negative delta for Blue advantage, bounded by caps", () => {
      const res = calculateRopeDelta(150, 100, 2, 20);
      expect(res.roundWinner).toBe("BLUE");
      expect(res.delta).toBeLessThan(0);
      expect(Math.abs(res.delta)).toBeGreaterThanOrEqual(2);
      expect(Math.abs(res.delta)).toBeLessThanOrEqual(20);
    });

    it("returns positive delta for Red advantage, bounded by caps", () => {
      const res = calculateRopeDelta(100, 150, 2, 20);
      expect(res.roundWinner).toBe("RED");
      expect(res.delta).toBeGreaterThan(0);
      expect(res.delta).toBeGreaterThanOrEqual(2);
      expect(res.delta).toBeLessThanOrEqual(20);
    });
  });

  describe("Streak Tracking", () => {
    it("accumulates streak when same team wins consecutively", () => {
      let streak = { team: null, count: 0, brokenTeam: null, brokenCount: 0 };
      streak = updateStreak(streak, "BLUE");
      expect(streak.team).toBe("BLUE");
      expect(streak.count).toBe(1);

      streak = updateStreak(streak, "BLUE");
      expect(streak.team).toBe("BLUE");
      expect(streak.count).toBe(2);

      streak = updateStreak(streak, "BLUE");
      expect(streak.team).toBe("BLUE");
      expect(streak.count).toBe(3);
      expect(streak.brokenTeam).toBeNull();
    });

    it("signals broken streak when opposing team wins", () => {
      let streak = { team: "BLUE" as const, count: 3, brokenTeam: null, brokenCount: 0 };
      streak = updateStreak(streak, "RED");
      expect(streak.team).toBe("RED");
      expect(streak.count).toBe(1);
      expect(streak.brokenTeam).toBe("BLUE");
      expect(streak.brokenCount).toBe(3);
    });
  });
});
