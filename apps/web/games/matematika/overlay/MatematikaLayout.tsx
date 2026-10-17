"use client";

import { ChampionsBottomBar } from "@/components/overlay/widgets/ChampionsBottomBar";
import { GuessHeat } from "@/components/overlay/widgets/GuessHeat";
import { GuessTicker } from "@/components/overlay/widgets/GuessTicker";
import { HowToPlay, type HowToStep } from "@/components/overlay/widgets/HowToPlay";
import { LeaderboardMini } from "@/components/overlay/widgets/LeaderboardMini";
import { OverlayHeader } from "@/components/overlay/widgets/OverlayHeader";
import { WaitingCard } from "@/components/overlay/widgets/StatusScreens";
import type { OverlayGameProps } from "../../overlayTypes";
import { MatematikaStage } from "./MatematikaStage";

const HOW_TO: HowToStep[] = [
  { icon: "🔢", title: "Lihat soalnya", body: "Hitung soal yang muncul di layar.", tone: "bg-blue" },
  { icon: "💬", title: "Ketik angkanya", body: "Tulis hanya angka jawaban di komentar.", tone: "bg-yellow" },
  { icon: "⚡", title: "Makin cepat makin besar", body: "Penjawab benar tercepat dapat poin terbanyak!", tone: "bg-green" },
];

/** 1080×1920 Matematika stage: question + timers, then chat heat/ticker and the Top 10. */
export function MatematikaLayout({ state, chatLog, options }: OverlayGameProps) {
  const live = state?.status === "ACTIVE" || state?.status === "PAUSED";
  const question = live ? (state?.mathQuestion ?? null) : null;

  return (
    <>
      <div className="absolute inset-x-0 top-[60px] z-10 flex flex-col items-center gap-2 px-8">
        <OverlayHeader activeGame="MATEMATIKA" reducedMotion={options.reducedMotion} />
      </div>

      <div className="absolute inset-x-[72px] top-[160px] flex flex-col items-center gap-6">
        {question ? (
          <MatematikaStage
            question={question}
            options={options}
            timer={live ? state?.timer : null}
            status={state?.status}
            giftGoal={state?.giftGoal}
          />
        ) : options.howTo ? (
          <HowToPlay reducedMotion={options.reducedMotion} steps={HOW_TO} footer="Siapkan hitunganmu di komentar!" />
        ) : (
          <div className="pt-20">
            <WaitingCard title="Matematika segera dimulai" subtitle="Siapkan hitunganmu di komentar!" />
          </div>
        )}

        {state && question && (
          <div className="flex w-full items-start justify-between gap-5">
            {/* Left Column: Heat + Chat Ticker */}
            <div className="flex w-[430px] flex-col gap-3">
              <GuessHeat chatLog={chatLog} />
              {options.ticker && <GuessTicker chatLog={chatLog} reducedMotion={options.reducedMotion} maxItems={12} />}
            </div>

            {/* Right Column: Soal Selesai + Top Leaderboard + Juara Bertahan */}
            <div className="flex w-[480px] flex-col gap-3">
              <div className="flex -rotate-1 items-center justify-between rounded-nb border-4 border-ink bg-green px-4 py-2 shadow-nb-sm">
                <span className="text-[18px] font-bold uppercase text-ink">Soal selesai</span>
                <span className="font-mono text-[40px] font-black leading-none text-ink">{state.progress.mathQuestionsCompleted ?? 0}</span>
              </div>
              <LeaderboardMini entries={state.leaderboard} reducedMotion={options.reducedMotion} maxEntries={10} />
              <ChampionsBottomBar champions={state.champions} reducedMotion={options.reducedMotion} maxEntries={5} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
