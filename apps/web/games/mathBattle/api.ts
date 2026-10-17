import type { GameStateHost, MathBattleConfig, MathBattleGiftMapping, MathBattleTeamId } from "@tebak-kata/shared";
import { request } from "@/lib/api";

/** Tarik Tambang host controls + admin (gift mapping, history). */
export const mathBattleApi = {
  start: (token: string) => request<GameStateHost>("/api/math-battle/start", { method: "POST", token }),
  nextRound: (token: string) => request<GameStateHost>("/api/math-battle/next-round", { method: "POST", token }),
  pause: (token: string) => request<GameStateHost>("/api/math-battle/pause", { method: "POST", token }),
  resume: (token: string) => request<GameStateHost>("/api/math-battle/resume", { method: "POST", token }),
  end: (token: string, winner?: MathBattleTeamId | "DRAW") =>
    request<GameStateHost>("/api/math-battle/end", { method: "POST", token, body: { winner } }),
  reset: (token: string) => request<GameStateHost>("/api/math-battle/reset", { method: "POST", token }),
  movePlayer: (token: string, userId: string, team: MathBattleTeamId) =>
    request<GameStateHost>("/api/math-battle/move-player", { method: "POST", token, body: { userId, team } }),
  getConfig: (token: string) => request<MathBattleConfig>("/api/math-battle/config", { token }),
  updateConfig: (token: string, config: Partial<MathBattleConfig>) =>
    request<{ ok: boolean; config: MathBattleConfig }>("/api/math-battle/config", { method: "PUT", token, body: config }),
  gifts: (token: string) => request<MathBattleGiftMapping[]>("/api/math-battle/gifts", { token }),
  saveGift: (token: string, gift: Partial<MathBattleGiftMapping>) =>
    request<MathBattleGiftMapping>("/api/math-battle/gifts", { method: "POST", token, body: gift }),
  deleteGift: (token: string, id: string) => request<{ ok: boolean }>(`/api/math-battle/gifts/${id}`, { method: "DELETE", token }),
  resetGifts: (token: string) => request<MathBattleGiftMapping[]>("/api/math-battle/gifts/reset-defaults", { method: "POST", token }),
  history: (token: string, page = 1, limit = 20) =>
    request<{ items: unknown[]; total: number; page: number; limit: number }>(`/api/math-battle/history?page=${page}&limit=${limit}`, {
      token,
    }),
};
