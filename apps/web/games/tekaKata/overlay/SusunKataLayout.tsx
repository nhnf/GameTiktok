"use client";

import { CategoryBadge, DifficultyBadge } from "@/components/ui/Badge";
import { ChampionsBottomBar } from "@/components/overlay/widgets/ChampionsBottomBar";
import { CommentCTA } from "@/components/overlay/widgets/CommentCTA";
import { GuessHeat } from "@/components/overlay/widgets/GuessHeat";
import { GuessTicker } from "@/components/overlay/widgets/GuessTicker";
import { HowToPlay, type HowToStep } from "@/components/overlay/widgets/HowToPlay";
import { LeaderboardMini } from "@/components/overlay/widgets/LeaderboardMini";
import { LiveSessionTimerWidget } from "@/components/overlay/widgets/LiveSessionTimerWidget";
import { OverlayHeader } from "@/components/overlay/widgets/OverlayHeader";
import { BossRibbon, WaitingCard } from "@/components/overlay/widgets/StatusScreens";
import type { OverlayGameProps } from "../../overlayTypes";
import { TekaKataGrid } from "./TekaKataGrid";

const HOW_TO: HowToStep[] = [
  { icon: "🔠", title: "Lihat hurufnya", body: "Susun kata dari huruf yang tersedia.", tone: "bg-blue" },
  { icon: "💬", title: "Ketik di komentar", body: "Satu kata per komentar, tanpa spasi.", tone: "bg-yellow" },
  { icon: "🏆", title: "Paling cepat menang", body: "Penemu pertama dapat poin — kata panjang poinnya besar!", tone: "bg-green" },
];

/** 1080×1920 Susun Kata stage: crossword grid, letter pool, chat heat/ticker and leaderboard. */
export function SusunKataLayout({ state, chatLog, options }: OverlayGameProps) {
  const live = state?.status === "ACTIVE" || state?.status === "PAUSED";
  const puzzle = live ? (state?.tekaKataPuzzle ?? null) : null;

  return (
    <>
      <div className="absolute inset-x-[72px] top-[70px] z-10">
        <OverlayHeader activeGame="TEKA_KATA" reducedMotion={options.reducedMotion} />
      </div>
      {state?.timer && live && (
        <div className="absolute inset-x-[72px] top-[190px] z-10">
          <LiveSessionTimerWidget timer={state.timer} status={state.status} reducedMotion={options.reducedMotion} />
        </div>
      )}

      <div className="absolute inset-x-[72px] top-[280px] flex flex-col items-center">
        {puzzle ? (
          <div className="flex w-full flex-col items-center gap-4">
            {puzzle.isBoss && <BossRibbon text="Boss puzzle · poin ganda" reducedMotion={options.reducedMotion} size="md" />}
            <div className="flex w-full items-center justify-between gap-3 px-1">
              <div className="-rotate-1">
                <CategoryBadge name={puzzle.category.name} emoji="🧩" size="md" />
              </div>
              <div className="rounded-full border-4 border-ink bg-yellow px-6 py-2 font-mono text-[28px] font-black uppercase text-ink shadow-nb-sm">
                {puzzle.foundWords} / {puzzle.totalWords} kata
              </div>
              <div className="rotate-1">
                <DifficultyBadge difficulty={puzzle.difficulty} size="md" />
              </div>
            </div>

            <TekaKataGrid gridRows={puzzle.gridRows} gridColumns={puzzle.gridColumns} gridCells={puzzle.gridCells} reducedMotion={options.reducedMotion} />

            <div className="flex flex-col items-center gap-1.5">
              <div className="rounded-full border-2 border-ink bg-white px-4 py-0.5 font-display text-xs uppercase tracking-wider text-ink shadow-nb-sm">Huruf tersedia</div>
              <div className="flex max-w-[900px] flex-wrap items-center justify-center gap-2">
                {puzzle.letters.map((letter, idx) => (
                  <span
                    key={`${letter}-${idx}`}
                    className="flex h-14 w-14 items-center justify-center rounded-nb border-3 border-ink bg-white font-display text-[30px] uppercase text-ink shadow-nb-sm"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
            <CommentCTA reducedMotion={options.reducedMotion} gameType="TEKA_KATA" />
          </div>
        ) : options.howTo ? (
          <HowToPlay reducedMotion={options.reducedMotion} steps={HOW_TO} footer="Puzzle segera dimulai!" />
        ) : (
          <div className="pt-20">
            <WaitingCard title="Susun Kata segera dimulai" subtitle="Cari kata dari huruf yang tersedia!" />
          </div>
        )}
      </div>

      {state && puzzle && (
        <>
          <div className="absolute inset-x-[72px] top-[1210px] flex items-start justify-between gap-5">
            <div className="flex w-[430px] flex-col gap-3">
              <GuessHeat chatLog={chatLog} />
              {options.ticker && <GuessTicker chatLog={chatLog} reducedMotion={options.reducedMotion} maxItems={5} />}
            </div>
            <div className="flex w-[480px] flex-col gap-3">
              <div className="flex -rotate-1 items-center justify-between rounded-nb border-4 border-ink bg-green px-4 py-2 shadow-nb-sm">
                <span className="text-[16px] font-bold uppercase text-ink">Puzzle selesai</span>
                <span className="font-mono text-[36px] font-black leading-none text-ink">{state.progress.tekaKataPuzzlesCompleted ?? 0}</span>
              </div>
              <LeaderboardMini entries={state.leaderboard} reducedMotion={options.reducedMotion} maxEntries={5} />
            </div>
          </div>

          <div className="absolute inset-x-[72px] bottom-[150px]">
            <ChampionsBottomBar champions={state.champions} reducedMotion={options.reducedMotion} />
          </div>
        </>
      )}
    </>
  );
}
