import { describe, expect, it } from "vitest";
import {
  buildDisplay,
  evaluateGuess,
  isFullyRevealed,
  longestCommonPrefixLength,
  normalizeGuess,
  revealNextLetter,
  scoreForDifficulty,
  selectNextWord,
  shouldTriggerBoss,
} from "../../src/games/tebakKata/engine.js";
import { DEFAULT_SCORING } from "../../src/games/tebakKata/constants.js";
import type { WordRecord } from "../../src/games/tebakKata/types.js";

describe("normalizeGuess", () => {
  it("uppercases, trims, strips punctuation, collapses whitespace", () => {
    expect(normalizeGuess("kelas")).toBe("KELAS");
    expect(normalizeGuess("KELAS!!!")).toBe("KELAS");
    expect(normalizeGuess(" kelas ")).toBe("KELAS");
    expect(normalizeGuess("Ke las")).toBe("KELAS");
    expect(normalizeGuess("-7")).toBe("-7");
    expect(normalizeGuess("−7")).toBe("-7");
    expect(normalizeGuess("kupu-kupu")).toBe("KUPU-KUPU");
  });
});

describe("Tebak Kata - Core Mechanic with Initial First and Last Letter Hint", () => {
  const target = "KELAS";

  it("Initial state reveals first and last letter as hints", () => {
    expect(buildDisplay(target, 1)).toEqual(["K", null, null, null, "S"]);
  });

  it("Scenario A — KOTAK vs KELAS maintains K and S", () => {
    const result = evaluateGuess(target, 1, "KOTAK");
    expect(buildDisplay(target, result.newRevealedLength)).toEqual(["K", null, null, null, "S"]);
    expect(result.isFullMatch).toBe(false);
  });

  it("Scenario B — KEMAS vs KELAS reveals KE and S", () => {
    const result = evaluateGuess(target, 1, "KEMAS");
    expect(buildDisplay(target, result.newRevealedLength)).toEqual(["K", "E", null, null, "S"]);
  });

  it("Scenario C — KELAM vs KELAS matches KELA prefix and S is already hinted", () => {
    const result = evaluateGuess(target, 1, "KELAM");
    expect(result.matchedLength).toBe(4);
    expect(buildDisplay(target, result.newRevealedLength)).toEqual(["K", "E", "L", "A", "S"]);
  });

  it("Scenario D — exact KELAS is a full match and reveals everything", () => {
    const result = evaluateGuess(target, 4, "KELAS");
    expect(result.isFullMatch).toBe(true);
    expect(result.newRevealedLength).toBe(5);
    expect(isFullyRevealed(target, result.newRevealedLength)).toBe(true);
  });

  it("longer guess with matching prefix only reveals up to the divergence point", () => {
    const result = evaluateGuess("KOMPUTER", 1, "KEMBALI");
    expect(result.matchedLength).toBe(1);
  });

  it("a guess that regresses the prefix does not un-reveal letters (PRD 11)", () => {
    const result = evaluateGuess(target, 3, "KOTAK");
    expect(result.newRevealedLength).toBe(3);
    expect(result.revealAdvanced).toBe(false);
  });

  it("duplicate guesses that add no new letters produce no state change (PRD 11)", () => {
    const first = evaluateGuess(target, 1, "KEMAS");
    const second = evaluateGuess(target, first.newRevealedLength, "KEMAS");
    expect(second.revealAdvanced).toBe(false);
    expect(second.newRevealedLength).toBe(first.newRevealedLength);
  });
});

describe("longestCommonPrefixLength", () => {
  it("caps at the shorter string length", () => {
    expect(longestCommonPrefixLength("KELAS", "KE")).toBe(2);
    expect(longestCommonPrefixLength("KE", "KELAS")).toBe(2);
  });

  it("returns 0 for empty guess", () => {
    expect(longestCommonPrefixLength("KELAS", "")).toBe(0);
  });
});

describe("revealNextLetter (Hint / Gift)", () => {
  it("opens exactly one more letter and never exceeds word length", () => {
    expect(revealNextLetter("KELAS", 2)).toBe(3);
    expect(revealNextLetter("KELAS", 4)).toBe(4);
  });
});

describe("scoreForDifficulty", () => {
  it("matches PRD 13.2 default scoring table", () => {
    expect(scoreForDifficulty("easy", DEFAULT_SCORING)).toBe(5);
    expect(scoreForDifficulty("medium", DEFAULT_SCORING)).toBe(10);
    expect(scoreForDifficulty("hard", DEFAULT_SCORING)).toBe(20);
    expect(scoreForDifficulty("boss", DEFAULT_SCORING)).toBe(50);
  });
});

describe("shouldTriggerBoss", () => {
  it("triggers once the threshold is reached", () => {
    expect(shouldTriggerBoss(9, 10)).toBe(false);
    expect(shouldTriggerBoss(10, 10)).toBe(true);
    expect(shouldTriggerBoss(11, 10)).toBe(true);
  });
});

describe("selectNextWord (anti-repetition)", () => {
  const words: WordRecord[] = [
    { id: "1", word: "RUMAH", categoryId: "c1", difficulty: "easy", isActive: true, usageCount: 0 },
    { id: "2", word: "KELAS", categoryId: "c1", difficulty: "easy", isActive: true, usageCount: 0 },
    { id: "3", word: "MEJA", categoryId: "c1", difficulty: "easy", isActive: false, usageCount: 0 },
  ];

  it("excludes inactive words", () => {
    const picked = selectNextWord(words, {
      difficulty: "easy",
      usedWordIds: new Set(),
      random: () => 0,
    });
    expect(picked?.id).not.toBe("3");
  });

  it("avoids recently used words when an alternative exists", () => {
    const picked = selectNextWord(words, {
      difficulty: "easy",
      usedWordIds: new Set(["1"]),
      random: () => 0,
    });
    expect(picked?.id).toBe("2");
  });

  it("falls back to the full pool when every candidate was recently used", () => {
    const picked = selectNextWord(words, {
      difficulty: "easy",
      usedWordIds: new Set(["1", "2"]),
      random: () => 0,
    });
    expect(picked).not.toBeNull();
  });

  it("returns null when no active word matches the difficulty", () => {
    const picked = selectNextWord(words, {
      difficulty: "hard",
      usedWordIds: new Set(),
      random: () => 0,
    });
    expect(picked).toBeNull();
  });
});
