"use client";

import type { SessionProgress } from "@tebak-kata/shared";
import { CategoryBadge, DifficultyBadge } from "@/components/ui/Badge";
import { ChampionsBottomBar } from "@/components/overlay/widgets/ChampionsBottomBar";
import { CommentCTA } from "@/components/overlay/widgets/CommentCTA";
import { GuessHeat } from "@/components/overlay/widgets/GuessHeat";
import { GuessTicker } from "@/components/overlay/widgets/GuessTicker";
import { HowToPlay } from "@/components/overlay/widgets/HowToPlay";
import { LeaderboardMini } from "@/components/overlay/widgets/LeaderboardMini";
import { LiveSessionTimerWidget } from "@/components/overlay/widgets/LiveSessionTimerWidget";
import { OverlayHeader } from "@/components/overlay/widgets/OverlayHeader";
import { BossRibbon, WaitingCard } from "@/components/overlay/widgets/StatusScreens";
import type { OverlayGameProps } from "../../overlayTypes";
import { WordDisplay } from "./WordDisplay";

/** 1080×1920 Tebak Kata stage: header + timer, word tiles, then chat heat/ticker and the Top 10. */
export function TebakKataLayout({ state, chatLog, options, lastEvent }: OverlayGameProps) {
  const live = state?.status === "ACTIVE" || state?.status === "PAUSED";
  const puzzle = live ? (state?.puzzle ?? null) : null;
  const pulsePosition = lastEvent?.type === "LETTER_REVEALED" ? lastEvent.payload.position : null;

  return (
    <>
      <div className="absolute inset-x-[72px] top-[70px] z-10 flex items-center justify-between">
        <OverlayHeader activeGame="TEBAK_KATA" reducedMotion={options.reducedMotion} />
      </div>
      {state?.timer && live && (
        <div className="absolute inset-x-[72px] top-[190px] z-10">
          <LiveSessionTimerWidget timer={state.timer} status={state.status} reducedMotion={options.reducedMotion} />
        </div>
      )}

      <div className="absolute inset-x-[72px] top-[285px] flex flex-col items-center">
        {puzzle ? (
          <div className="flex w-full flex-col items-center gap-6">
            {puzzle.isBoss && <BossRibbon text={`Boss round · +${puzzle.rewardPoints} poin`} reducedMotion={options.reducedMotion} />}
            <div className="flex max-w-full items-center gap-5">
              <div className="min-w-0 -rotate-2">
                <CategoryBadge name={puzzle.category.name} emoji={puzzle.category.emoji} size="lg" />
              </div>
              <div className="shrink-0 rotate-2">
                <DifficultyBadge difficulty={puzzle.difficulty} size="lg" />
              </div>
            </div>
            <WordDisplay
              display={puzzle.display}
              context="overlay"
              pulsePosition={pulsePosition}
              pulseSeq={lastEvent?.seq}
              solved={puzzle.status === "SOLVED"}
              reducedMotion={options.reducedMotion}
              entrance
            />
            <CommentCTA reducedMotion={options.reducedMotion} gameType="TEBAK_KATA" />
          </div>
        ) : options.howTo ? (
          <HowToPlay reducedMotion={options.reducedMotion} />
        ) : (
          <div className="pt-20">
            <WaitingCard title="Game segera dimulai" subtitle="Siapkan tebakanmu di komentar!" />
          </div>
        )}
      </div>

      {state && puzzle && (
        <>
          <div className="absolute inset-x-[72px] top-[790px] flex items-start justify-between gap-5">
            <div className="flex w-[430px] flex-col gap-3">
              <GuessHeat chatLog={chatLog} />
              {options.ticker && <GuessTicker chatLog={chatLog} reducedMotion={options.reducedMotion} maxItems={8} />}
            </div>
            <div className="flex w-[480px] flex-col gap-3">
              <ProgressStickers progress={state.progress} />
              <LeaderboardMini entries={state.leaderboard} reducedMotion={options.reducedMotion} maxEntries={8} />
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

/** Words found + "boss in N words" stickers. */
function ProgressStickers({ progress }: { progress: SessionProgress }) {
  const bossLabel = progress.wordsUntilNextBoss <= 0 ? "Boss berikutnya!" : `Boss ${progress.wordsUntilNextBoss} lagi`;
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex flex-1 -rotate-1 items-center justify-between rounded-nb border-4 border-ink bg-green px-4 py-2 shadow-nb-sm">
        <span className="text-[16px] font-bold uppercase leading-tight text-ink">
          Kata
          <br />
          Ditemukan
        </span>
        <span className="font-mono text-[36px] font-black leading-none text-ink">{progress.wordsFound}</span>
      </div>
      <div className="flex flex-1 rotate-1 items-center justify-center gap-2 rounded-nb border-4 border-ink bg-purple px-4 py-3 shadow-nb-sm">
        <span aria-hidden className="text-[26px] leading-none">
          👑
        </span>
        <span className="whitespace-nowrap font-display text-[22px] uppercase leading-none text-ink">{bossLabel}</span>
      </div>
    </div>
  );
}
