import { nanoid } from "nanoid";
import {
  DEFAULT_MATH_BATTLE_CONFIG,
  MATH_BATTLE_TIMINGS as T,
  calculateRopeDelta,
  generateFairQuestionPair,
  updateStreak,
  type MathBattleConfig,
  type MathBattleGiftFeedItem,
  type MathBattleGiftMapping,
  type MathBattleMatchStatus,
  type MathBattleMatchSummary,
  type MathBattlePlayer,
  type MathBattleRoundState,
  type MathBattleStreakState,
  type MathBattleTeamId,
  type MathBattleTeamScore,
} from "@tebak-kata/shared";
import type { Broadcaster } from "../../core/realtime/broadcaster.js";
import type { GameAdapterContext } from "../../core/session/gameAdapter.js";
import { mathBattleStore } from "./persistence.js";

const emptyScore = (): MathBattleTeamScore => ({ totalPower: 0, answerPower: 0, giftPower: 0, roundsWon: 0, playerCount: 0 });
const emptyStreak = (): MathBattleStreakState => ({ team: null, count: 0, brokenTeam: null, brokenCount: 0 });

/**
 * Tarik Tambang match state machine:
 * LOBBY → STARTING → (QUESTION_ACTIVE → ROPE_ANIMATION → ROUND_RESULT → NEXT_ROUND)× → VICTORY → RESULT.
 * Every timed transition goes through one phase timer, so pause/resume can
 * freeze and continue any phase exactly where it was.
 */
export abstract class MathBattleFlow {
  protected config: MathBattleConfig = { ...DEFAULT_MATH_BATTLE_CONFIG };
  protected mappings: MathBattleGiftMapping[] = [];
  protected matchId = nanoid();
  protected matchNumber = 0;
  protected status: MathBattleMatchStatus = "LOBBY";
  protected pausedFrom: MathBattleMatchStatus | null = null;
  protected round: MathBattleRoundState | null = null;
  protected roundNumber = 0;
  protected ropePosition = 0;
  protected streak = emptyStreak();
  protected blueScore = emptyScore();
  protected redScore = emptyScore();
  protected readonly players = new Map<string, MathBattlePlayer>();
  protected recentGifts: MathBattleGiftFeedItem[] = [];
  protected banked = { blue: 0, red: 0 };
  protected summary: MathBattleMatchSummary | null = null;
  protected roundStartedAt = 0;
  protected matchesCompleted = 0;
  protected roundsCompleted = 0;
  protected matchRowReady: Promise<unknown> | null = null;

  private phaseTimer: NodeJS.Timeout | null = null;
  private phaseAction: (() => Promise<void> | void) | null = null;
  private phaseEndsAt = 0;
  private pausedRemainingMs: number | null = null;
  private pausedAt = 0;

  constructor(
    protected readonly broadcaster: Broadcaster,
    protected readonly ctx: GameAdapterContext,
  ) {}

  protected isRunning(): boolean {
    return !["LOBBY", "VICTORY", "RESULT"].includes(this.status);
  }

  // -- Phase timer -------------------------------------------------------------

  private schedule(ms: number, action: () => Promise<void> | void): void {
    this.clearPhase();
    this.phaseAction = action;
    this.phaseEndsAt = Date.now() + ms;
    this.phaseTimer = setTimeout(() => {
      const run = this.phaseAction;
      this.phaseTimer = null;
      this.phaseAction = null;
      Promise.resolve(run?.()).catch((err: unknown) => console.error("[mathBattle] phase failed:", err));
    }, Math.max(0, ms));
  }

  protected clearPhase(): void {
    if (this.phaseTimer) clearTimeout(this.phaseTimer);
    this.phaseTimer = null;
    this.phaseAction = null;
  }

  pauseMatch(): void {
    if (!this.isRunning() || this.status === "PAUSED") return;
    this.pausedFrom = this.status;
    this.pausedAt = Date.now();
    this.pausedRemainingMs = this.phaseAction ? Math.max(300, this.phaseEndsAt - Date.now()) : null;
    const action = this.phaseAction;
    this.clearPhase();
    this.phaseAction = action;
    this.status = "PAUSED";
    this.ctx.broadcastFullState();
  }

  resumeMatch(): void {
    if (this.status !== "PAUSED" || !this.pausedFrom) return;
    this.status = this.pausedFrom;
    this.pausedFrom = null;
    const pausedFor = Date.now() - this.pausedAt;
    if (this.status === "QUESTION_ACTIVE" && this.round && this.pausedRemainingMs !== null) {
      this.roundStartedAt += pausedFor; // answer speed ignores the pause
      this.round.status = "ACTIVE";
      this.round.endsAt = new Date(Date.now() + this.pausedRemainingMs).toISOString();
    }
    const action = this.phaseAction;
    if (action && this.pausedRemainingMs !== null) this.schedule(this.pausedRemainingMs, action);
    this.pausedRemainingMs = null;
    this.ctx.broadcastFullState();
  }

  // -- Match flow -----------------------------------------------------------------

  /** Clears the arena for a brand-new match (team choices are kept). */
  resetMatch(): void {
    this.clearPhase();
    this.pausedFrom = null;
    this.pausedRemainingMs = null;
    this.matchId = nanoid();
    this.matchRowReady = null;
    this.roundNumber = 0;
    this.ropePosition = 0;
    this.streak = emptyStreak();
    this.blueScore = emptyScore();
    this.redScore = emptyScore();
    this.round = null;
    this.summary = null;
    this.recentGifts = [];
    this.status = "LOBBY";
    for (const p of this.players.values()) Object.assign(p, { correctAnswers: 0, wrongAnswers: 0, totalAnswerPower: 0, totalGiftPower: 0, matchPower: 0 });
    this.updatePlayerCounts();
  }

  startMatch(): void {
    if (this.isRunning()) throw new Error("Match masih berjalan. Akhiri atau reset dulu.");
    if (this.status !== "LOBBY" || this.summary) this.resetMatch();
    this.matchNumber++;
    this.matchRowReady = mathBattleStore.createMatch(this.matchId, this.ctx.getSessionId(), this.matchNumber, this.config.totalRounds);
    this.status = "STARTING";
    this.ctx.broadcastFullState();
    this.schedule(T.starting, () => this.startNextRound());
  }

  /** Host "next round": finish the current phase now instead of waiting. */
  async skipAhead(): Promise<void> {
    if (this.status === "QUESTION_ACTIVE") return this.endRound();
    if (this.status === "STARTING" || this.status === "ROUND_RESULT" || this.status === "NEXT_ROUND") return this.startNextRound();
    if (this.status === "ROPE_ANIMATION") return this.afterRopeAnimation();
    throw new Error("Tidak ada ronde yang bisa dilanjutkan. Mulai match dulu.");
  }

  protected async startNextRound(): Promise<void> {
    this.clearPhase();
    if (this.roundNumber >= this.config.totalRounds) return this.endMatch("FULL_ROUNDS");
    this.roundNumber++;
    const { blue, red } = generateFairQuestionPair(this.config.difficulty, this.config.operators);
    const duration = this.config.roundDurationSeconds;
    const now = Date.now();
    const team = (question: typeof blue, giftPower: number) => ({ question, answerPower: 0, giftPower, totalPower: 0, correctCount: 0, playerAnswers: [] });
    this.round = {
      roundNumber: this.roundNumber,
      totalRounds: this.config.totalRounds,
      status: "ACTIVE",
      startedAt: new Date(now).toISOString(),
      endsAt: new Date(now + duration * 1000).toISOString(),
      durationSeconds: duration,
      blue: team(blue, this.banked.blue),
      red: team(red, this.banked.red),
      ropePositionBefore: this.ropePosition,
      ropePositionAfter: this.ropePosition,
      ropeDelta: 0,
      roundWinner: null,
    };
    this.banked = { blue: 0, red: 0 };
    this.roundStartedAt = now;
    this.status = "QUESTION_ACTIVE";
    this.broadcaster.publish({ type: "MATH_BATTLE_ROUND_STARTED", payload: this.round });
    this.ctx.broadcastFullState();
    this.schedule(duration * 1000, () => this.endRound());
  }

  protected async endRound(): Promise<void> {
    const round = this.round;
    if (!round || this.status !== "QUESTION_ACTIVE") return;
    this.clearPhase();
    this.status = "ANSWER_LOCKED";
    round.status = "CALCULATING";
    round.blue.totalPower = round.blue.answerPower + round.blue.giftPower;
    round.red.totalPower = round.red.answerPower + round.red.giftPower;
    const { delta, roundWinner } = calculateRopeDelta(round.blue.totalPower, round.red.totalPower, this.config.minRopeMovement, this.config.maxRopeMovement);
    const limit = this.config.winLineDistance;
    this.ropePosition = Math.max(-limit, Math.min(limit, this.ropePosition + delta));
    round.ropeDelta = delta;
    round.roundWinner = roundWinner;
    round.ropePositionAfter = this.ropePosition;
    round.status = "RESULT";

    for (const [score, side] of [[this.blueScore, round.blue], [this.redScore, round.red]] as const) {
      score.totalPower += side.totalPower;
      score.answerPower += side.answerPower;
      score.giftPower += side.giftPower;
    }
    if (roundWinner === "BLUE") this.blueScore.roundsWon++;
    if (roundWinner === "RED") this.redScore.roundsWon++;
    if (this.config.streakEnabled) {
      this.streak = updateStreak(this.streak, roundWinner);
      this.broadcaster.publish({ type: "MATH_BATTLE_STREAK", payload: this.streak });
    }
    this.roundsCompleted++;
    this.status = "ROPE_ANIMATION";
    this.broadcaster.publish({ type: "MATH_BATTLE_ROUND_ENDED", payload: round });
    this.ctx.broadcastFullState();
    void this.matchRowReady?.then(() => mathBattleStore.recordRound(this.matchId, round));
    this.schedule(T.ropeAnimation, () => this.afterRopeAnimation());
  }

  protected async afterRopeAnimation(): Promise<void> {
    this.clearPhase();
    const limit = this.config.winLineDistance;
    if (this.ropePosition <= -limit) return this.endMatch("WIN_LINE", "BLUE");
    if (this.ropePosition >= limit) return this.endMatch("WIN_LINE", "RED");
    if (this.roundNumber >= this.config.totalRounds) return this.endMatch("FULL_ROUNDS");
    this.status = "ROUND_RESULT";
    this.ctx.broadcastFullState();
    this.schedule(T.roundResult, () => {
      this.status = "NEXT_ROUND";
      this.ctx.broadcastFullState();
      this.schedule(T.nextRound, () => this.startNextRound());
    });
  }

  async endMatch(reason: "WIN_LINE" | "FULL_ROUNDS" | "HOST", forcedWinner?: MathBattleTeamId | "DRAW"): Promise<void> {
    if (this.status === "LOBBY" || this.summary) throw new Error("Belum ada match yang berjalan.");
    this.clearPhase();
    this.pausedFrom = null;
    const winner = forcedWinner ?? (this.ropePosition < 0 ? "BLUE" : this.ropePosition > 0 ? "RED" : "DRAW");
    this.summary = {
      matchId: this.matchId,
      winner,
      winningReason: reason,
      totalRounds: this.config.totalRounds,
      completedRounds: this.roundsCompletedInMatch(),
      finalRopePosition: this.ropePosition,
      blueScore: { ...this.blueScore },
      redScore: { ...this.redScore },
      topPlayers: [...this.players.values()].filter((p) => p.matchPower > 0).sort((a, b) => b.matchPower - a.matchPower).slice(0, 10),
    };
    this.matchesCompleted++;
    this.status = "VICTORY";
    this.broadcaster.publish({ type: "MATH_BATTLE_MATCH_ENDED", payload: this.summary });
    this.ctx.broadcastFullState();
    const summary = this.summary;
    void this.matchRowReady?.then(() => mathBattleStore.finishMatch(summary));
    void this.ctx.logEvent("MATH_BATTLE_MATCH_ENDED", { matchId: summary.matchId, winner, reason });
    this.schedule(T.victoryToResult, () => {
      this.status = "RESULT";
      this.ctx.broadcastFullState();
    });
  }

  private roundsCompletedInMatch(): number {
    return this.round && this.round.status !== "RESULT" ? Math.max(0, this.roundNumber - 1) : this.roundNumber;
  }

  protected updatePlayerCounts(): void {
    const all = [...this.players.values()];
    this.blueScore.playerCount = all.filter((p) => p.team === "BLUE").length;
    this.redScore.playerCount = all.filter((p) => p.team === "RED").length;
  }
}
