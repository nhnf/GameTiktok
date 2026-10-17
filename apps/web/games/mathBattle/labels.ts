import type { MathBattleMatchStatus, MathBattleTeamId } from "@tebak-kata/shared";

export const MATCH_STATUS_LABEL: Record<MathBattleMatchStatus, string> = {
  LOBBY: "Lobby",
  STARTING: "Bersiap",
  QUESTION_ACTIVE: "Menjawab",
  ANSWER_LOCKED: "Dikunci",
  CALCULATING: "Menghitung",
  ROPE_ANIMATION: "Tarik tali",
  ROUND_RESULT: "Hasil ronde",
  NEXT_ROUND: "Ronde berikutnya",
  VICTORY: "Pemenang",
  RESULT: "Hasil match",
  PAUSED: "Dijeda",
};

export const TEAM_STYLE: Record<MathBattleTeamId, { name: string; emoji: string; fill: string; soft: string; text: string }> = {
  BLUE: { name: "Tim Biru", emoji: "🔵", fill: "bg-[#3b82f6]", soft: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
  RED: { name: "Tim Merah", emoji: "🔴", fill: "bg-[#ef4444]", soft: "bg-[#fee2e2]", text: "text-[#b91c1c]" },
};

export const RUNNING_STATUSES: readonly MathBattleMatchStatus[] = [
  "STARTING",
  "QUESTION_ACTIVE",
  "ANSWER_LOCKED",
  "CALCULATING",
  "ROPE_ANIMATION",
  "ROUND_RESULT",
  "NEXT_ROUND",
  "PAUSED",
];
