"use client";

import type { GiftGoalState, LiveSessionTimer, MathQuestionPublicState } from "@tebak-kata/shared";
import { useSecondsUntil } from "@/lib/useLiveCountdown";
import { GiftGoalBar } from "@/components/overlay/widgets/GiftGoalBar";
import { LiveSessionTimerWidget } from "@/components/overlay/widgets/LiveSessionTimerWidget";
import type { OverlayOptions } from "@/components/overlay/overlayOptions";

interface MatematikaStageProps {
  question: MathQuestionPublicState;
  options: OverlayOptions;
  timer?: LiveSessionTimer | null;
  status?: string;
  giftGoal?: GiftGoalState | null;
}

export function MatematikaStage({ question, options, timer, status, giftGoal }: MatematikaStageProps) {
  const secondsRemaining = useSecondsUntil(question.status === "ACTIVE" ? question.endsAt : null, 100);

  const isTimeUp = question.status === "TIME_UP" || question.status === "COMPLETED";
  const isUrgent = question.status === "ACTIVE" && secondsRemaining <= 3 && secondsRemaining > 0;
  const isBoss = Boolean(question.isBoss);

  return (
    <div className="flex w-full flex-col items-center gap-3.5">
      {/* Top Header Row: Mode (Left) & Question Timer (Right) */}
      <div className="flex w-full items-center justify-between gap-4 px-1">
        {/* Left: Hitung Cepat Tag or Boss Tag */}
        <div
          className={`-rotate-1 shrink-0 rounded-full border-4 border-ink px-6 py-2 shadow-nb-sm ${
            isBoss ? "bg-purple text-white animate-pulse" : "bg-blue text-ink"
          }`}
        >
          <span className="font-display text-[26px] font-black uppercase">
            {isBoss ? "👑 BOSS ROUND (3X POIN)" : "🔢 HITUNG CEPAT"}
          </span>
        </div>

        {/* Right: Question Timer Chip */}
        <div
          className={`flex shrink-0 items-center gap-2.5 rounded-full border-4 border-ink px-6 py-2 shadow-nb-sm transition-transform ${
            isUrgent
              ? "bg-red text-white scale-110 animate-pulse"
              : isTimeUp
                ? "bg-paper-deep text-muted"
                : isBoss
                  ? "bg-yellow text-ink"
                  : "bg-yellow text-ink"
          }`}
        >
          <span className="text-[26px] leading-none">⏱</span>
          <span className="font-mono text-[34px] font-black leading-none">
            {question.status === "ACTIVE"
              ? question.endsAt
                ? `${secondsRemaining}s`
                : "JEDA"
              : isTimeUp
                ? "WAKTU HABIS"
                : question.status === "SKIPPED"
                  ? "DILEWATI"
                  : `${question.durationSeconds}s`}
          </span>
        </div>
      </div>

      {/* Full-Width Live Session Countdown Banner below Hitung Cepat & Question Timer */}
      {timer && (
        <div className="w-full">
          <LiveSessionTimerWidget
            timer={timer}
            status={status ?? "ACTIVE"}
            reducedMotion={options.reducedMotion}
          />
        </div>
      )}

      {/* Gift Goal Bar for Boss Round */}
      {giftGoal && (
        <div className="w-full">
          <GiftGoalBar goal={giftGoal} reducedMotion={options.reducedMotion} />
        </div>
      )}

      {/* Main Math Expression Card */}
      <div
        className={`relative flex w-full flex-col items-center justify-center rounded-nb border-6 border-ink ${
          isBoss ? "bg-purple/10 border-purple ring-4 ring-purple shadow-nb-xl" : "bg-white shadow-nb-xl"
        } py-4 px-6 text-center`}
      >
        {isBoss && (
          <div className="mb-1.5 -rotate-1 rounded-nb-sm border-3 border-ink bg-purple px-4 py-0.5 font-display text-[18px] font-black uppercase text-white shadow-nb-sm">
            👑 SOAL SPESIAL BOSS ROUND · SEMUA POIN x3
          </div>
        )}

        {/* Arithmetic Expression Numbers */}
        <div
          className={`font-display font-black uppercase leading-none tracking-wider text-ink ${
            question.expression.length > 15 ? "text-[56px]" : "text-[76px]"
          }`}
        >
          {question.expression}
        </div>

        {/* Equal sign centered below */}
        <div className="my-1 font-display text-[38px] font-black leading-none text-ink">
          =
        </div>

        {/* Target Answer / Question Mark Box below equal sign */}
        <div>
          {question.revealedAnswer !== null ? (
            <span className="inline-flex min-w-[130px] items-center justify-center rounded-nb border-5 border-ink bg-green px-7 py-1.5 font-display text-[56px] font-black uppercase leading-none text-ink shadow-nb-md animate-pop-in">
              {question.revealedAnswer}
            </span>
          ) : (
            <span className="inline-flex min-w-[130px] items-center justify-center rounded-nb border-5 border-ink bg-paper-deep px-7 py-1.5 font-display text-[56px] font-black uppercase leading-none text-ink/30 shadow-nb-sm">
              ?
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
