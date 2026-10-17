import type { ComponentType } from "react";
import type { BattleGiftLogView, BattleSnapshot, ChatMessageView, GameStateHost } from "@tebak-kata/shared";

export interface HostGameProps {
  token: string;
  hostState: GameStateHost;
  chatLog: ChatMessageView[];
  battleFrame: BattleSnapshot | null;
  battleGiftLog: BattleGiftLogView[];
}

export interface StatItem {
  label: string;
  value: number;
  tone: string;
}

/** What a game module contributes to the Host Dashboard. */
export interface HostGameModule {
  /** Left column: the game's monitor + controls. */
  Main: ComponentType<HostGameProps>;
  /** Middle column (defaults to the live chat). */
  Middle?: ComponentType<HostGameProps>;
  /** Right column (defaults to the session leaderboard). */
  Side?: ComponentType<HostGameProps>;
  /** Game-specific counters for the bottom stats bar. */
  stats(hostState: GameStateHost): StatItem[];
}
