import type {
  GameType,
  IncomingComment,
  IncomingGift,
  PlayerRef,
  SessionProgress,
  SessionSettings,
} from "@tebak-kata/shared";

/** A viewer as the session tracks them (points are shared by every game). */
export interface SessionPlayer {
  localId: string;
  platformUserId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  points: number;
  wins: number;
  guesses: number;
  streak?: number;
  /** Resolves to the `session_players` row id once it is persisted. */
  dbReady: Promise<string>;
}

export type PlayerIdentity = Pick<IncomingComment, "platformUserId" | "username" | "displayName" | "avatarUrl">;

/** What the session gives every game adapter. */
export interface GameAdapterContext {
  getSessionId(): string | null;
  getOrCreatePlayer(identity: PlayerIdentity): SessionPlayer;
  toPlayerRef(player: PlayerIdentity): PlayerRef;
  broadcastFullState(): void;
  logEvent(type: string, payload: unknown): Promise<void>;
  updateLeaderboard(): void;
  /** Counts a comment the active game recognised as a guess/answer. */
  countValidGuess(): void;
}

export interface GameAdapter {
  readonly gameType: GameType;
  /**
   * PER_COMBO: act once when a TikTok combo ends (word reveals).
   * PER_DELTA: act on every combo delta (gift power / unit spawns).
   */
  readonly giftMode: "PER_COMBO" | "PER_DELTA";
  /** Gifts are still processed (queued/banked) while the session is paused. */
  readonly acceptsGiftsWhilePaused: boolean;
  initialize(): Promise<void>;
  start(settings: SessionSettings): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  handleComment(comment: IncomingComment): Promise<void>;
  handleGift(gift: IncomingGift): Promise<void>;
  getPublicState(): unknown;
  getHostState(): unknown;
  getProgress(): Partial<SessionProgress>;
  /** Simulator hook: a plausible comment a viewer could send right now (null = stay quiet). */
  mockComment(viewerId: string): string | null;
}
