import type { GameStateHost, TekaKataCategory, TekaKataConfig, TekaKataDifficulty, TekaKataPuzzleHostState } from "@tebak-kata/shared";
import { crud, request } from "@/lib/api";

export interface TekaKataWordDTO {
  id: string;
  word: string;
  normalizedWord: string;
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

export interface CsvImportResult {
  ok?: boolean;
  importedCount?: number;
  preview?: { word: string; categoryName: string; difficulty: TekaKataDifficulty }[];
  totalValid?: number;
  totalErrors?: number;
  errors?: Array<{ line: number; raw: string; error: string }>;
}

/** Susun Kata host controls + admin (categories / word bank / CSV / history). */
export const tekaKataApi = {
  generate: (token: string, config?: Partial<TekaKataConfig>) =>
    request<{ ok: boolean; puzzle: TekaKataPuzzleHostState; hostState: GameStateHost }>("/api/teka-kata/generate", {
      method: "POST",
      token,
      body: config ?? {},
    }),
  start: (token: string) => request<GameStateHost>("/api/teka-kata/start", { method: "POST", token }),
  revealLetter: (token: string) => request<GameStateHost>("/api/teka-kata/reveal-letter", { method: "POST", token }),
  revealWord: (token: string, wordId?: string) =>
    request<GameStateHost>("/api/teka-kata/reveal-word", { method: "POST", token, body: { wordId } }),
  skip: (token: string) => request<GameStateHost>("/api/teka-kata/skip", { method: "POST", token }),
  updateConfig: (token: string, config: Partial<TekaKataConfig>) =>
    request<{ ok: boolean; config: TekaKataConfig }>("/api/teka-kata/config", { method: "POST", token, body: config }),

  categories: crud<TekaKataCategory>("/api/admin/teka-kata/categories"),
  words: {
    ...crud<TekaKataWordDTO>("/api/admin/teka-kata/words"),
    bulk: (token: string, ids: string[], action: "toggle" | "delete", isActive?: boolean) =>
      request<{ ok: boolean; count: number }>("/api/admin/teka-kata/words/bulk", { method: "POST", token, body: { ids, action, isActive } }),
  },
  importCsv: (token: string, csvContent: string, dryRun = false) =>
    request<CsvImportResult>("/api/admin/teka-kata/import-csv", { method: "POST", token, body: { csvContent, dryRun } }),
  history: (token: string, limit = 20) => request<unknown[]>(`/api/admin/teka-kata/history?limit=${limit}`, { token }),
};
