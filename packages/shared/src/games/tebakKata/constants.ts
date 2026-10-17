import type { Difficulty, ScoringConfig } from "./types.js";

/** PRD section 13.2 — recommended V1 scoring, configurable via admin. */
export const DEFAULT_SCORING: ScoringConfig = {
  easy: 5,
  medium: 10,
  hard: 20,
  boss: 50,
};

/** PRD section 20 — boss triggered every N solved words (example used 10). */
export const DEFAULT_BOSS_EVERY_N_WORDS = 10;

/** PRD section 30 — anti-repetition: word can't reappear within this many puzzles. */
export const DEFAULT_ANTI_REPEAT_WINDOW = 8;

/** Weighted difficulty rotation for non-boss words. */
export const TEBAK_KATA_DIFFICULTY_ROTATION: readonly Difficulty[] = ["easy", "easy", "medium", "medium", "hard"];

/** Delay before the next word appears after someone solves one. */
export const TEBAK_KATA_AUTO_ADVANCE_MS = 2800;

export const CATEGORY_SEED = [
  { name: "Makanan", emoji: "🍔" },
  { name: "Hewan", emoji: "🐾" },
  { name: "Benda", emoji: "📦" },
  { name: "Tempat", emoji: "📍" },
  { name: "Negara", emoji: "🌍" },
  { name: "Profesi", emoji: "💼" },
  { name: "Kendaraan", emoji: "🚗" },
  { name: "Teknologi", emoji: "💻" },
  { name: "Olahraga", emoji: "⚽" },
  { name: "Musik", emoji: "🎵" },
  { name: "Film", emoji: "🎬" },
  { name: "Alam", emoji: "🌿" },
  { name: "Pendidikan", emoji: "🎓" },
  { name: "Umum", emoji: "🔤" },
] as const;
