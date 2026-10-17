import type { PlacedWord } from "./engine.js";
import type { CrosswordDirection } from "./types.js";

export type Grid = (string | null)[][];

export function createGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array<string | null>(size).fill(null));
}

function isGridEmpty(grid: Grid): boolean {
  return grid.every((row) => row.every((cell) => cell === null));
}

/**
 * Checks if a word can be placed on the grid without invalid adjacencies:
 * it must cross at least one existing word, never touch a parallel word
 * side-by-side, and never run along (overlap) a word in the same direction.
 */
export function canPlaceWordOnGrid(
  word: string,
  row: number,
  col: number,
  direction: CrosswordDirection,
  grid: Grid,
  gridRows: number,
  gridCols: number,
): boolean {
  const len = word.length;
  const horizontal = direction === "horizontal";
  if (row < 0 || col < 0) return false;
  if (horizontal ? row >= gridRows || col + len > gridCols : col >= gridCols || row + len > gridRows) return false;

  // The cells right before the start and right after the end must be empty,
  // otherwise the word would merge with a neighbour into a longer "word".
  const beforeR = horizontal ? row : row - 1;
  const beforeC = horizontal ? col - 1 : col;
  const afterR = horizontal ? row : row + len;
  const afterC = horizontal ? col + len : col;
  if (beforeR >= 0 && beforeC >= 0 && grid[beforeR][beforeC] !== null) return false;
  if (afterR < gridRows && afterC < gridCols && grid[afterR][afterC] !== null) return false;

  let hasIntersection = false;
  let previousWasShared = false;
  for (let i = 0; i < len; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    const existing = grid[r][c];
    const char = word[i].toUpperCase();

    if (existing !== null) {
      if (existing !== char) return false;
      // Two shared cells in a row means this word lies on top of another one.
      if (previousWasShared) return false;
      hasIntersection = true;
      previousWasShared = true;
      continue;
    }
    previousWasShared = false;
    // Side neighbours must be empty unless the cell is an intersection.
    if (horizontal) {
      if (r > 0 && grid[r - 1][c] !== null) return false;
      if (r < gridRows - 1 && grid[r + 1][c] !== null) return false;
    } else {
      if (c > 0 && grid[r][c - 1] !== null) return false;
      if (c < gridCols - 1 && grid[r][c + 1] !== null) return false;
    }
  }

  return hasIntersection || isGridEmpty(grid);
}

export function applyWordToGrid(word: string, row: number, col: number, direction: CrosswordDirection, grid: Grid): void {
  for (let i = 0; i < word.length; i++) {
    const r = direction === "horizontal" ? row : row + i;
    const c = direction === "horizontal" ? col + i : col;
    grid[r][c] = word[i].toUpperCase();
  }
}

/** Crops placed words to their bounding box plus a one-cell margin where available. */
export function cropPlacements(
  placedWords: PlacedWord[],
  gridSize: number,
): { words: PlacedWord[]; rows: number; columns: number } {
  let minR = gridSize;
  let maxR = 0;
  let minC = gridSize;
  let maxC = 0;

  for (const pw of placedWords) {
    minR = Math.min(minR, pw.row);
    minC = Math.min(minC, pw.column);
    if (pw.direction === "horizontal") {
      maxR = Math.max(maxR, pw.row);
      maxC = Math.max(maxC, pw.column + pw.word.length - 1);
    } else {
      maxR = Math.max(maxR, pw.row + pw.word.length - 1);
      maxC = Math.max(maxC, pw.column);
    }
  }

  const shiftR = minR > 0 ? minR - 1 : 0;
  const shiftC = minC > 0 ? minC - 1 : 0;
  return {
    words: placedWords.map((pw) => ({ ...pw, row: pw.row - shiftR, column: pw.column - shiftC })),
    rows: maxR - shiftR + 2,
    columns: maxC - shiftC + 2,
  };
}
