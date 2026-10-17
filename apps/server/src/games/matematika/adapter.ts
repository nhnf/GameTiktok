import { nanoid } from "nanoid";
import {
  DEFAULT_MATH_CONFIG,
  MATH_AUTO_ADVANCE_MS,
  calculateMathPoints,
  calculateStreakBonus,
  generateMathQuestion,
  normalizeMathAnswer,
  sanitizeMathConfig,
  type ChatVerdict,
  type GeneratedMathQuestion,
  type IncomingComment,
  type IncomingGift,
  type MathConfig,
  type MathCorrectAnswer,
  type MathQuestionHostState,
  type MathQuestionPublicState,
  type MathQuestionStatus,
  type SessionSettings,
} from "@tebak-kata/shared";
import type { Broadcaster } from "../../core/realtime/broadcaster.js";
import type { GameAdapter, GameAdapterContext } from "../../core/session/gameAdapter.js";
import { mathStore } from "./persistence.js";

interface ActiveQuestion extends GeneratedMathQuestion {
  dbId: string;
  durationSeconds: number;
  status: MathQuestionStatus;
  startedAt: Date | null;
  endsAt: Date | null;
  correctAnswers: MathCorrectAnswer[];
  scoredPlayerIds: Set<string>;
}
import { MathQuestionFlow } from "./questionFlow.js";

/** Matematika LIVE (PRD_MATEMATIKA_LIVE.md): timed arithmetic, points by answer speed rank. */
export class MatematikaAdapter extends MathQuestionFlow implements GameAdapter {
  readonly gameType = "MATEMATIKA" as const;
  readonly giftMode = "PER_COMBO" as const;
  readonly acceptsGiftsWhilePaused = false;
  private readonly playerStreaks = new Map<string, number>();
  async initialize(): Promise<void> {}

  async start(settings: SessionSettings): Promise<void> {
    if (settings.matematika) this.updateConfig(settings.matematika);
    this.questionsCompleted = 0;
    this.totalAnswers = 0;
    this.pausedRemainingMs = null;
    this.playerStreaks.clear();
    await this.generateQuestion();
    await this.startQuestion();
  }

  async pause(): Promise<void> {
    this.clearTimers();
    const q = this.question;
    if (q?.status === "ACTIVE" && q.endsAt) this.pausedRemainingMs = Math.max(1000, q.endsAt.getTime() - Date.now());
  }

  async resume(): Promise<void> {
    const q = this.question;
    if (q?.status === "ACTIVE" && this.pausedRemainingMs !== null) {
      q.endsAt = new Date(Date.now() + this.pausedRemainingMs);
      this.pausedRemainingMs = null;
      this.scheduleTimeUp(q.endsAt.getTime() - Date.now());
      this.ctx.broadcastFullState();
      return;
    }
    this.pausedRemainingMs = null;
    if (!q || (q.status !== "READY" && this.config.autoNext)) {
      await this.generateQuestion();
      await this.startQuestion();
    }
  }

  async stop(): Promise<void> {
    this.clearTimers();
    if (this.question && (this.question.status === "ACTIVE" || this.question.status === "READY")) {
      void mathStore.setStatus(this.question.dbId, { status: "SKIPPED" });
    }
    this.question = null;
    this.pausedRemainingMs = null;
    this.playerStreaks.clear();
  }

  // -- Comments (PRD 21–26) --------------------------------------------------

  async handleComment(comment: IncomingComment): Promise<void> {
    const answer = normalizeMathAnswer(comment.rawComment);
    const q = this.question;
    if (answer === null || !q || q.status !== "ACTIVE" || this.pausedRemainingMs !== null) return;
    if (!q.endsAt || Date.now() > q.endsAt.getTime()) return;

    const player = this.ctx.getOrCreatePlayer(comment);
    player.guesses++;
    this.totalAnswers++;
    this.ctx.countValidGuess();

    if (q.scoredPlayerIds.has(comment.platformUserId)) {
      this.broadcastChat(comment, "ALREADY_FOUND", 0, 0);
      return;
    }
    if (answer !== q.answer) {
      this.broadcastChat(comment, "INVALID", 0, 0);
      void mathStore.recordAnswer({ questionId: q.dbId, playerDbId: player.dbReady, submittedAnswer: answer, rawComment: comment.rawComment, isCorrect: false, rank: 0, points: 0 });
      return;
    }

    const rank = q.correctAnswers.length + 1;
    const basePoints = calculateMathPoints(rank, this.config);
    const multiplier = q.isBoss ? (q.pointMultiplier ?? 3) : 1;
    const earnedBase = basePoints * multiplier;

    const streak = (this.playerStreaks.get(comment.platformUserId) ?? 0) + 1;
    this.playerStreaks.set(comment.platformUserId, streak);
    player.streak = streak;
    const streakBonus = calculateStreakBonus(streak);
    const totalPointsEarned = earnedBase + streakBonus;

    q.scoredPlayerIds.add(comment.platformUserId);
    const playerRef = this.ctx.toPlayerRef(player);
    q.correctAnswers.push({
      player: playerRef,
      submittedAnswer: answer,
      rank,
      points: totalPointsEarned,
      streak,
      streakBonus: streakBonus > 0 ? streakBonus : undefined,
      createdAt: new Date().toISOString(),
    });
    player.points += totalPointsEarned;
    player.wins++;

    if (streakBonus > 0) {
      this.broadcaster.publish({
        type: "STREAK_MILESTONE",
        payload: { player: playerRef, streak, bonusPoints: streakBonus },
      });
    }

    this.broadcaster.publish({
      type: "MATH_ANSWER_CORRECT",
      payload: {
        questionId: q.dbId,
        player: playerRef,
        answer,
        rank,
        points: totalPointsEarned,
        totalPoints: player.points,
        isBoss: q.isBoss,
        streak,
        streakBonus: streakBonus > 0 ? streakBonus : undefined,
      },
    });
    this.broadcastChat(comment, "CORRECT", totalPointsEarned, rank, streak);
    this.ctx.updateLeaderboard();
    this.ctx.broadcastFullState();
    void mathStore.recordAnswer({ questionId: q.dbId, playerDbId: player.dbReady, submittedAnswer: answer, rawComment: comment.rawComment, isCorrect: true, rank, points: totalPointsEarned });
  }

  protected override onQuestionFinished(q: ActiveQuestion): void {
    for (const [userId, streak] of this.playerStreaks.entries()) {
      if (!q.scoredPlayerIds.has(userId) && streak > 0) {
        this.playerStreaks.set(userId, 0);
        const p = this.ctx.getOrCreatePlayer({ platformUserId: userId, username: "" });
        p.streak = 0;
      }
    }
  }

  async handleGift(_gift: IncomingGift): Promise<void> {
    // Gifts only extend the LIVE timer in this game (handled by the session).
  }

  private broadcastChat(comment: IncomingComment, status: ChatVerdict, points: number, rank: number, streak?: number): void {
    this.broadcaster.publish({
      type: "CHAT_MESSAGE",
      payload: {
        id: nanoid(),
        username: comment.username,
        avatarUrl: comment.avatarUrl,
        rawComment: comment.rawComment,
        matchedLength: 0,
        isFullMatch: status === "CORRECT",
        isWinner: status === "CORRECT",
        gameType: "MATEMATIKA",
        status,
        points,
        rank,
        streak,
        createdAt: new Date().toISOString(),
      },
    });
  }

  // -- Views (anti-cheat: the answer is public only after the question ends) --

  getPublicState(): MathQuestionPublicState | null {
    const q = this.question;
    if (!q) return null;
    const finished = q.status === "TIME_UP" || q.status === "COMPLETED";
    return {
      questionId: q.dbId,
      expression: q.expression,
      durationSeconds: q.durationSeconds,
      startedAt: q.startedAt?.toISOString() ?? null,
      endsAt: this.pausedRemainingMs === null ? (q.endsAt?.toISOString() ?? null) : null,
      status: q.status,
      correctAnswers: q.correctAnswers,
      totalCorrect: q.correctAnswers.length,
      revealedAnswer: finished ? q.answer : null,
      isBoss: q.isBoss ?? false,
      pointMultiplier: q.pointMultiplier ?? 1,
    };
  }

  getHostState(): MathQuestionHostState | null {
    const pub = this.getPublicState();
    const q = this.question;
    if (!pub || !q) return null;
    return {
      ...pub,
      answer: q.answer,
      number1: q.number1,
      number2: q.number2,
      number3: q.number3,
      operator1: q.operator1,
      operator2: q.operator2,
      isBoss: q.isBoss ?? false,
      pointMultiplier: q.pointMultiplier ?? 1,
    };
  }

  mockComment(): string | null {
    const q = this.question;
    if (!q || q.status !== "ACTIVE") return null;
    const roll = Math.random();
    if (roll < 0.35) return String(q.answer);
    if (roll < 0.6) return String(q.answer + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 5)));
    return null;
  }
}
