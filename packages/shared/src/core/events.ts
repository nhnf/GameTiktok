/**
 * Server -> client realtime events (WebSocket). Each game module owns its
 * own event union; this file only adds the session-level events.
 */
import type { GameType } from "./gameType.js";
import type {
  ChatMessageView,
  GameStateHost,
  GameStatePublic,
  GiftGoalState,
  LeaderboardEntry,
  PlayerRef,
  SessionGiftRewardView,
  SessionSummary,
} from "./types.js";
import type { TebakKataServerEvent } from "../games/tebakKata/types.js";
import type { TekaKataServerEvent } from "../games/tekaKata/types.js";
import type { MatematikaServerEvent } from "../games/matematika/types.js";
import type { MathBattleServerEvent } from "../games/mathBattle/types.js";
import type { AutoBattleServerEvent } from "../games/autoBattle/types.js";

export type SessionServerEvent =
  | { type: "SESSION_STATE"; payload: GameStatePublic }
  | { type: "SESSION_STATE_HOST"; payload: GameStateHost }
  | { type: "GAME_CHANGED"; payload: { gameType: GameType } }
  | { type: "SESSION_PAUSED"; payload: Record<string, never> }
  | { type: "SESSION_RESUMED"; payload: Record<string, never> }
  | { type: "SESSION_ENDED"; payload: { summary: SessionSummary } }
  | { type: "LIVE_TIMER_EXTENDED"; payload: { addedSeconds: number; coins: number; username: string; newEndsAt: string } }
  | { type: "LIVE_TIMER_OVERTIME"; payload: { graceEndsAt: string; graceSeconds: number } }
  | { type: "GIFT_REWARD"; payload: SessionGiftRewardView }
  | { type: "GIFT_GOAL_UPDATED"; payload: GiftGoalState }
  | { type: "GIFT_GOAL_ACHIEVED"; payload: { goal: GiftGoalState; reward: "BOSS_ROUND"; message: string } }
  | { type: "STREAK_MILESTONE"; payload: { player: PlayerRef; streak: number; bonusPoints: number } }
  | { type: "CHAT_MESSAGE"; payload: ChatMessageView }
  | { type: "LEADERBOARD_UPDATED"; payload: { leaderboard: LeaderboardEntry[] } };

export type ServerEvent =
  | SessionServerEvent
  | TebakKataServerEvent
  | TekaKataServerEvent
  | MatematikaServerEvent
  | MathBattleServerEvent
  | AutoBattleServerEvent;
