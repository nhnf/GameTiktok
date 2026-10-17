import type { Category, GameStateHost } from "@tebak-kata/shared";
import { crud, request } from "@/lib/api";

export interface WordDTO {
  id: string;
  word: string;
  categoryId: string;
  difficulty: "easy" | "medium" | "hard" | "boss";
  isActive: boolean;
  usageCount: number;
  category?: Category;
}

/** Tebak Kata host controls + admin (categories / word bank). */
export const tebakKataApi = {
  hint: (token: string) => request<GameStateHost>("/api/puzzle/hint", { method: "POST", token }),
  skip: (token: string) => request<GameStateHost>("/api/puzzle/skip", { method: "POST", token }),
  newWord: (token: string) => request<GameStateHost>("/api/puzzle/new", { method: "POST", token }),

  categories: crud<Category>("/api/admin/categories"),
  words: {
    ...crud<WordDTO>("/api/admin/words"),
    syncFromSusunKata: (token: string) =>
      request<{ ok: boolean; copiedCount: number }>("/api/admin/words/sync-from-susun-kata", { method: "POST", token }),
  },
};
