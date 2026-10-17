/** Tebak Kata — mirrors PRD_Tebak_Kata_Live_TikTok.md. */
import type { GiftEventView, PlayerRef } from "../../core/types.js";

export type Difficulty = "easy" | "medium" | "hard" | "boss";

export type PuzzleStatus = "ACTIVE" | "SOLVED" | "SKIPPED";

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface WordRecord {
  id: string;
  word: string; // stored normalized (uppercase, no punctuation)
  categoryId: string;
  difficulty: Difficulty;
  isActive: boolean;
  usageCount: number;
}

/** Public-facing puzzle state — never exposes the unrevealed target letters. */
export interface PuzzlePublicState {
  puzzleId: string;
  category: Category;
  difficulty: Difficulty;
  isBoss: boolean;
  wordLength: number;
  /** One entry per letter position; null = hidden. */
  display: (string | null)[];
  revealedLength: number;
  status: PuzzleStatus;
  winner: PlayerRef | null;
  rewardPoints: number;
}

/** Host-only puzzle state — includes the answer. */
export interface PuzzleHostState extends PuzzlePublicState {
  targetWord: string;
}

export interface ScoringConfig {
  easy: number;
  medium: number;
  hard: number;
  boss: number;
}

/** Realtime events (PRD Tebak Kata §39). */
export type TebakKataServerEvent =
  | { type: "LETTER_REVEALED"; payload: { position: number; letter: string; source: "GUESS" | "HINT" | "GIFT" } }
  | { type: "PLAYER_WON"; payload: { winner: PlayerRef; points: number; word: string } }
  | { type: "NEW_PUZZLE"; payload: PuzzlePublicState }
  | { type: "HINT_USED"; payload: { position: number; letter: string } }
  | { type: "GIFT_RECEIVED"; payload: GiftEventView }
  | { type: "PUZZLE_SKIPPED"; payload: { word: string } }
  | { type: "BOSS_STARTED"; payload: PuzzlePublicState }
  | { type: "BOSS_DEFEATED"; payload: { winner: PlayerRef; points: number; word: string } }
  | { type: "ALL_LETTERS_REVEALED"; payload: Record<string, never> };
