import type { GameStateHost, MathConfig, MathQuestionHostState } from "@tebak-kata/shared";
import { request } from "@/lib/api";

/** Matematika LIVE host controls + question history. */
export const mathApi = {
  generate: (token: string, config?: Partial<MathConfig>) =>
    request<{ ok: boolean; question: MathQuestionHostState; hostState: GameStateHost }>("/api/matematika/generate", {
      method: "POST",
      token,
      body: config ?? {},
    }),
  start: (token: string) => request<GameStateHost>("/api/matematika/start", { method: "POST", token }),
  reveal: (token: string) => request<GameStateHost>("/api/matematika/reveal", { method: "POST", token }),
  skip: (token: string) => request<GameStateHost>("/api/matematika/skip", { method: "POST", token }),
  updateConfig: (token: string, config: Partial<MathConfig>) =>
    request<{ ok: boolean; config: MathConfig }>("/api/matematika/config", { method: "POST", token, body: config }),
  history: (token: string, limit = 20) => request<unknown[]>(`/api/matematika/history?limit=${limit}`, { token }),
};
