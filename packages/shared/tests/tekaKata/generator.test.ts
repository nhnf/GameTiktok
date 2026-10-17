import { describe, expect, it } from "vitest";
import { generateTekaKataPuzzle, validateCrosswordPlacements, wordCells } from "../../src/index.js";
import { canPlaceWordOnGrid, createGrid, applyWordToGrid } from "../../src/games/tekaKata/generatorGrid.js";

function seeded(seed = 7): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const BANK = [
  "BANDAR", "BADAN", "DANA", "DARA", "NADA", "RABA", "BARA", "ABAD", "ANDA", "BANDA",
  "KUCING", "KUNCI", "CINTA", "TANAH", "RUMAH", "MAKAN", "MINUM", "AKAR", "KARTU", "RATU",
];

describe("Susun Kata generator", () => {
  it("never lays a word on top of a parallel word", () => {
    const grid = createGrid(11);
    applyWordToGrid("DANA", 5, 2, "horizontal", grid);
    // "ADAN" would share two consecutive cells with DANA on the same row.
    expect(canPlaceWordOnGrid("DANAR", 5, 2, "horizontal", grid, 11, 11)).toBe(false);
  });

  it("produces valid, non-overlapping puzzles repeatedly", () => {
    const random = seeded();
    for (let i = 0; i < 30; i++) {
      const puzzle = generateTekaKataPuzzle({ words: BANK, difficulty: "medium", random });
      expect(puzzle).not.toBeNull();
      const p = puzzle!;
      expect(p.words.length).toBeGreaterThanOrEqual(2);
      expect(validateCrosswordPlacements(p.words, p.gridRows, p.gridColumns).isValid).toBe(true);
      // Every cell is shared by at most one horizontal and one vertical word.
      const owners = new Map<string, Set<string>>();
      for (const w of p.words) {
        for (const c of wordCells(w)) {
          const key = `${c.row},${c.column}`;
          const dirs = owners.get(key) ?? new Set<string>();
          expect(dirs.has(w.direction)).toBe(false);
          dirs.add(w.direction);
          owners.set(key, dirs);
        }
      }
    }
  });

  it("stays fast on a large word bank", () => {
    const letters = "ABCDEIKLMNORSTU";
    const random = seeded(3);
    const big = Array.from({ length: 1500 }, () =>
      Array.from({ length: 3 + Math.floor(random() * 6) }, () => letters[Math.floor(random() * letters.length)]).join(""),
    );
    const started = Date.now();
    generateTekaKataPuzzle({ words: [...BANK, ...big], difficulty: "hard", random });
    expect(Date.now() - started).toBeLessThan(3000);
  });
});
