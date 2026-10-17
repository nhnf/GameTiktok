import { nanoid } from "nanoid";
import {
  DEFAULT_MATH_CONFIG,
  MATH_AUTO_ADVANCE_MS,
  calculateMathPoints,
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

/** Question lifecycle for Matematika LIVE: generate, start, skip, reveal, time-up, auto-next. */
export abstract class MathQuestionFlow {
  abstract getPublicState(): MathQuestionPublicState | null;
  abstract getHostState(): MathQuestionHostState | null;

  protected config: MathConfig = { ...DEFAULT_MATH_CONFIG };
  protected question: ActiveQuestion | null = null;
  protected previousExpression: string | null = null;
  protected questionTimer: NodeJS.Timeout | null = null;
  protected autoAdvanceTimer: NodeJS.Timeout | null = null;
  protected pausedRemainingMs: number | null = null;
  protected questionsCompleted = 0;
  protected totalAnswers = 0;
  protected nextIsBoss = false;

  constructor(
    protected readonly broadcaster: Broadcaster,
    protected readonly ctx: GameAdapterContext,
  ) {}

  getConfig(): MathConfig {
    return this.config;
  }

  updateConfig(partial: Partial<MathConfig>): void {
    this.config = sanitizeMathConfig({ ...this.config, ...partial });
  }

  setNextBoss(isBoss: boolean = true): void {
    this.nextIsBoss = isBoss;
  }

  getProgress() {
    return { mathQuestionsCompleted: this.questionsCompleted, mathAnswersCount: this.totalAnswers };
  }

  // -- Question flow (PRD 11–15, 30–38) --------------------------------------

  async generateQuestion(): Promise<MathQuestionHostState> {
    this.clearTimers();
    this.pausedRemainingMs = null;
    const isBoss = this.nextIsBoss;
    this.nextIsBoss = false;
    const generated = generateMathQuestion(this.config, {
      previousExpression: this.previousExpression,
      isBoss,
    });
    this.previousExpression = generated.expression;
    const sessionId = this.ctx.getSessionId();
    const dbId = sessionId ? await mathStore.createQuestion(sessionId, generated, this.config) : nanoid();
    if (this.question?.status === "ACTIVE") void mathStore.setStatus(this.question.dbId, { status: "SKIPPED" });

    const durationSeconds = isBoss
      ? Math.max(15, Math.min(30, this.config.durationSeconds + 5))
      : this.config.durationSeconds;

    this.question = {
      ...generated,
      dbId,
      durationSeconds,
      status: "READY",
      startedAt: null,
      endsAt: null,
      correctAnswers: [],
      scoredPlayerIds: new Set(),
    };
    this.broadcaster.publish({ type: "MATH_QUESTION_READY", payload: this.getPublicState()! });
    this.ctx.broadcastFullState();
    return this.getHostState()!;
  }

  async startQuestion(): Promise<void> {
    if (!this.question || this.question.status !== "READY") await this.generateQuestion();
    const q = this.question!;
    const now = new Date();
    q.status = "ACTIVE";
    q.startedAt = now;
    q.endsAt = new Date(now.getTime() + q.durationSeconds * 1000);

    await mathStore.setStatus(q.dbId, { status: "ACTIVE", startedAt: now, endsAt: q.endsAt });
    await this.ctx.logEvent("MATH_QUESTION_STARTED", { questionId: q.dbId, expression: q.expression, durationSeconds: q.durationSeconds });
    this.broadcaster.publish({ type: "MATH_QUESTION_STARTED", payload: this.getPublicState()! });
    this.ctx.broadcastFullState();
    this.scheduleTimeUp(q.durationSeconds * 1000);
  }

  async skipQuestion(): Promise<void> {
    this.clearTimers();
    const q = this.question;
    if (q && (q.status === "ACTIVE" || q.status === "READY")) {
      q.status = "SKIPPED";
      await mathStore.setStatus(q.dbId, { status: "SKIPPED" });
      await this.ctx.logEvent("MATH_QUESTION_SKIPPED", { questionId: q.dbId });
      this.broadcaster.publish({ type: "MATH_QUESTION_SKIPPED", payload: { questionId: q.dbId } });
      this.onQuestionFinished?.(q, "SKIPPED");
    }
    await this.generateQuestion();
    await this.startQuestion();
  }

  /** Host ends the question early and shows the answer. */
  async revealAnswer(): Promise<void> {
    const q = this.question;
    if (!q || q.status !== "ACTIVE") throw new Error("Tidak ada soal yang sedang aktif.");
    await this.finish(q, "COMPLETED");
  }

  protected onQuestionFinished?(q: ActiveQuestion, status: "TIME_UP" | "COMPLETED" | "SKIPPED"): void;

  protected async finish(q: ActiveQuestion, status: "TIME_UP" | "COMPLETED"): Promise<void> {
    this.clearTimers();
    q.status = status;
    this.questionsCompleted++;
    this.onQuestionFinished?.(q, status);
    await mathStore.setStatus(q.dbId, { status: "COMPLETED", completedAt: new Date() });

    if (status === "TIME_UP") {
      await this.ctx.logEvent("MATH_TIME_UP", { questionId: q.dbId, answer: q.answer, totalCorrect: q.correctAnswers.length });
      this.broadcaster.publish({
        type: "MATH_TIME_UP",
        payload: { questionId: q.dbId, answer: q.answer, totalCorrect: q.correctAnswers.length, correctAnswers: q.correctAnswers },
      });
    } else {
      await this.ctx.logEvent("MATH_ANSWER_REVEALED", { questionId: q.dbId, answer: q.answer });
      this.broadcaster.publish({ type: "MATH_ANSWER_REVEALED", payload: { questionId: q.dbId, answer: q.answer } });
    }
    this.broadcaster.publish({ type: "MATH_QUESTION_COMPLETED", payload: { questionId: q.dbId, answer: q.answer } });
    this.ctx.broadcastFullState();

    if (this.config.autoNext) {
      this.autoAdvanceTimer = setTimeout(() => {
        this.generateQuestion()
          .then(() => this.startQuestion())
          .catch((err) => console.error("[matematika] auto-advance failed:", err));
      }, MATH_AUTO_ADVANCE_MS);
    }
  }

  protected scheduleTimeUp(ms: number): void {
    if (this.questionTimer) clearTimeout(this.questionTimer);
    this.questionTimer = setTimeout(() => {
      const q = this.question;
      if (q?.status === "ACTIVE") this.finish(q, "TIME_UP").catch((err) => console.error("[matematika] time-up failed:", err));
    }, Math.max(0, ms));
  }

  protected clearTimers(): void {
    if (this.questionTimer) clearTimeout(this.questionTimer);
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    this.questionTimer = null;
    this.autoAdvanceTimer = null;
  }
}
