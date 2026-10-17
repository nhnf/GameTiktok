"use client";

import { GuessTicker } from "@/components/overlay/widgets/GuessTicker";
import { LeaderboardMini } from "@/components/overlay/widgets/LeaderboardMini";
import { OverlayHeader } from "@/components/overlay/widgets/OverlayHeader";
import { WaitingCard } from "@/components/overlay/widgets/StatusScreens";
import type { OverlayGameModule, OverlayGameProps } from "../../overlayTypes";
import { MathBattleStage } from "./MathBattleStage";

/** 1080×1920 Tarik Tambang overlay. */
export function MathBattleLayout({ state, chatLog, options }: OverlayGameProps) {
  const live = state?.status === "ACTIVE" || state?.status === "PAUSED";
  const battle = live ? (state?.mathBattle ?? null) : null;

  return (
    <>
      <div className="absolute inset-x-0 top-[60px] z-10 flex justify-center px-8">
        <OverlayHeader activeGame="MATEMATIKA_BATTLE" reducedMotion={options.reducedMotion} />
      </div>
      <div className="absolute inset-x-[40px] top-[180px] flex flex-col items-center">
        {battle ? (
          <MathBattleStage battle={battle} options={options} timer={state?.timer} status={state?.status} />
        ) : (
          <div className="pt-20">
            <WaitingCard title="Tarik Tambang LIVE" subtitle="Ketik BIRU atau MERAH untuk pilih tim!" />
          </div>
        )}
      </div>
      {state && battle && (
        <div className="absolute inset-x-[40px] top-[1500px] flex items-start justify-between gap-5">
          <div className="w-[480px]">{options.ticker && <GuessTicker chatLog={chatLog} reducedMotion={options.reducedMotion} maxItems={5} />}</div>
          <div className="w-[480px]">
            <LeaderboardMini entries={state.leaderboard} reducedMotion={options.reducedMotion} maxEntries={5} />
          </div>
        </div>
      )}
    </>
  );
}

export const mathBattleOverlay: OverlayGameModule = { Layout: MathBattleLayout };
