import type { MatchResult } from "@tebak-kata/shared";

export const FALLBACK_TEAM = {
  A: { name: "TEAM BIRU", emblem: "👑", color: "#2F7BFF" },
  B: { name: "TEAM MERAH", emblem: "👑", color: "#FF3B3B" },
};

export const REASON_TEXT: Record<MatchResult["reason"], string> = {
  BASE_DESTROYED: "Base lawan hancur!",
  TIMER_HP: "Waktu habis — HP base lebih tinggi",
  SUDDEN_DEATH: "Menang di Sudden Death!",
  HOST: "Match diakhiri host",
};

export function formatClock(seconds: number): string {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("id-ID");
}
