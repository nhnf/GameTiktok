import type { MathBattlePublicState, MathBattleRoundTeamSummary, MathBattleTeamScore } from "@tebak-kata/shared";

const TEAM = {
  BLUE: { name: "Tim Biru", emoji: "🔵", fill: "bg-[#3b82f6]", chip: "bg-[#dbeafe] text-[#1d4ed8]", answer: "bg-[#93c5fd]", power: "text-[#1d4ed8]" },
  RED: { name: "Tim Merah", emoji: "🔴", fill: "bg-[#ef4444]", chip: "bg-[#fee2e2] text-[#b91c1c]", answer: "bg-[#fca5a5]", power: "text-[#b91c1c]" },
} as const;

/** Team score headers (players + total power). */
export function TeamScoreCards({ battle }: { battle: MathBattlePublicState }) {
  return (
    <div className="grid w-full grid-cols-2 gap-4 px-2">
      <ScoreCard team="BLUE" score={battle.blueTeamScore} banked={battle.bankedGiftPower.blue} />
      <ScoreCard team="RED" score={battle.redTeamScore} banked={battle.bankedGiftPower.red} />
    </div>
  );
}

function ScoreCard({ team, score, banked }: { team: "BLUE" | "RED"; score: MathBattleTeamScore; banked: number }) {
  const t = TEAM[team];
  return (
    <div className={`flex flex-col rounded-2xl border-4 border-ink p-4 text-white shadow-nb-md ${t.fill}`}>
      <div className="flex items-center justify-between">
        <span className="font-display text-[28px] uppercase tracking-wide">
          {t.emoji} {t.name}
        </span>
        <span className="rounded-full border-2 border-white/60 bg-black/30 px-3 py-0.5 font-mono text-[16px] font-bold">{score.playerCount} pemain</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-[14px] font-extrabold uppercase text-white/80">Total power{banked > 0 ? ` · bonus +${banked}` : ""}</span>
        <span className="font-mono text-[36px] font-black leading-none">{score.totalPower.toLocaleString("id-ID")}</span>
      </div>
    </div>
  );
}

/** The two questions; answers appear once the round is locked. */
export function QuestionCards({ battle, showAnswers }: { battle: MathBattlePublicState; showAnswers: boolean }) {
  const round = battle.round;
  if (!round) {
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-3xl border-5 border-ink bg-white p-8 text-center shadow-nb-xl">
        <div className="font-display text-[48px] uppercase tracking-wide text-ink">Menunggu match dimulai</div>
        <p className="mt-2 text-[22px] font-bold text-ink/70">
          Ketik <b className="text-[#2563eb]">BIRU</b> atau <b className="text-[#dc2626]">MERAH</b> di komentar untuk memilih tim!
        </p>
      </div>
    );
  }
  return (
    <div className="grid w-full grid-cols-2 gap-4 px-2">
      <QuestionCard team="BLUE" side={round.blue} showAnswer={showAnswers} />
      <QuestionCard team="RED" side={round.red} showAnswer={showAnswers} />
    </div>
  );
}

function QuestionCard({ team, side, showAnswer }: { team: "BLUE" | "RED"; side: MathBattleRoundTeamSummary; showAnswer: boolean }) {
  const t = TEAM[team];
  const answerKnown = showAnswer && side.question.answer >= 0;
  return (
    <div className="flex flex-col items-center rounded-3xl border-5 border-ink bg-white p-5 shadow-nb-lg">
      <span className={`rounded-full border-2 border-ink px-4 py-1 font-display text-[18px] uppercase ${t.chip}`}>Soal {t.name}</span>
      <div className="my-3 font-display text-[54px] uppercase leading-none tracking-wider text-ink">{side.question.expression}</div>
      <div className="font-display text-[32px] text-ink">=</div>
      <span
        className={`my-2 inline-flex min-w-[100px] items-center justify-center rounded-xl border-4 border-ink px-5 py-1.5 font-display text-[42px] shadow-nb-sm ${
          answerKnown ? `${t.answer} text-ink` : "bg-paper-deep text-ink/40"
        }`}
      >
        {answerKnown ? side.question.answer : "?"}
      </span>
      <div className="mt-2 flex w-full flex-col gap-1 border-t-3 border-ink/20 pt-3 text-[16px] font-bold text-ink/80">
        <div className="flex justify-between">
          <span>Jawaban benar</span>
          <span className="font-mono text-ink">✓ {side.correctCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Power jawaban</span>
          <span className={`font-mono ${t.power}`}>+{side.answerPower}</span>
        </div>
        <div className="flex justify-between">
          <span>Power gift</span>
          <span className="font-mono text-[#b45309]">+{side.giftPower}</span>
        </div>
      </div>
    </div>
  );
}
