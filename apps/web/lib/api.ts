import type { ChampionEntry, GameStateHost, GameStatePublic, GameType, SessionSettings, SessionSummary } from "@tebak-kata/shared";
import { API_BASE } from "./config";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface RequestOptions {
  method?: string;
  token?: string | null;
  body?: unknown;
}

/** JSON request to the game server. Errors carry the server's (Indonesian) message. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Tidak bisa terhubung ke server game. Pastikan server berjalan.");
  }

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: unknown } | null;
    const message =
      typeof detail?.error === "string"
        ? detail.error
        : res.status === 401
          ? "Token host salah atau kedaluwarsa."
          : `Permintaan gagal (${res.status}).`;
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Generic CRUD wrapper for admin resources. */
export function crud<T, TInput = Partial<T>>(basePath: string) {
  return {
    list: (token: string, query?: Record<string, string>) => {
      const q = query ? "?" + new URLSearchParams(query).toString() : "";
      return request<T[]>(`${basePath}${q}`, { token });
    },
    create: (token: string, body: TInput) => request<T>(basePath, { method: "POST", token, body }),
    update: (token: string, id: string, body: TInput) => request<T>(`${basePath}/${id}`, { method: "PUT", token, body }),
    remove: (token: string, id: string) => request<void>(`${basePath}/${id}`, { method: "DELETE", token }),
  };
}

export interface AppConfig {
  liveSource: "mock" | "tiktok";
  tiktokUsername: string | null;
}

/** Word-game gift effects (Admin → Gift LIVE), shared by Tebak Kata and Susun Kata. */
export interface GiftDTO {
  id: string;
  giftId: string;
  giftName: string;
  effect: "REVEAL_NEXT_LETTER";
  enabled: boolean;
}

export type StartSessionBody = Partial<SessionSettings> & { tiktokUsername?: string };

/** Session-level API shared by every game module. */
export const api = {
  getConfig: () => request<AppConfig>("/api/config"),
  getPublicState: () => request<GameStatePublic>("/api/state/public"),
  getHostState: (token: string) => request<GameStateHost>("/api/state/host", { token }),

  startSession: (token: string, body?: StartSessionBody) =>
    request<GameStateHost & { warning?: string }>("/api/session/start", { method: "POST", token, body: body ?? {} }),
  pauseSession: (token: string) => request<GameStateHost>("/api/session/pause", { method: "POST", token }),
  resumeSession: (token: string) => request<GameStateHost>("/api/session/resume", { method: "POST", token }),
  endSession: (token: string) => request<SessionSummary>("/api/session/end", { method: "POST", token }),
  switchGame: (token: string, gameType: GameType) =>
    request<GameStateHost>("/api/session/switch-game", { method: "POST", token, body: { gameType } }),
  addLiveTime: (token: string, seconds: number) =>
    request<GameStateHost>("/api/session/add-time", { method: "POST", token, body: { seconds } }),
  setLiveTimerRate: (token: string, secondsPerCoin: number) =>
    request<GameStateHost>("/api/session/timer-rate", { method: "POST", token, body: { secondsPerCoin } }),
  setGiftGoalTarget: (token: string, targetCoins: number) =>
    request<GameStateHost>("/api/session/gift-goal", { method: "POST", token, body: { targetCoins } }),
  deleteChampion: (token: string, userId: string) =>
    request<GameStateHost>(`/api/session/champions/${encodeURIComponent(userId)}`, { method: "DELETE", token }),
  exportChampionsData: (token: string) =>
    request<{ version: number; exportedAt: string; sessions: unknown[] }>("/api/session/champions/export", { token }),
  importMergeChampionsData: (token: string, payload: unknown) =>
    request<GameStateHost & { mergeResult: { addedSessions: number; updatedChampions: ChampionEntry[] } }>(
      "/api/session/champions/import-merge",
      { method: "POST", token, body: payload },
    ),

  getSettings: (token: string) => request<SessionSettings>("/api/admin/settings", { token }),
  updateSettings: (token: string, body: Partial<SessionSettings>) =>
    request<SessionSettings>("/api/admin/settings", { method: "PUT", token, body }),

  gifts: crud<GiftDTO>("/api/admin/gifts"),

  mockComment: (token: string, body: { username: string; rawComment: string; platformUserId?: string }) =>
    request<{ ok: boolean }>("/api/mock/comment", { method: "POST", token, body }),
  mockGift: (token: string, body: { username: string; giftId: string; giftName?: string; count?: number; diamondCount?: number }) =>
    request<{ ok: boolean }>("/api/mock/gift", { method: "POST", token, body }),
};
