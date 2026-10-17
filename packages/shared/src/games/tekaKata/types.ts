/** Susun Kata (Teka Kata) — mirrors PRD_TEKA_KATA_LIVE_UPDATE 1.md. */
import type { PlayerRef } from "../../core/types.js";

export type TekaKataDifficulty = "easy" | "medium" | "hard" | "boss";

export type CrosswordDirection = "horizontal" | "vertical";

export type TekaKataPuzzleStatus = "DRAFT" | "READY" | "ACTIVE" | "COMPLETING" | "COMPLETED" | "SKIPPED";

export interface TekaKataCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TekaKataWordRecord {
  id: string;
  word: string; // uppercase
  normalizedWord: string; // uppercase, trimmed, clean
  categoryId: string;
  difficulty: TekaKataDifficulty;
  minimumLength: number;
  maximumLength: number;
  isAllowed: boolean;
  isActive: boolean;
  usageCount: number;
  category?: TekaKataCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface TekaKataGridCellPublic {
  row: number;
  column: number;
  letter: string | null; // null if unrevealed and unfound
  isOccupied: boolean;
  isFound: boolean;
  isRevealed: boolean;
}

export interface TekaKataGridCellHost extends TekaKataGridCellPublic {
  actualLetter: string;
}

export interface TekaKataPuzzleWordPublic {
  id: string;
  wordLength: number;
  row: number;
  column: number;
  direction: CrosswordDirection;
  points: number;
  isFound: boolean;
  isRevealed: boolean;
  /** Only populated if isFound or isRevealed is true. Hidden otherwise for viewer anti-cheat. */
  word?: string;
  foundBy?: PlayerRef | null;
  foundAt?: string | null;
}

export interface TekaKataPuzzleWordHost extends TekaKataPuzzleWordPublic {
  word: string; // Always visible to host
}

export interface TekaKataPuzzlePublicState {
  puzzleId: string;
  category: { id: string; name: string };
  difficulty: TekaKataDifficulty;
  isBoss: boolean;
  letters: string[]; // Letter pool
  gridRows: number;
  gridColumns: number;
  words: TekaKataPuzzleWordPublic[];
  gridCells: TekaKataGridCellPublic[];
  totalWords: number;
  foundWords: number;
  status: TekaKataPuzzleStatus;
}

export interface TekaKataPuzzleHostState extends Omit<TekaKataPuzzlePublicState, "words" | "gridCells"> {
  words: TekaKataPuzzleWordHost[];
  gridCells: TekaKataGridCellHost[];
}

export interface TekaKataConfig {
  difficulty: TekaKataDifficulty | "random";
  categoryId: string | null;
  wordCount?: number;
  minWordLength?: number;
  maxWordLength?: number;
  autoGenerateNext: boolean;
  allowGiftReveal: boolean;
}

export interface TekaKataAnswerEvaluation {
  rawComment: string;
  normalized: string;
  status: "CORRECT" | "ALREADY_FOUND" | "INVALID";
  matchedWord?: TekaKataPuzzleWordHost;
  points: number;
}

export interface TekaKataRevealedCell {
  row: number;
  column: number;
  letter: string;
}

/** Realtime events (PRD Teka Kata §60). */
export type TekaKataServerEvent =
  | { type: "TK_PUZZLE_READY"; payload: TekaKataPuzzlePublicState }
  | { type: "TK_PUZZLE_STARTED"; payload: TekaKataPuzzlePublicState }
  | {
      type: "TK_WORD_FOUND";
      payload: {
        puzzleId: string;
        wordId: string;
        word: string;
        player: PlayerRef;
        points: number;
        isComplete: boolean;
        foundWords: number;
        totalWords: number;
        revealedPositions: TekaKataRevealedCell[];
      };
    }
  | { type: "TK_PLAYER_SCORED"; payload: { player: PlayerRef; points: number; totalPoints: number } }
  | { type: "TK_LETTER_REVEALED"; payload: TekaKataRevealedCell & { source: "HINT" | "GIFT" | "HOST" } }
  | {
      type: "TK_WORD_REVEALED";
      payload: {
        wordId: string;
        word: string;
        row: number;
        column: number;
        direction: CrosswordDirection;
        isComplete: boolean;
        foundWords: number;
        totalWords: number;
      };
    }
  | {
      type: "TK_PUZZLE_COMPLETED";
      payload: {
        puzzleId: string;
        foundWords: number;
        totalWords: number;
        /** Whether a new puzzle will start automatically. */
        autoNext: boolean;
        words: { word: string; foundBy?: PlayerRef | null; points: number }[];
      };
    }
  | { type: "TK_PUZZLE_SKIPPED"; payload: { puzzleId: string } };
