import { TEKA_KATA_SCORING } from "./constants.js";
import type {
  CrosswordDirection,
  TekaKataGridCellHost,
  TekaKataGridCellPublic,
  TekaKataPuzzleWordHost,
  TekaKataPuzzleWordPublic,
} from "./types.js";

/**
 * PRD Section 13 — Word Normalization.
 * 1. Trim whitespace
 * 2. Convert uppercase
 * 3. Normalize Unicode (NFKC)
 * 4. Remove unnecessary punctuation
 * 5. Normalize whitespace
 */
export function normalizeTekaKataWord(raw: string): string {
  if (typeof raw !== "string") return "";
  return raw
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .trim();
}

/**
 * PRD Section 25 — Scoring calculator.
 */
export function scoreForTekaKataWord(wordLength: number, isBoss = false): number {
  const table = isBoss ? TEKA_KATA_SCORING.boss : TEKA_KATA_SCORING.normal;
  if (wordLength <= 3) return table[3];
  if (wordLength === 4) return table[4];
  if (wordLength === 5) return table[5];
  if (wordLength === 6) return table[6];
  return table[7]; // 7+
}

/**
 * PRD Section 9 — Check if a word can be formed from the given letter pool.
 */
export function canFormWord(word: string, letterPool: string[]): boolean {
  const poolCounts: Record<string, number> = {};
  for (const l of letterPool) {
    const char = l.toUpperCase();
    poolCounts[char] = (poolCounts[char] || 0) + 1;
  }

  for (const char of word.toUpperCase()) {
    if (!poolCounts[char] || poolCounts[char] <= 0) {
      return false;
    }
    poolCounts[char]--;
  }

  return true;
}

/**
 * Calculates a minimal letter pool array that can form all provided words.
 */
export function calculateMinimalLetterPool(words: string[]): string[] {
  const maxCounts: Record<string, number> = {};
  for (const word of words) {
    const wordCounts: Record<string, number> = {};
    for (const char of word.toUpperCase()) {
      wordCounts[char] = (wordCounts[char] || 0) + 1;
    }
    for (const [char, count] of Object.entries(wordCounts)) {
      maxCounts[char] = Math.max(maxCounts[char] || 0, count);
    }
  }

  const pool: string[] = [];
  for (const [char, count] of Object.entries(maxCounts)) {
    for (let i = 0; i < count; i++) {
      pool.push(char);
    }
  }
  return pool.sort();
}

export interface PlacedWord {
  word: string;
  row: number;
  column: number;
  direction: CrosswordDirection;
}

/**
 * Validates whether placed words form a valid crossword without letter conflicts
 * and within the specified grid dimensions.
 */
export function validateCrosswordPlacements(
  words: PlacedWord[],
  gridRows: number,
  gridCols: number,
): { isValid: boolean; error?: string } {
  if (words.length === 0) return { isValid: false, error: "No words in puzzle" };

  const grid: (string | null)[][] = Array.from({ length: gridRows }, () =>
    Array(gridCols).fill(null),
  );

  for (const pw of words) {
    const len = pw.word.length;
    if (pw.row < 0 || pw.column < 0) {
      return { isValid: false, error: `Word "${pw.word}" has negative coordinates` };
    }

    if (pw.direction === "horizontal") {
      if (pw.column + len > gridCols || pw.row >= gridRows) {
        return { isValid: false, error: `Word "${pw.word}" exceeds horizontal grid bounds` };
      }
      for (let i = 0; i < len; i++) {
        const r = pw.row;
        const c = pw.column + i;
        const existing = grid[r][c];
        const letter = pw.word[i].toUpperCase();
        if (existing !== null && existing !== letter) {
          return {
            isValid: false,
            error: `Letter conflict at (${r},${c}): existing "${existing}" vs new "${letter}" for word "${pw.word}"`,
          };
        }
        grid[r][c] = letter;
      }
    } else {
      if (pw.row + len > gridRows || pw.column >= gridCols) {
        return { isValid: false, error: `Word "${pw.word}" exceeds vertical grid bounds` };
      }
      for (let i = 0; i < len; i++) {
        const r = pw.row + i;
        const c = pw.column;
        const existing = grid[r][c];
        const letter = pw.word[i].toUpperCase();
        if (existing !== null && existing !== letter) {
          return {
            isValid: false,
            error: `Letter conflict at (${r},${c}): existing "${existing}" vs new "${letter}" for word "${pw.word}"`,
          };
        }
        grid[r][c] = letter;
      }
    }
  }

  return { isValid: true };
}

/**
 * Builds grid cells matrix for Public and Host views.
 */
export function buildGridCells(
  words: TekaKataPuzzleWordHost[],
  revealedPositions: Set<string>, // "row,col"
  gridRows: number,
  gridCols: number,
): { publicCells: TekaKataGridCellPublic[]; hostCells: TekaKataGridCellHost[] } {
  // Map of coordinate to cell state
  const cellMap = new Map<
    string,
    {
      row: number;
      column: number;
      letter: string;
      isFound: boolean;
      isRevealed: boolean;
    }
  >();

  for (const pw of words) {
    const isWordFound = pw.isFound;
    const isWordRevealed = pw.isRevealed;

    for (let i = 0; i < pw.word.length; i++) {
      const r = pw.direction === "horizontal" ? pw.row : pw.row + i;
      const c = pw.direction === "horizontal" ? pw.column + i : pw.column;
      const key = `${r},${c}`;
      const char = pw.word[i].toUpperCase();

      const existing = cellMap.get(key);
      const isPosRevealed = isWordRevealed || isWordFound || revealedPositions.has(key);
      const isPosFound = isWordFound || (existing?.isFound ?? false);

      if (existing) {
        existing.isFound = existing.isFound || isWordFound;
        existing.isRevealed = existing.isRevealed || isPosRevealed;
      } else {
        cellMap.set(key, {
          row: r,
          column: c,
          letter: char,
          isFound: isPosFound,
          isRevealed: isPosRevealed,
        });
      }
    }
  }

  const publicCells: TekaKataGridCellPublic[] = [];
  const hostCells: TekaKataGridCellHost[] = [];

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const key = `${r},${c}`;
      const cell = cellMap.get(key);
      if (cell) {
        const isShown = cell.isFound || cell.isRevealed;
        publicCells.push({
          row: r,
          column: c,
          letter: isShown ? cell.letter : null,
          isOccupied: true,
          isFound: cell.isFound,
          isRevealed: cell.isRevealed,
        });
        hostCells.push({
          row: r,
          column: c,
          letter: isShown ? cell.letter : null,
          actualLetter: cell.letter,
          isOccupied: true,
          isFound: cell.isFound,
          isRevealed: cell.isRevealed,
        });
      } else {
        publicCells.push({
          row: r,
          column: c,
          letter: null,
          isOccupied: false,
          isFound: false,
          isRevealed: false,
        });
        hostCells.push({
          row: r,
          column: c,
          letter: null,
          actualLetter: "",
          isOccupied: false,
          isFound: false,
          isRevealed: false,
        });
      }
    }
  }

  return { publicCells, hostCells };
}

/**
 * Build sanitized public words (masking target words if unfound/unrevealed).
 */
export function buildPublicWords(words: TekaKataPuzzleWordHost[]): TekaKataPuzzleWordPublic[] {
  return words.map((w) => ({
    id: w.id,
    wordLength: w.word.length,
    row: w.row,
    column: w.column,
    direction: w.direction,
    points: w.points,
    isFound: w.isFound,
    isRevealed: w.isRevealed,
    word: w.isFound || w.isRevealed ? w.word : undefined,
    foundBy: w.foundBy,
    foundAt: w.foundAt,
  }));
}

/** Grid coordinates covered by a placed word, first letter first. */
export function wordCells(pw: { word: string; row: number; column: number; direction: CrosswordDirection }): {
  row: number;
  column: number;
  letter: string;
}[] {
  return pw.word.split("").map((letter, i) => ({
    row: pw.direction === "horizontal" ? pw.row : pw.row + i,
    column: pw.direction === "horizontal" ? pw.column + i : pw.column,
    letter: letter.toUpperCase(),
  }));
}
