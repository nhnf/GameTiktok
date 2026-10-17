"use client";

import type { LiveSessionTimer, MathBattlePublicState } from "@tebak-kata/shared";
import { useSecondsUntil } from "@/lib/useLiveCountdown";
import { CommentCTA } from "@/components/overlay/widgets/CommentCTA";
import { LiveSessionTimerWidget } from "@/components/overlay/widgets/LiveSessionTimerWidget";
import type { OverlayOptions } from "@/components/overlay/overlayOptions";
import { MATCH_STATUS_LABEL } from "../labels";
import { GiftFeed, StreakNotification } from "./BattleFeed";
import { QuestionCards, TeamScoreCards } from "./TeamPanels";
import { TugOfWarRope } from "./TugOfWarRope";
import { VictoryModal } from "./VictoryModal";

const ROUND_END = new Set(["ANSWER_LOCKED", "CALCULATING", "ROPE_ANIMATION", "ROUND_RESULT", "NEXT_ROUND"]);

interface MathBattleStageProps {
  battle: MathBattlePublicState;
  options: OverlayOptions;
  timer?: LiveSessionTimer | null;
  status?: string;
}

/** Tarik Tambang stage: scores, both questions, round timer, rope, gifts, victory poster. */
export function MathBattleStage({ battle, options, timer, status }: MathBattleStageProps) {
  const round = battle.round;
  const matchStatus = battle.status;
  const seconds = useSecondsUntil(matchStatus === "QUESTION_ACTIVE" ? round?.endsAt : null, 100);
  const urgent = matchStatus === "QUESTION_ACTIVE" && seconds <= 3 && seconds > 0;
  const roundEnded = ROUND_END.has(matchStatus) || (matchStatus === "PAUSED" && battle.pausedFrom !== null && ROUND_END.has(battle.pausedFrom));

  const chipText =
    matchStatus === "QUESTION_ACTIVE"
      ? `${seconds}s`
      : matchStatus === "ROPE_ANIMATION" || matchStatus === "CALCULATING"
        ? "Menarik tali..."
        : matchStatus === "STARTING"
          ? "Bersiap..."
          : MATCH_STATUS_LABEL[matchStatus];

  return (
    <div className="flex w-full flex-col items-center gap-4 text-ink">
      <div className="flex w-full items-center justify-between gap-4 px-2">
        <div className="flex -rotate-1 items-center gap-2 rounded-2xl border-4 border-ink bg-yellow px-5 py-2 shadow-nb-sm">
          <span className="text-[28px]">💪</span>
          <span className="font-display text-[26px] uppercase tracking-wider">Match #{battle.matchNumber || 1}</span>
        </div>
        <div className="flex rotate-1 items-center gap-2 rounded-2xl border-4 border-ink bg-white px-5 py-2 shadow-nb-sm">
          <span className="font-display text-[24px] uppercase">
            {round ? `Ronde ${String(round.roundNumber).padStart(2, "0")} / ${String(round.totalRounds).padStart(2, "0")}` : "Lobby"}
          </span>
        </div>
      </div>

      {timer && (
        <div className="w-full">
          <LiveSessionTimerWidget timer={timer} status={status ?? "ACTIVE"} reducedMotion={options.reducedMotion} />
        </div>
      )}

      <TeamScoreCards battle={battle} />
      <QuestionCards battle={battle} showAnswers={roundEnded || matchStatus === "VICTORY" || matchStatus === "RESULT"} />

      {(round || matchStatus === "STARTING") && (
        <div
          className={`flex items-center gap-3 rounded-full border-4 border-ink px-8 py-2.5 shadow-nb-md transition-all ${
            urgent ? `bg-red text-white ${options.reducedMotion ? "" : "scale-110 animate-pulse"}` : roundEnded ? "bg-paper-deep" : "bg-yellow"
          }`}
        >
          <span className="text-[28px] leading-none">⏱</span>
          <span className="font-mono text-[36px] font-black uppercase leading-none">{chipText}</span>
        </div>
      )}

      <StreakNotification streak={battle.streak} />
      <TugOfWarRope ropePosition={battle.ropePosition} winLineDistance={battle.winLineDistance} delta={round?.ropeDelta ?? 0} animating={matchStatus === "ROPE_ANIMATION" && !options.reducedMotion} />
      {battle.recentGifts.length > 0 && battle.config.giftNotificationEnabled !== false && <GiftFeed gifts={battle.recentGifts} />}
      {(matchStatus === "VICTORY" || matchStatus === "RESULT") && battle.summary && <VictoryModal summary={battle.summary} />}

      <div className="w-full px-2">
        <CommentCTA gameType="MATEMATIKA_BATTLE" reducedMotion={options.reducedMotion} />
      </div>
    </div>
  );
}
