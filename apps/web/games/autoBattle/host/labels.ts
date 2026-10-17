import type { BattleGiftLogView, MatchStatus } from "@tebak-kata/shared";

export const STATUS_LABEL: Record<MatchStatus, { text: string; tone: string }> = {
  WAITING: { text: "Lobby", tone: "bg-white" },
  COUNTDOWN: { text: "Countdown", tone: "bg-yellow" },
  BATTLE: { text: "Battle", tone: "bg-green" },
  SUDDEN_DEATH: { text: "Sudden Death", tone: "bg-orange" },
  PAUSED: { text: "Jeda", tone: "bg-orange" },
  ENDED: { text: "Selesai", tone: "bg-red" },
};

export const REJECT_TEXT: Record<NonNullable<BattleGiftLogView["reason"]>, string> = {
  UNMAPPED: "Gift belum di-mapping",
  DISABLED: "Mapping nonaktif",
  DUPLICATE: "Event duplikat (diabaikan)",
  INVALID: "Data gift tidak valid",
  MATCH_OVER: "Match selesai",
};

export function clock(s: number | null | undefined): string {
  if (s === null || s === undefined) return "--:--";
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
