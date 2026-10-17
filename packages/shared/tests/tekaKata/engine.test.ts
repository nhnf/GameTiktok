import { describe, expect, it } from "vitest";
import {
  buildGridCells,
  buildPublicWords,
  canFormWord,
  calculateMinimalLetterPool,
  normalizeTekaKataWord,
  scoreForTekaKataWord,
  validateCrosswordPlacements,
} from "../../src/games/tekaKata/engine.js";
import { generateTekaKataPuzzle } from "../../src/games/tekaKata/generator.js";
import type { TekaKataPuzzleWordHost } from "../../src/games/tekaKata/types.js";

describe("Teka Kata Engine - normalizeTekaKataWord", () => {
  it("normalizes word correctly by trimming, uppercasing, and stripping punctuation", () => {
    expect(normalizeTekaKataWord("  bandar  ")).toBe("BANDAR");
    expect(normalizeTekaKataWord("bad-an!")).toBe("BADAN");
    expect(normalizeTekaKataWord("d a n a")).toBe("DANA");
    expect(normalizeTekaKataWord("kucing123")).toBe("KUCING123");
  });
});

describe("Teka Kata Engine - scoreForTekaKataWord", () => {
  it("computes normal scoring according to PRD section 25", () => {
    expect(scoreForTekaKataWord(3, false)).toBe(10);
    expect(scoreForTekaKataWord(4, false)).toBe(20);
    expect(scoreForTekaKataWord(5, false)).toBe(30);
    expect(scoreForTekaKataWord(6, false)).toBe(50);
    expect(scoreForTekaKataWord(7, false)).toBe(100);
    expect(scoreForTekaKataWord(8, false)).toBe(100);
  });

  it("computes boss scoring according to PRD section 25", () => {
    expect(scoreForTekaKataWord(3, true)).toBe(20);
    expect(scoreForTekaKataWord(4, true)).toBe(40);
    expect(scoreForTekaKataWord(5, true)).toBe(60);
    expect(scoreForTekaKataWord(6, true)).toBe(100);
    expect(scoreForTekaKataWord(7, true)).toBe(200);
    expect(scoreForTekaKataWord(9, true)).toBe(200);
  });
});

describe("Teka Kata Engine - canFormWord", () => {
  const letterPool = ["B", "A", "N", "D", "A", "R"];

  it("returns true when letters in word exist in pool with correct counts", () => {
    expect(canFormWord("BANDAR", letterPool)).toBe(true);
    expect(canFormWord("BADAN", letterPool)).toBe(true);
    expect(canFormWord("DANA", letterPool)).toBe(true);
    expect(canFormWord("DARA", letterPool)).toBe(true);
    expect(canFormWord("NADA", letterPool)).toBe(true);
  });

  it("returns false when word requires more occurrences than pool has", () => {
    // BANANA needs 3 A's and 2 N's, but pool only has 2 A's and 1 N
    expect(canFormWord("BANANA", letterPool)).toBe(false);
  });

  it("returns false when word contains a letter not in pool", () => {
    expect(canFormWord("KUCING", letterPool)).toBe(false);
  });
});

describe("Teka Kata Engine - calculateMinimalLetterPool", () => {
  it("calculates union of letter multiset", () => {
    const words = ["BANDAR", "BADAN", "DANA", "DARA", "NADA"];
    const pool = calculateMinimalLetterPool(words);
    // BANDAR has B:1, A:2, N:1, D:1, R:1
    // BADAN has B:1, A:2, D:1, N:1
    // Result should have A:2, B:1, D:1, N:1, R:1
    expect(pool).toEqual(["A", "A", "B", "D", "N", "R"]);
  });
});

describe("Teka Kata Engine - validateCrosswordPlacements", () => {
  it("validates valid crossword placement without conflicts", () => {
    const words = [
      { word: "BANDAR", row: 1, column: 0, direction: "horizontal" as const },
      { word: "BADAN", row: 1, column: 0, direction: "vertical" as const },
    ];
    // Intersection at (1,0): BANDAR[0] is 'B' and BADAN[0] is 'B' -> valid!
    const result = validateCrosswordPlacements(words, 7, 7);
    expect(result.isValid).toBe(true);
  });

  it("detects letter conflict at intersection", () => {
    const words = [
      { word: "BANDAR", row: 1, column: 0, direction: "horizontal" as const },
      { word: "KUCING", row: 1, column: 0, direction: "vertical" as const },
    ];
    // Intersection at (1,0): 'B' vs 'K' -> conflict!
    const result = validateCrosswordPlacements(words, 7, 7);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Letter conflict");
  });
});

describe("Teka Kata Engine - Anti-Cheat (Target Word Protection)", () => {
  const words: TekaKataPuzzleWordHost[] = [
    {
      id: "w1",
      word: "BANDAR",
      wordLength: 6,
      row: 0,
      column: 0,
      direction: "horizontal",
      points: 50,
      isFound: false,
      isRevealed: false,
    },
    {
      id: "w2",
      word: "BADAN",
      wordLength: 5,
      row: 0,
      column: 0,
      direction: "vertical",
      points: 30,
      isFound: true,
      isRevealed: false,
    },
  ];

  it("masks unrevealed words in public view to prevent client-side scraping", () => {
    const publicWords = buildPublicWords(words);
    expect(publicWords[0].word).toBeUndefined(); // w1 is hidden!
    expect(publicWords[1].word).toBe("BADAN"); // w2 is found so it is visible
  });

  it("masks cell letters for unrevealed and unfound cells in public cells view", () => {
    const { publicCells, hostCells } = buildGridCells(words, new Set(), 6, 6);

    // Position (0,0) is 'B' and found by w2 -> visible in both
    const cell00Public = publicCells.find((c) => c.row === 0 && c.column === 0);
    const cell00Host = hostCells.find((c) => c.row === 0 && c.column === 0);
    expect(cell00Public?.letter).toBe("B");
    expect(cell00Host?.actualLetter).toBe("B");

    // Position (0,1) is 'A' in BANDAR (w1, not found, not revealed)
    const cell01Public = publicCells.find((c) => c.row === 0 && c.column === 1);
    const cell01Host = hostCells.find((c) => c.row === 0 && c.column === 1);
    expect(cell01Public?.letter).toBeNull(); // HIDDEN from public
    expect(cell01Host?.actualLetter).toBe("A"); // VISIBLE to host
  });
});

describe("Teka Kata Generator", () => {
  it("generates a valid puzzle given a list of related words", () => {
    const words = [
      "BANDAR",
      "BADAN",
      "DANA",
      "DARA",
      "NADA",
      "RADA",
      "RABA",
      "ABAN",
      "BANA",
      "ADAN",
    ];

    const puzzle = generateTekaKataPuzzle({
      words,
      difficulty: "easy",
      targetWordCount: 4,
      minWordLength: 3,
      maxWordLength: 6,
      maxAttempts: 10,
    });

    expect(puzzle).not.toBeNull();
    if (puzzle) {
      expect(puzzle.words.length).toBeGreaterThanOrEqual(3);
      expect(puzzle.letters.length).toBeGreaterThanOrEqual(3);
      // Verify every word can be formed from letters
      for (const w of puzzle.words) {
        expect(canFormWord(w.word, puzzle.letters)).toBe(true);
      }
      // Verify crossword layout validity
      const validation = validateCrosswordPlacements(puzzle.words, puzzle.gridRows, puzzle.gridColumns);
      expect(validation.isValid).toBe(true);
    }
  });
});
