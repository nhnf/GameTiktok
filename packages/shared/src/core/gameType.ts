/** Every game module the platform can run. One LIVE session plays one game at a time. */
export type GameType = "TEBAK_KATA" | "TEKA_KATA" | "MATEMATIKA" | "AUTO_BATTLE" | "MATEMATIKA_BATTLE";

export const GAME_TYPES: readonly GameType[] = [
  "TEBAK_KATA",
  "TEKA_KATA",
  "MATEMATIKA",
  "MATEMATIKA_BATTLE",
  "AUTO_BATTLE",
];

export interface GameInfo {
  /** Short name used in pickers, overlay headers and admin navigation. */
  label: string;
  emoji: string;
  /** One-line description of how viewers play. */
  description: string;
}

export const GAME_INFO: Record<GameType, GameInfo> = {
  TEBAK_KATA: {
    label: "Tebak Kata",
    emoji: "🎯",
    description: "Tebak kata lewat komentar, huruf yang cocok dari depan langsung terbuka.",
  },
  TEKA_KATA: {
    label: "Susun Kata",
    emoji: "🧩",
    description: "Susun kata dari huruf yang tersedia untuk mengisi teka-teki silang.",
  },
  MATEMATIKA: {
    label: "Matematika LIVE",
    emoji: "🔢",
    description: "Jawab soal hitung cepat, makin cepat benar makin besar poinnya.",
  },
  MATEMATIKA_BATTLE: {
    label: "Tarik Tambang",
    emoji: "💪",
    description: "Dua tim (Biru vs Merah) adu hitung cepat untuk menarik tali.",
  },
  AUTO_BATTLE: {
    label: "Auto Battle",
    emoji: "⚔️",
    description: "Gift penonton memanggil pasukan yang bertarung otomatis.",
  },
};

export function isGameType(value: unknown): value is GameType {
  return typeof value === "string" && (GAME_TYPES as readonly string[]).includes(value);
}
