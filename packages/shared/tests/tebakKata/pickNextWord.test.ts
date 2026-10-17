import { describe, expect, it } from "vitest";
import { pickNextWord, type WordRecord } from "../../src/index.js";

const word = (id: string, difficulty: WordRecord["difficulty"], isActive = true): WordRecord => ({
  id,
  word: id.toUpperCase(),
  categoryId: "c",
  difficulty,
  isActive,
  usageCount: 0,
});

describe("pickNextWord", () => {
  it("falls back to another difficulty instead of failing (no boss words in the bank)", () => {
    const words = [word("meja", "easy"), word("kursi", "medium")];
    const picked = pickNextWord(words, "boss", new Set());
    expect(picked).not.toBeNull();
  });

  it("returns null only when there is no active word at all", () => {
    expect(pickNextWord([word("meja", "easy", false)], "easy", new Set())).toBeNull();
  });

  it("goes through the whole pool before repeating a word", () => {
    const words = [word("a1", "easy"), word("a2", "easy"), word("a3", "easy")];
    const used = new Set<string>();
    const seen = new Set<string>();
    for (let i = 0; i < 3; i++) seen.add(pickNextWord(words, "easy", used)!.id);
    expect(seen.size).toBe(3);
    // Next cycle starts cleanly.
    expect(pickNextWord(words, "easy", used)).not.toBeNull();
  });
});
