/**
 * Session-level domain types shared between apps/server and apps/web.
 * Game-specific shapes live in `games/<game>/types.ts`; this file only
 * composes them into the session state every client receives.
 */
import type { GameType } from "./gameType.js";
import type { PuzzleHostState, PuzzlePublicState, ScoringConfig } from "../games/tebakKata/types.js";
import type {
  TekaKataConfig,
  TekaKataPuzzleHostState,
  TekaKataPuzzlePublicState,
} from "../games/tekaKata/types.js";
import type { MathConfig, MathQuestionHostState, MathQuestionPublicState } from "../games/matematika/types.js";
import type { BattleHostState, BattlePublicState } from "../games/autoBattle/types.js";
import type { MathBattleConfig, MathBattleHostState, MathBattlePublicState } from "../games/mathBattle/types.js";

export type SessionStatus = "CREATED" | "ACTIVE" | "PAUSED" | "ENDED";

export interface PlayerRef {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface LeaderboardEntry extends PlayerRef {
  points: number;
  wins: number;
  streak?: number;
}

export interface LiveSessionTimer {
  enabled: boolean;
  initialMinutes: number;
  /** Seconds one gift coin adds to the countdown. */
  secondsPerCoin: number;
  endsAt: string | null;
  secondsRemaining: number;
  secondsAddedByGifts: number;
  isOvertimeGrace: boolean;
  graceEndsAt: string | null;
  graceSecondsRemaining: number;
}

export interface LiveTimerSettings {
  enabled: boolean;
  initialMinutes?: number;
  secondsPerCoin?: number;
}

export interface SessionSettings {
  /** Tebak Kata points per difficulty (kept top-level for backwards compatibility). */
  scoring: ScoringConfig;
  bossEveryNWords: number;
  antiRepeatWindow: number;
  /** Runs the configured live source (TikTok LIVE or the simulator) while a session is live. */
  mockTikTokEnabled: boolean;
  activeGame?: GameType;
  tekaKata?: Partial<TekaKataConfig>;
  matematika?: Partial<MathConfig>;
  mathBattle?: Partial<MathBattleConfig>;
  liveTimer?: LiveTimerSettings;
  giftGoalCoins?: number;
}

export interface SessionProgress {
  wordsFound: number;
  wordsSkipped: number;
  bossesDefeated: number;
  wordsUntilNextBoss: number;
  tekaKataPuzzlesCompleted?: number;
  tekaKataWordsFound?: number;
  mathQuestionsCompleted?: number;
  mathAnswersCount?: number;
  mathBattleMatchesCompleted?: number;
  mathBattleRoundsCompleted?: number;
}

export interface GiftGoalState {
  currentCoins: number;
  targetCoins: number;
  tier: number;
  lastGifter?: string | null;
}

export interface ChampionEntry {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  championCount: number; // Berapa kali juara 1
  totalPoints?: number;
  lastSessionDate?: string;
}

export interface GameStatePublic {
  sessionId: string | null;
  status: SessionStatus;
  activeGame: GameType;
  puzzle: PuzzlePublicState | null;
  tekaKataPuzzle: TekaKataPuzzlePublicState | null;
  mathQuestion: MathQuestionPublicState | null;
  battle: BattlePublicState | null;
  mathBattle: MathBattlePublicState | null;
  leaderboard: LeaderboardEntry[];
  progress: SessionProgress;
  timer: LiveSessionTimer | null;
  giftGoal?: GiftGoalState | null;
  champions?: ChampionEntry[];
  settings: Pick<SessionSettings, "scoring" | "bossEveryNWords"> & {
    activeGame?: GameType;
    tekaKata?: Partial<TekaKataConfig>;
    matematika?: Partial<MathConfig>;
    mathBattle?: Partial<MathBattleConfig>;
    liveTimer?: LiveTimerSettings;
  };
  /** Populated once a session ends; cleared when the next session starts. */
  lastSessionSummary: SessionSummary | null;
}

export interface EngagementStats {
  totalPlayers: number;
  totalComments: number;
  totalValidGuesses: number;
  totalGifts: number;
}

export interface GameStateHost
  extends Omit<GameStatePublic, "puzzle" | "tekaKataPuzzle" | "mathQuestion" | "battle" | "mathBattle" | "settings"> {
  puzzle: PuzzleHostState | null;
  battle: BattleHostState | null;
  mathBattle: MathBattleHostState | null;
  tekaKataPuzzle: TekaKataPuzzleHostState | null;
  mathQuestion: MathQuestionHostState | null;
  settings: SessionSettings;
  stats: EngagementStats;
  /** Where comments/gifts come from and whether it is connected (host only). */
  liveSource: { kind: "mock" | "tiktok"; running: boolean; status: string } | null;
}

/** Verdict attached to a comment by the game that evaluated it. */
export type ChatVerdict = "CORRECT" | "INVALID" | "ALREADY_FOUND" | "JOINED";

export interface ChatMessageView {
  id: string;
  username: string;
  avatarUrl?: string;
  rawComment: string;
  /** Tebak Kata only: how many leading letters matched the target word. */
  matchedLength: number;
  isFullMatch: boolean;
  isWinner: boolean;
  gameType?: GameType;
  status?: ChatVerdict;
  points?: number;
  rank?: number;
  streak?: number;
  /** Tarik Tambang: the team the commenter plays for. */
  team?: "BLUE" | "RED";
  createdAt: string;
}

export interface GiftEventView {
  id: string;
  username: string;
  giftName: string;
  effect: "REVEAL_NEXT_LETTER";
  createdAt: string;
}

export interface SessionGiftRewardView {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  giftId?: string | null;
  giftName?: string | null;
  coins: number;
  count: number;
  pointsAwarded: number;
  addedSeconds: number;
  isScoreReset?: boolean;
  deductedOpponentPoints?: number;
  oldRank?: number | null;
  newRank?: number | null;
  rankRose?: boolean;
  createdAt: string;
}

export interface SessionSummary {
  sessionId: string;
  activeGame?: GameType;
  totalPlayers: number;
  totalComments: number;
  totalValidGuesses: number;
  totalGifts?: number;
  wordsSolved: number;
  wordsSkipped: number;
  bossesDefeated: number;
  tekaKataPuzzlesCompleted?: number;
  tekaKataWordsFound?: number;
  mathQuestionsCompleted?: number;
  mathAnswersCount?: number;
  mathBattleMatchesCompleted?: number;
  mathBattleRoundsCompleted?: number;
  topPlayer: LeaderboardEntry | null;
  leaderboard?: LeaderboardEntry[];
}

/** Client -> server: raw comment ingestion (from TikTok adapter or mock adapter). */
export interface IncomingComment {
  platformUserId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  rawComment: string;
}

export interface IncomingGift {
  platformUserId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  giftId: string;
  /** Unique per platform message (TikTok `common.msgId`) — used for de-duplication. */
  eventId?: string;
  giftName?: string;
  diamondCount?: number;
  /** How many gifts this event adds (combo delta). Defaults to 1; 0 = combo-end marker. */
  count?: number;
  /**
   * False while a TikTok combo streak is still running. Games that want one
   * effect per combo (word reveals) act only when this is true; gift-power
   * games (Auto Battle, Tarik Tambang) act on every delta. Defaults to true.
   */
  comboEnded?: boolean;
}
