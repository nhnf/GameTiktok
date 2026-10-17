import type { TekaKataConfig, TekaKataDifficulty } from "./types.js";

/** PRD Section 25 — Scoring Table */
export const TEKA_KATA_SCORING = {
  normal: {
    3: 10,
    4: 20,
    5: 30,
    6: 50,
    7: 100, // 7+
  },
  boss: {
    3: 20,
    4: 40,
    5: 60,
    6: 100,
    7: 200, // 7+
  },
} as const;

export const TEKA_KATA_DIFFICULTY_DEFAULTS: Record<
  TekaKataDifficulty,
  {
    minLetters: number;
    maxLetters: number;
    defaultWordCount: number;
    minWordLength: number;
    maxWordLength: number;
    gridSize: number;
  }
> = {
  easy: {
    minLetters: 3,
    maxLetters: 6,
    defaultWordCount: 50, // Unrestricted - place as many as fit
    minWordLength: 3,
    maxWordLength: 6,
    gridSize: 9,
  },
  medium: {
    minLetters: 4,
    maxLetters: 8,
    defaultWordCount: 50, // Unrestricted
    minWordLength: 3,
    maxWordLength: 8,
    gridSize: 11,
  },
  hard: {
    minLetters: 5,
    maxLetters: 10,
    defaultWordCount: 50, // Unrestricted
    minWordLength: 3,
    maxWordLength: 10,
    gridSize: 13,
  },
  boss: {
    minLetters: 6,
    maxLetters: 12,
    defaultWordCount: 50, // Unrestricted
    minWordLength: 3,
    maxWordLength: 12,
    gridSize: 15,
  },
};

export const DEFAULT_TEKA_KATA_CONFIG: TekaKataConfig = {
  difficulty: "random",
  categoryId: null,
  wordCount: 50, // Unrestricted
  minWordLength: 3,
  maxWordLength: 12,
  autoGenerateNext: true,
  allowGiftReveal: true,
};

export const TEKA_KATA_CATEGORIES_SEED = [
  { name: "Umum", description: "Kata-kata umum bahasa Indonesia" },
  { name: "Hewan", description: "Nama-nama hewan dan fauna" },
  { name: "Buah", description: "Nama-nama buah-buahan" },
  { name: "Makanan", description: "Nama makanan, minuman, dan kuliner" },
  { name: "Profesi", description: "Nama profesi dan pekerjaan" },
  { name: "Benda", description: "Nama-nama benda di sekitar kita" },
  { name: "Tempat", description: "Nama tempat dan lokasi" },
  { name: "Transportasi", description: "Kendaraan dan moda transportasi" },
  { name: "Teknologi", description: "Istilah teknologi dan komputer" },
  { name: "Alam", description: "Istilah alam, cuaca, dan geografi" },
  { name: "Olahraga", description: "Cabang olahraga dan istilah olahraga" },
] as const;

/** Weighted difficulty rotation used when the host picks "random". */
export const TEKA_KATA_RANDOM_ROTATION = ["easy", "easy", "medium", "medium", "hard", "boss"] as const;

/** Delay before the next puzzle starts after one is completed. */
export const TEKA_KATA_AUTO_ADVANCE_MS = 3500;
