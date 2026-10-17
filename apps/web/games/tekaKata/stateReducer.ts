import type { ServerEvent, TekaKataPuzzleHostState, TekaKataPuzzlePublicState } from "@tebak-kata/shared";

type AnyPuzzle = TekaKataPuzzlePublicState | TekaKataPuzzleHostState;

function revealCells<T extends AnyPuzzle>(puzzle: T, cells: Map<string, string>, found: boolean): T["gridCells"] {
  return puzzle.gridCells.map((c) => {
    const letter = cells.get(`${c.row},${c.column}`);
    if (letter === undefined) return c;
    return { ...c, letter, isRevealed: true, isFound: c.isFound || found };
  }) as T["gridCells"];
}

/** Applies Susun Kata realtime events between full state snapshots. */
export function patchTekaPuzzle<T extends AnyPuzzle>(puzzle: T | null, event: ServerEvent): T | null {
  if (!puzzle) return puzzle;
  switch (event.type) {
    case "TK_PUZZLE_READY":
    case "TK_PUZZLE_STARTED":
      // Full snapshots follow immediately; keep the host-only fields until then.
      return event.payload.puzzleId === puzzle.puzzleId ? { ...puzzle, status: event.payload.status } : puzzle;
    case "TK_LETTER_REVEALED": {
      const { row, column, letter } = event.payload;
      return { ...puzzle, gridCells: revealCells(puzzle, new Map([[`${row},${column}`, letter]]), false) };
    }
    case "TK_WORD_FOUND": {
      const { wordId, word, player, foundWords, isComplete, revealedPositions } = event.payload;
      const words = puzzle.words.map((w) => (w.id === wordId ? { ...w, isFound: true, word, foundBy: player, foundAt: new Date().toISOString() } : w));
      const cells = new Map(revealedPositions.map((p) => [`${p.row},${p.column}`, p.letter]));
      return {
        ...puzzle,
        words: words as T["words"],
        gridCells: revealCells(puzzle, cells, true),
        foundWords,
        status: isComplete ? "COMPLETED" : puzzle.status,
      };
    }
    case "TK_WORD_REVEALED": {
      const { wordId, word, row, column, direction, foundWords, isComplete } = event.payload;
      const words = puzzle.words.map((w) => (w.id === wordId ? { ...w, isRevealed: true, word } : w));
      const cells = new Map(
        word.split("").map((letter, i) => [direction === "horizontal" ? `${row},${column + i}` : `${row + i},${column}`, letter] as const),
      );
      return {
        ...puzzle,
        words: words as T["words"],
        gridCells: revealCells(puzzle, cells, false),
        foundWords,
        status: isComplete ? "COMPLETED" : puzzle.status,
      };
    }
    case "TK_PUZZLE_COMPLETED":
      return { ...puzzle, status: "COMPLETED", foundWords: event.payload.foundWords };
    case "TK_PUZZLE_SKIPPED":
      return { ...puzzle, status: "SKIPPED" };
    default:
      return puzzle;
  }
}
