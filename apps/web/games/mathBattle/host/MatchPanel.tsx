"use client";

import type { MathBattleHostState, MathBattleRoundTeamSummary } from "@tebak-kata/shared";
import { useSecondsUntil } from "@/lib/useLiveCountdown";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { MATCH_STATUS_LABEL, TEAM_STYLE } from "../labels";

/** Host monitor: both questions WITH answers, round power, rope position and timer. */
export function MatchPanel({ battle }: { battle: MathBattleHostState | null }) {
  const round = battle?.round ?? null;
  const status = battle?.status ?? "LOBBY";
  const timeLeft = useSecondsUntil(status === "QUESTION_ACTIVE" ? round?.endsAt : null, 200);

  if (!battle) {
    return (
      <Card tone="paper">
        <CardTitle>Tarik Tambang — monitor</CardTitle>
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
          <span className="text-3xl">✊</span>
          <p className="text-sm font-bold uppercase text-muted">Belum ada pertandingan.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card tone="paper">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
        <div className="flex items-center gap-2">
          <Badge tone="yellow">{round ? `Ronde ${round.roundNumber}/${round.totalRounds}` : `Match #${battle.matchNumber || 1}`}</Badge>
          <Badge tone="blue">Tali: {battle.ropePosition}</Badge>
        </div>
        <span
          className={`rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold uppercase ${
            status === "QUESTION_ACTIVE" ? "animate-pulse bg-green" : status === "VICTORY" || status === "RESULT" ? "bg-purple" : "bg-white"
          }`}
        >
          {MATCH_STATUS_LABEL[status]}
          {status === "QUESTION_ACTIVE" ? ` · ${timeLeft}s` : ""}
        </span>
      </div>

      {round ? (
        <div className="grid grid-cols-2 gap-3">
          <TeamQuestion team="BLUE" side={round.blue} />
          <TeamQuestion team="RED" side={round.red} />
        </div>
      ) : (
        <p className="py-4 text-center text-sm font-bold text-muted">Ronde pertama dimulai setelah hitung mundur.</p>
      )}

      {(battle.bankedGiftPower.blue > 0 || battle.bankedGiftPower.red > 0) && (
        <p className="mt-3 rounded-nb-sm border-2 border-ink bg-yellow px-2 py-1 text-xs font-bold">
          Power gift tersimpan untuk ronde berikutnya: 🔵 +{battle.bankedGiftPower.blue} · 🔴 +{battle.bankedGiftPower.red}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
        {(["BLUE", "RED"] as const).map((team) => {
          const score = team === "BLUE" ? battle.blueTeamScore : battle.redTeamScore;
          return (
            <div key={team} className={`rounded-nb-sm border-2 border-ink px-2 py-1.5 ${TEAM_STYLE[team].soft}`}>
              <div className={TEAM_STYLE[team].text}>
                {TEAM_STYLE[team].emoji} {TEAM_STYLE[team].name} · {score.playerCount} pemain
              </div>
              <div className="font-mono text-ink">
                Power {score.totalPower} · Menang {score.roundsWon} ronde
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TeamQuestion({ team, side }: { team: "BLUE" | "RED"; side: MathBattleRoundTeamSummary }) {
  const style = TEAM_STYLE[team];
  return (
    <div className={`flex flex-col rounded-nb-sm border-2 border-ink p-3 shadow-nb-sm ${style.soft}`}>
      <span className={`text-xs font-black uppercase ${style.text}`}>
        {style.emoji} Soal {style.name}
      </span>
      <div className="my-1 font-display text-2xl text-ink">
        {side.question.expression} = <span className="underline">{side.question.answer}</span>
      </div>
      <div className="text-xs font-bold text-ink/70">
        Jawab: <b className={style.text}>+{side.answerPower}</b> ({side.correctCount} benar) · Gift: <b className="text-[#b45309]">+{side.giftPower}</b>
      </div>
    </div>
  );
}
