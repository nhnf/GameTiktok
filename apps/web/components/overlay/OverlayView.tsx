"use client";

import type { BattleSnapshot, ChatMessageView, GameStatePublic } from "@tebak-kata/shared";
import type { ConnectionStatus } from "@/lib/useGameSocket";
import { OVERLAY_GAMES } from "@/games/overlayRegistry";
import type { OverlayEvent } from "@/games/overlayTypes";
import { EventLayer } from "./EventLayer";
import type { OverlayBackground, OverlayOptions } from "./overlayOptions";
import { OvertimeGraceScreen } from "./widgets/OvertimeGraceScreen";
import { SessionEndedPoster } from "./widgets/SessionEndedPoster";
import { ConnectionRibbon, PausedOverlay } from "./widgets/StatusScreens";
import { GiftRewardBottomBanner } from "./widgets/GiftRewardBottomBanner";

const NO_BATTLE_STREAM = () => () => {};

export interface OverlayViewProps {
  connection: ConnectionStatus;
  state: GameStatePublic | null;
  lastEvent: OverlayEvent | null;
  chatLog: ChatMessageView[];
  options: OverlayOptions;
  /** Auto Battle: throttled frame for the HUD + per-frame subscription for the canvas. */
  battleFrame?: BattleSnapshot | null;
  subscribeBattle?: (listener: (frame: BattleSnapshot) => void) => () => void;
  /** Lossless event stream for the banner layer (falls back to `lastEvent`). */
  subscribeEvents?: (listener: (event: OverlayEvent) => void) => () => void;
}

const BACKGROUND_CLASS: Record<OverlayBackground, string> = {
  paper: "bg-dots",
  yellow: "bg-dots-yellow",
  dark: "bg-dots-dark",
  transparent: "bg-transparent",
};

/**
 * 1080×1920 TikTok LIVE overlay. The active game module renders the stage;
 * this shell adds the shared layers: end-of-session poster, pause/overtime
 * screens, reconnect ribbon and the celebration banners.
 */
export function OverlayView({
  connection,
  state,
  lastEvent,
  chatLog,
  options,
  battleFrame = null,
  subscribeBattle = NO_BATTLE_STREAM,
  subscribeEvents,
}: OverlayViewProps) {
  const status = state?.status ?? "CREATED";
  const game = OVERLAY_GAMES[state?.activeGame ?? "TEBAK_KATA"];
  const summary = status === "ENDED" ? (state?.lastSessionSummary ?? null) : null;
  const overtime = status === "PAUSED" && state?.timer?.isOvertimeGrace ? state.timer : null;

  return (
    <div className={`relative h-[1920px] w-[1080px] overflow-hidden font-ui text-ink ${BACKGROUND_CLASS[options.background]}`}>
      {summary ? (
        <div className="absolute inset-x-[50px] top-[120px] flex flex-col items-center">
          <SessionEndedPoster summary={summary} leaderboard={state?.leaderboard ?? []} />
        </div>
      ) : (
        <game.Layout state={state} chatLog={chatLog} options={options} lastEvent={lastEvent} battleFrame={battleFrame} subscribeBattle={subscribeBattle} />
      )}

      {overtime ? (
        <OvertimeGraceScreen timer={overtime} leaderboard={state?.leaderboard ?? []} reducedMotion={options.reducedMotion} />
      ) : (
        status === "PAUSED" && !game.ownPauseScreen && <PausedOverlay />
      )}

      {connection !== "open" && <ConnectionRibbon />}
      <GiftRewardBottomBanner
        lastEvent={lastEvent}
        subscribe={subscribeEvents}
        soundEnabled={options.sound}
        reducedMotion={options.reducedMotion}
      />
      <EventLayer
        event={lastEvent}
        subscribe={subscribeEvents}
        state={state}
        game={game}
        soundEnabled={options.sound}
        reducedMotion={options.reducedMotion}
      />
    </div>
  );
}
