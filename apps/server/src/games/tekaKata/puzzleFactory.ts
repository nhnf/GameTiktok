import { nanoid } from "nanoid";
import {
  TEKA_KATA_RANDOM_ROTATION,
  generateTekaKataPuzzle,
  scoreForTekaKataWord,
  wordCells,
  type TekaKataConfig,
  type TekaKataDifficulty,
  type TekaKataPuzzleStatus,
  type TekaKataPuzzleWordHost,
  type TekaKataWordRecord,
} from "@tebak-kata/shared";

export interface ActiveTekaKataPuzzle {
  dbId: string;
  category: { id: string; name: string };
  difficulty: TekaKataDifficulty;
  isBoss: boolean;
  letters: string[];
  gridRows: number;
  gridColumns: number;
  status: TekaKataPuzzleStatus;
  words: (TekaKataPuzzleWordHost & { bankWordId: string | null })[];
  revealedCellKeys: Set<string>; // "row,col"
  totalWords: number;
  foundWords: number;
}

const GENERAL_CATEGORY = { id: "general", name: "Umum" };

/**
 * Picks words from the bank (fresh ones first — anti-repetition), lays them
 * out as a crossword and returns the in-memory puzzle (not yet persisted).
 */
export function buildTekaKataPuzzle(
  config: TekaKataConfig,
  bank: TekaKataWordRecord[],
  usedWordIds: Set<string>,
  categories: Map<string, { id: string; name: string }>,
): Omit<ActiveTekaKataPuzzle, "dbId"> {
  const difficulty: TekaKataDifficulty =
    config.difficulty === "random" || !config.difficulty
      ? TEKA_KATA_RANDOM_ROTATION[Math.floor(Math.random() * TEKA_KATA_RANDOM_ROTATION.length)]
      : config.difficulty;

  const active = bank.filter((w) => w.isActive && w.isAllowed);
  if (active.length === 0) {
    throw new Error("Bank kata Susun Kata kosong. Tambahkan kata di Admin → Susun Kata → Bank Kata.");
  }

  // Random mode mixes every difficulty; a fixed difficulty filters when it can.
  let candidates = config.difficulty === "random" ? active : active.filter((w) => w.difficulty === difficulty);
  if (candidates.length < 3) candidates = active;

  let category = GENERAL_CATEGORY;
  if (config.categoryId) {
    const inCategory = candidates.filter((w) => w.categoryId === config.categoryId);
    if (inCategory.length >= 3) {
      candidates = inCategory;
      category = categories.get(config.categoryId) ?? GENERAL_CATEGORY;
    }
  }

  let fresh = candidates.filter((w) => !usedWordIds.has(w.id));
  if (fresh.length < 3) {
    for (const w of candidates) usedWordIds.delete(w.id);
    fresh = candidates;
  }

  const options = {
    difficulty,
    targetWordCount: config.wordCount ?? 50,
    minWordLength: config.minWordLength ?? 3,
    maxWordLength: config.maxWordLength ?? 12,
    maxAttempts: 25,
  };
  const generated =
    generateTekaKataPuzzle({ ...options, words: fresh.map((w) => w.word) }) ??
    generateTekaKataPuzzle({ ...options, words: candidates.map((w) => w.word) });
  if (!generated || generated.words.length === 0) {
    throw new Error("Gagal membuat puzzle Susun Kata dari bank kata saat ini. Coba generate ulang atau tambah kata.");
  }

  const isBoss = difficulty === "boss";
  const byWord = new Map(candidates.map((w) => [w.word, w.id]));
  const words = generated.words.map((gw) => {
    const bankWordId = byWord.get(gw.word) ?? null;
    if (bankWordId) usedWordIds.add(bankWordId);
    return {
      id: nanoid(),
      bankWordId,
      word: gw.word,
      wordLength: gw.word.length,
      row: gw.row,
      column: gw.column,
      direction: gw.direction,
      points: scoreForTekaKataWord(gw.word.length, isBoss),
      isFound: false,
      isRevealed: false,
      foundBy: null,
      foundAt: null,
    };
  });

  // Every word starts with its first and last letter shown as a hint.
  const revealedCellKeys = new Set<string>();
  for (const w of words) {
    const cells = wordCells(w);
    for (const cell of [cells[0], cells[cells.length - 1]]) revealedCellKeys.add(`${cell.row},${cell.column}`);
  }

  return {
    category,
    difficulty,
    isBoss,
    letters: generated.letters,
    gridRows: generated.gridRows,
    gridColumns: generated.gridColumns,
    status: "READY",
    words,
    revealedCellKeys,
    totalWords: words.length,
    foundWords: 0,
  };
}
