import type { ComponentType, ReactNode } from "react";
import type { BattleSnapshot, ChatMessageView, GameStatePublic, ServerEvent } from "@tebak-kata/shared";
import type { SfxName } from "@/lib/sound";
import type { OverlayOptions } from "@/components/overlay/overlayOptions";

export type OverlayEvent = ServerEvent & { seq: number };

export interface OverlayGameProps {
  state: GameStatePublic | null;
  chatLog: ChatMessageView[];
  options: OverlayOptions;
  lastEvent: OverlayEvent | null;
  battleFrame: BattleSnapshot | null;
  subscribeBattle: (listener: (frame: BattleSnapshot) => void) => () => void;
}

/** A celebration/notice shown over the stage for a moment. */
export interface BannerSpec {
  durationMs: number;
  sound?: SfxName;
  /** Darken the stage behind the banner. */
  dim?: boolean;
  confetti?: boolean;
  /** Wait for the current banner to finish instead of replacing it. */
  queue?: boolean;
  /** "center": rendered in the middle band; "free": the banner positions itself. */
  placement: "center" | "free";
  render(motion: boolean): ReactNode;
}

/** What a game module contributes to the OBS overlay. */
export interface OverlayGameModule {
  Layout: ComponentType<OverlayGameProps>;
  /** The layout draws its own pause screen (skip the shared one). */
  ownPauseScreen?: boolean;
  /** Maps a realtime event to a banner (null = no banner). */
  toBanner?(event: ServerEvent, state: GameStatePublic | null): BannerSpec | null;
}
