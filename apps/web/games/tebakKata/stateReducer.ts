import type { PuzzlePublicState, ServerEvent } from "@tebak-kata/shared";

/** Applies Tebak Kata realtime events between full state snapshots. */
export function patchTebakPuzzle<T extends PuzzlePublicState>(puzzle: T | null, event: ServerEvent): T | null {
  if (!puzzle || event.type !== "LETTER_REVEALED") return puzzle;
  const display = [...puzzle.display];
  display[event.payload.position] = event.payload.letter;
  return { ...puzzle, display, revealedLength: Math.max(puzzle.revealedLength, event.payload.position + 1) };
}
