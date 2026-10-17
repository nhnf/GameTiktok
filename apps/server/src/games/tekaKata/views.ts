import {
  buildGridCells,
  buildPublicWords,
  type TekaKataPuzzleHostState,
  type TekaKataPuzzlePublicState,
  type TekaKataPuzzleWordHost,
} from "@tebak-kata/shared";
import type { ActiveTekaKataPuzzle } from "./puzzleFactory.js";

function hostWords(p: ActiveTekaKataPuzzle): TekaKataPuzzleWordHost[] {
  return p.words.map(({ bankWordId: _bank, ...word }) => word);
}

/** Viewer-safe state: unfound words and hidden cells carry no letters (PRD 62–63 anti-cheat). */
export function tekaKataPublicView(p: ActiveTekaKataPuzzle): TekaKataPuzzlePublicState {
  const words = hostWords(p);
  const { publicCells } = buildGridCells(words, p.revealedCellKeys, p.gridRows, p.gridColumns);
  return {
    puzzleId: p.dbId,
    category: p.category,
    difficulty: p.difficulty,
    isBoss: p.isBoss,
    letters: p.letters,
    gridRows: p.gridRows,
    gridColumns: p.gridColumns,
    words: buildPublicWords(words),
    gridCells: publicCells,
    totalWords: p.totalWords,
    foundWords: p.foundWords,
    status: p.status,
  };
}

export function tekaKataHostView(p: ActiveTekaKataPuzzle): TekaKataPuzzleHostState {
  const words = hostWords(p);
  const { hostCells } = buildGridCells(words, p.revealedCellKeys, p.gridRows, p.gridColumns);
  return {
    puzzleId: p.dbId,
    category: p.category,
    difficulty: p.difficulty,
    isBoss: p.isBoss,
    letters: p.letters,
    gridRows: p.gridRows,
    gridColumns: p.gridColumns,
    words,
    gridCells: hostCells,
    totalWords: p.totalWords,
    foundWords: p.foundWords,
    status: p.status,
  };
}
