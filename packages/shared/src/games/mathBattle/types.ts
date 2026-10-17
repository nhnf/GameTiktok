import type { PlayerRef } from "../../core/types.js";

export type MathBattleTeamId = "BLUE" | "RED";

export type MathBattleDifficulty = "easy" | "normal" | "hard" | "extreme";

export type MathBattleOperator = "+" | "-";

export type MathBattleTeamAssignmentMode = "COMMENT" | "RANDOM" | "HOST";

export type MathBattleGiftTier = "SMALL" | "MEDIUM" | "LARGE" | "NEUTRAL";

export type MathBattleMatchStatus =
  | "LOBBY"
  | "STARTING"
  | "QUESTION_ACTIVE"
  | "ANSWER_LOCKED"
  | "CALCULATING"
  | "ROPE_ANIMATION"
  | "ROUND_RESULT"
  | "NEXT_ROUND"
  | "VICTORY"
  | "RESULT"
  | "PAUSED";

export type MathBattleRoundStatus =
  | "WAITING"
  | "ACTIVE"
  | "LOCKED"
  | "CALCULATING"
  | "RESULT";

export interface MathBattleGiftMapping {
  id: string;
  giftId: string | null;
  giftName: string;
  team: MathBattleTeamId | "NEUTRAL";
  tier: MathBattleGiftTier;
  power: number;
  enabled: boolean;
  imageUrl?: string | null;
  diamondCount?: number | null;
}

export interface MathBattleConfig {
  totalRounds: number; // 5, 10, 15, 20 (default 10)
  roundDurationSeconds: number; // 5, 10, 15, 20 (default 10)
  difficulty: MathBattleDifficulty; // default "normal"
  operators: MathBattleOperator[]; // default ["+", "-"]
  assignmentMode: MathBattleTeamAssignmentMode; // default "COMMENT"
  minRopeMovement: number; // default 2
  maxRopeMovement: number; // default 20
  winLineDistance: number; // default 100
  streakEnabled: boolean; // default true
  powerDisplayEnabled: boolean; // default true
  playerCountEnabled: boolean; // default true
  giftNotificationEnabled: boolean; // default true
  soundEnabled: boolean; // default true
  giftSmallPower: number; // default 5
  giftMediumPower: number; // default 15
  giftLargePower: number; // default 40
}

export interface MathBattleQuestion {
  id: string;
  operandA: number;
  operandB: number;
  operator: MathBattleOperator;
  expression: string; // e.g. "37 + 28"
  answer: number;
  difficulty: MathBattleDifficulty;
}

export interface MathBattleRoundPlayerAnswer {
  playerId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  team: MathBattleTeamId;
  submittedAnswer: number;
  isCorrect: boolean;
  answeredAtSeconds: number;
  powerAwarded: number;
}

export interface MathBattleRoundTeamSummary {
  question: MathBattleQuestion;
  answerPower: number;
  giftPower: number;
  totalPower: number;
  correctCount: number;
  playerAnswers: MathBattleRoundPlayerAnswer[];
}

export interface MathBattleRoundState {
  roundNumber: number;
  totalRounds: number;
  status: MathBattleRoundStatus;
  startedAt: string | null;
  endsAt: string | null;
  durationSeconds: number;
  blue: MathBattleRoundTeamSummary;
  red: MathBattleRoundTeamSummary;
  ropePositionBefore: number;
  ropePositionAfter: number;
  ropeDelta: number;
  roundWinner: MathBattleTeamId | "DRAW" | null;
}

export interface MathBattlePlayer {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  team: MathBattleTeamId;
  correctAnswers: number;
  wrongAnswers: number;
  totalAnswerPower: number;
  totalGiftPower: number;
  matchPower: number;
}

export interface MathBattleGiftFeedItem {
  id: string;
  timestamp: number;
  viewerId: string;
  username: string;
  avatarUrl?: string;
  giftId: string;
  giftName: string;
  team: MathBattleTeamId | "NEUTRAL";
  tier: MathBattleGiftTier;
  power: number;
  count: number;
}

export interface MathBattleStreakState {
  team: MathBattleTeamId | null;
  count: number;
  brokenTeam: MathBattleTeamId | null;
  brokenCount: number;
}

export interface MathBattleTeamScore {
  totalPower: number;
  answerPower: number;
  giftPower: number;
  roundsWon: number;
  playerCount: number;
}

export interface MathBattleMatchSummary {
  matchId: string;
  winner: MathBattleTeamId | "DRAW";
  winningReason: "WIN_LINE" | "FULL_ROUNDS" | "HOST";
  totalRounds: number;
  completedRounds: number;
  finalRopePosition: number;
  blueScore: MathBattleTeamScore;
  redScore: MathBattleTeamScore;
  topPlayers: MathBattlePlayer[];
}

export interface MathBattlePublicState {
  matchId: string;
  matchNumber: number;
  status: MathBattleMatchStatus;
  /** Status the match was in when it was paused (null when not paused). */
  pausedFrom: MathBattleMatchStatus | null;
  /** Gift power received between rounds, added to each team at the start of the next round. */
  bankedGiftPower: { blue: number; red: number };
  config: MathBattleConfig;
  round: MathBattleRoundState | null;
  ropePosition: number; // -100 to +100
  winLineDistance: number;
  blueTeamScore: MathBattleTeamScore;
  redTeamScore: MathBattleTeamScore;
  streak: MathBattleStreakState;
  recentGifts: MathBattleGiftFeedItem[];
  winner: MathBattleTeamId | "DRAW" | null;
  winningReason?: "WIN_LINE" | "FULL_ROUNDS" | "HOST";
  giftGuide: MathBattleGiftMapping[];
  summary: MathBattleMatchSummary | null;
}

export interface MathBattleHostState extends MathBattlePublicState {
  players: MathBattlePlayer[];
  mappings: MathBattleGiftMapping[];
}

/** Realtime events (NEW_MODULE_MATEMATIKA_BATTLE.md). */
export type MathBattleServerEvent =
  | { type: "MATH_BATTLE_ROUND_STARTED"; payload: MathBattleRoundState }
  | { type: "MATH_BATTLE_ROUND_ENDED"; payload: MathBattleRoundState }
  | { type: "MATH_BATTLE_MATCH_ENDED"; payload: MathBattleMatchSummary }
  | { type: "MATH_BATTLE_STREAK"; payload: MathBattleStreakState }
  | { type: "MATH_BATTLE_GIFT"; payload: MathBattleGiftFeedItem };
