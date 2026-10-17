import { calculateMinimalLetterPool, canFormWord, validateCrosswordPlacements, type PlacedWord } from "./engine.js";
import { TEKA_KATA_DIFFICULTY_DEFAULTS } from "./constants.js";
import { applyWordToGrid, canPlaceWordOnGrid, createGrid, cropPlacements, type Grid } from "./generatorGrid.js";
import type { CrosswordDirection, TekaKataDifficulty } from "./types.js";

export interface GeneratePuzzleOptions {
  words: string[]; // pool of available candidate words (uppercase)
  difficulty: TekaKataDifficulty;
  targetWordCount?: number;
  minWordLength?: number;
  maxWordLength?: number;
  maxAttempts?: number;
  random?: () => number;
}

export interface GeneratedPuzzleResult {
  letters: string[];
  gridRows: number;
  gridColumns: number;
  words: {
    word: string;
    row: number;
    column: number;
    direction: CrosswordDirection;
  }[];
}

interface PlacementCandidate extends PlacedWord {
  score: number;
}

/** How many companion words are sampled when widening the letter pool (keeps generation fast on big banks). */
const COMPANION_SAMPLE = 80;

function shuffled<T>(list: readonly T[], random: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Builds the letter pool from a root word, widened with up to two companion
 * words that unlock the most extra vocabulary while staying within the
 * difficulty's letter budget.
 */
function buildLetterPool(
  rootWord: string,
  eligibleWords: string[],
  maxLetters: number,
  random: () => number,
): { pool: string[]; matching: string[] } {
  let pool = rootWord.split("").sort();
  let matching = eligibleWords.filter((w) => canFormWord(w, pool));

  for (let round = 0; round < 2; round++) {
    let best: { pool: string[]; matching: string[] } | null = null;
    for (const other of shuffled(eligibleWords, random).slice(0, COMPANION_SAMPLE)) {
      if (canFormWord(other, pool)) continue;
      const combined = calculateMinimalLetterPool([pool.join(""), other]);
      if (combined.length > maxLetters) continue;
      const combinedMatching = eligibleWords.filter((w) => canFormWord(w, combined));
      if (!best || combinedMatching.length > best.matching.length) best = { pool: combined, matching: combinedMatching };
    }
    if (!best || best.matching.length <= matching.length) break;
    pool = best.pool;
    matching = best.matching;
  }
  return { pool, matching };
}

function findPlacements(word: string, placedWords: PlacedWord[], grid: Grid, gridSize: number): PlacementCandidate[] {
  const placements: PlacementCandidate[] = [];
  for (const placed of placedWords) {
    const direction: CrosswordDirection = placed.direction === "horizontal" ? "vertical" : "horizontal";
    for (let pIdx = 0; pIdx < placed.word.length; pIdx++) {
      for (let cIdx = 0; cIdx < word.length; cIdx++) {
        if (word[cIdx] !== placed.word[pIdx]) continue;
        const row = placed.direction === "horizontal" ? placed.row - cIdx : placed.row + pIdx;
        const column = placed.direction === "horizontal" ? placed.column + pIdx : placed.column - cIdx;
        if (!canPlaceWordOnGrid(word, row, column, direction, grid, gridSize, gridSize)) continue;
        const centerDist = Math.abs(row - gridSize / 2) + Math.abs(column - gridSize / 2);
        placements.push({ word, row, column, direction, score: 100 - centerDist });
      }
    }
  }
  return placements;
}

/**
 * Generates a valid crossword puzzle: a letter pool plus as many formable
 * words as fit on the grid (up to `targetWordCount`).
 */
export function generateTekaKataPuzzle(options: GeneratePuzzleOptions): GeneratedPuzzleResult | null {
  const {
    words: rawWords,
    difficulty,
    targetWordCount = 50,
    minWordLength = 3,
    maxWordLength = 12,
    maxAttempts = 20,
    random = Math.random,
  } = options;

  const defaults = TEKA_KATA_DIFFICULTY_DEFAULTS[difficulty];
  const gridSize = Math.max(defaults.gridSize, 11);
  const minLen = Math.min(minWordLength, maxWordLength);
  const maxLen = Math.max(minWordLength, maxWordLength);

  const eligibleWords = Array.from(
    new Set(
      rawWords
        .map((w) => w.toUpperCase().trim())
        .filter((w) => w.length >= minLen && w.length <= maxLen && w.length <= gridSize && /^[A-Z]+$/.test(w)),
    ),
  );
  if (eligibleWords.length < 2) return null;

  const sortedByLen = [...eligibleWords].sort((a, b) => b.length - a.length);
  const rootCandidates = sortedByLen.filter((w) => w.length >= Math.max(minLen + 1, Math.min(maxLen, 5)));
  const rootPool = rootCandidates.length > 0 ? rootCandidates : sortedByLen;

  let best: GeneratedPuzzleResult | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rootWord = rootPool[Math.floor(random() * rootPool.length)];
    const { matching } = buildLetterPool(rootWord, eligibleWords, defaults.maxLetters + 2, random);
    if (matching.length < 2) continue;

    // Root word first, then longer words (random order among equal lengths).
    const candidateList = [
      rootWord,
      ...shuffled(
        matching.filter((w) => w !== rootWord),
        random,
      ).sort((a, b) => b.length - a.length),
    ];

    const grid = createGrid(gridSize);
    const startRow = Math.floor(gridSize / 2);
    const startCol = Math.max(0, Math.floor((gridSize - rootWord.length) / 2));
    applyWordToGrid(rootWord, startRow, startCol, "horizontal", grid);
    const placedWords: PlacedWord[] = [{ word: rootWord, row: startRow, column: startCol, direction: "horizontal" }];

    for (let i = 1; i < candidateList.length && placedWords.length < targetWordCount; i++) {
      const word = candidateList[i];
      const placements = findPlacements(word, placedWords, grid, gridSize);
      if (placements.length === 0) continue;
      placements.sort((a, b) => b.score - a.score);
      const chosen = placements[0];
      applyWordToGrid(chosen.word, chosen.row, chosen.column, chosen.direction, grid);
      placedWords.push({ word: chosen.word, row: chosen.row, column: chosen.column, direction: chosen.direction });
    }

    if (placedWords.length < 2) continue;
    const cropped = cropPlacements(placedWords, gridSize);
    if (!validateCrosswordPlacements(cropped.words, cropped.rows, cropped.columns).isValid) continue;

    const result: GeneratedPuzzleResult = {
      letters: calculateMinimalLetterPool(cropped.words.map((w) => w.word)),
      gridRows: cropped.rows,
      gridColumns: cropped.columns,
      words: cropped.words,
    };
    // Keep the richest puzzle; three or more words is good enough to stop early.
    if (!best || result.words.length > best.words.length) best = result;
    if (best.words.length >= 3) break;
  }

  return best;
}
