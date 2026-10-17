import { GAME_INFO, type SessionSummary } from "@tebak-kata/shared";

/** Recap of the last LIVE session (shown on the start card after a session ends). */
export function SessionSummaryBlock({ summary }: { summary: SessionSummary }) {
  const game = summary.activeGame;
  const rows: Array<[string, number]> = [
    ["Pemain", summary.totalPlayers],
    ["Komentar", summary.totalComments],
    ["Gift", summary.totalGifts ?? 0],
  ];
  if (game === "TEKA_KATA") {
    rows.push(["Puzzle selesai", summary.tekaKataPuzzlesCompleted ?? 0], ["Kata ditemukan", summary.tekaKataWordsFound ?? 0]);
  } else if (game === "MATEMATIKA") {
    rows.push(["Soal selesai", summary.mathQuestionsCompleted ?? 0], ["Jawaban masuk", summary.mathAnswersCount ?? 0]);
  } else if (game === "MATEMATIKA_BATTLE") {
    rows.push(["Match selesai", summary.mathBattleMatchesCompleted ?? 0], ["Ronde", summary.mathBattleRoundsCompleted ?? 0]);
  } else if (game === "TEBAK_KATA" || !game) {
    rows.push(["Kata terjawab", summary.wordsSolved], ["Boss kalah", summary.bossesDefeated]);
  }

  return (
    <div className="mb-4 rounded-nb-sm border-3 border-ink bg-paper p-3">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
        Ringkasan sesi terakhir{game ? ` · ${GAME_INFO[game].emoji} ${GAME_INFO[game].label}` : ""}
      </div>
      {summary.topPlayer && (
        <div className="mb-3 flex items-center gap-2 rounded-nb-sm border-2 border-ink bg-yellow px-3 py-2 text-sm font-bold">
          <span aria-hidden>🏆</span>
          <span className="min-w-0 flex-1 truncate">@{summary.topPlayer.username}</span>
          <span className="font-mono">{summary.topPlayer.points} pts</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-nb-sm border-2 border-ink bg-white px-2 py-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
            <div className="font-mono text-lg font-bold leading-tight">{value.toLocaleString("id-ID")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
