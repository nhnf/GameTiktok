import type { BattleConfig, BattleGiftLogView, BattleGiftMapping, GameStateHost } from "@tebak-kata/shared";
import { crud, request } from "@/lib/api";

export interface SeenGiftDTO {
  id: string;
  giftId: string;
  giftName: string;
  diamondCount: number;
  imageUrl: string | null;
  timesSeen: number;
  lastSender: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface BattleMatchDTO {
  id: string;
  matchNumber: number;
  winner: "A" | "B" | null;
  reason: string | null;
  teamAName: string;
  teamBName: string;
  teamABaseHp: number | null;
  teamBBaseHp: number | null;
  duration: number | null;
  totalGifts: number;
  teamAGifts: number;
  teamBGifts: number;
  unitsSpawned: number;
  startedAt: string;
  endedAt: string | null;
  contributions: { viewerId: string; viewerName: string; score: number; unitsSpawned: number; damage: number; totalGifts: number }[];
}

export interface CatalogGiftDTO {
  id: string;
  name: string;
  diamondCount: number;
  imageUrl: string | null;
  combo: boolean;
}

export type BattleMappingInput = Omit<BattleGiftMapping, "id">;

/** Auto Battle Arena host controls + admin (gift mapping, teams/units, history). */
export const battleApi = {
  match: (token: string, action: "start" | "end" | "reset" | "pause" | "resume") =>
    request<GameStateHost>(`/api/battle/match/${action}`, { method: "POST", token }),
  getConfig: (token: string) => request<BattleConfig>("/api/battle/config", { token }),
  updateConfig: (token: string, body: Partial<BattleConfig>) => request<BattleConfig>("/api/battle/config", { method: "PUT", token, body }),
  resetConfig: (token: string) => request<BattleConfig>("/api/battle/config/reset", { method: "POST", token }),
  mappings: {
    ...crud<BattleGiftMapping, Partial<BattleMappingInput>>("/api/battle/mappings"),
    resetDefaults: (token: string) => request<BattleGiftMapping[]>("/api/battle/mappings/reset-defaults", { method: "POST", token }),
  },
  seenGifts: (token: string) => request<SeenGiftDTO[]>("/api/battle/seen-gifts", { token }),
  clearSeenGifts: (token: string) => request<void>("/api/battle/seen-gifts", { method: "DELETE", token }),
  giftCatalog: (token: string, q = "", limit = 40) =>
    request<{ total: number; gifts: CatalogGiftDTO[] }>(`/api/battle/gift-catalog?q=${encodeURIComponent(q)}&limit=${limit}`, { token }),
  refreshGiftCatalog: (token: string) => request<{ total: number }>("/api/battle/gift-catalog/refresh", { method: "POST", token }),
  testGift: (token: string, body: { mappingId?: string; giftId?: string; giftName?: string; username?: string; count?: number }) =>
    request<{ log: BattleGiftLogView | null }>("/api/battle/test-gift", { method: "POST", token, body }),
  giftLog: (token: string) => request<BattleGiftLogView[]>("/api/battle/gift-log", { token }),
  history: (token: string, limit = 20) => request<BattleMatchDTO[]>(`/api/battle/history?limit=${limit}`, { token }),
};
