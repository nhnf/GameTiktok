import type { MathBattlePublicState } from "@tebak-kata/shared";

/**
 * Victory / Match Summary Overlay.
 */
export function VictoryModal({ summary }: { summary: NonNullable<MathBattlePublicState["summary"]> }) {
  const isBlueWin = summary.winner === "BLUE";
  const isRedWin = summary.winner === "RED";
  const isDraw = summary.winner === "DRAW";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm animate-pop-in">
      <div className="flex w-full max-w-[800px] flex-col items-center rounded-3xl border-6 border-ink bg-white p-8 text-center shadow-nb-2xl">
        <div className="text-[64px] leading-none">🏆</div>
        <div className="mt-2 font-display text-[48px] font-black uppercase text-ink">
          {isDraw
            ? "HASIL PERTANDINGAN: IMBANG!"
            : isBlueWin
              ? "TIM BIRU MENANG!"
              : "TIM MERAH MENANG!"}
        </div>

        <div className="mt-1 font-ui text-[20px] font-bold text-ink/70">
          {summary.winningReason === "WIN_LINE"
            ? "Menang Telak Melewati Garis Kemenangan!"
            : summary.winningReason === "FULL_ROUNDS"
              ? "Menang Berdasarkan Posisi Akhir Tali!"
              : "Pertandingan Diselesaikan oleh Host"}
        </div>

        {/* Match Stats Grid */}
        <div className="my-6 grid w-full grid-cols-2 gap-4">
          <div className="flex flex-col rounded-2xl border-4 border-ink bg-[#dbeafe] p-4 text-[#1d4ed8]">
            <span className="font-display text-[24px] font-black uppercase">TIM BIRU</span>
            <span className="font-mono text-[36px] font-black">{summary.blueScore.totalPower.toLocaleString()} Power</span>
            <span className="text-[15px] font-bold text-ink/70">
              Answer: {summary.blueScore.answerPower} | Gift: {summary.blueScore.giftPower}
            </span>
          </div>

          <div className="flex flex-col rounded-2xl border-4 border-ink bg-[#fee2e2] p-4 text-[#b91c1c]">
            <span className="font-display text-[24px] font-black uppercase">TIM MERAH</span>
            <span className="font-mono text-[36px] font-black">{summary.redScore.totalPower.toLocaleString()} Power</span>
            <span className="text-[15px] font-bold text-ink/70">
              Answer: {summary.redScore.answerPower} | Gift: {summary.redScore.giftPower}
            </span>
          </div>
        </div>

        <div className="font-display text-[22px] font-black uppercase text-ink">
          Ronde Dimainkan: {summary.completedRounds} / {summary.totalRounds} • Posisi Akhir: {summary.finalRopePosition}
        </div>
      </div>
    </div>
  );
}
