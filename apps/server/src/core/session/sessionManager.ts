import {
  isGameType,
  type GameType,
  type IncomingComment,
  type IncomingGift,
  type SessionSettings,
  type SessionSummary,
} from "@tebak-kata/shared";
import { prisma } from "../db.js";
import { mergeSettings } from "./settings.js";
import { settingsStore } from "./settingsStore.js";
import { buildSummary, collectProgress } from "./sessionViews.js";
import { giftCoinValue } from "./giftValue.js";
import { SessionCore, logError } from "./sessionCore.js";

/**
 * One LIVE session at a time: owns the shared player list/leaderboard, the
 * session countdown and which game module is active. Every game lives in
 * `src/games/<game>` and plugs in through the `GameAdapter` contract.
 */
export class GameSessionManager extends SessionCore {
  // ---------------------------------------------------------------------
  // Session lifecycle (PRD sections 28–30)
  // ---------------------------------------------------------------------

  async startSession(overrides?: Partial<SessionSettings>): Promise<void> {
    if (this.isLive()) throw new Error("Sesi LIVE masih berjalan — akhiri dulu sebelum memulai sesi baru.");
    if (overrides?.activeGame !== undefined && !isGameType(overrides.activeGame)) throw new Error("Game tidak dikenal.");

    if (overrides?.mathBattle) {
      await this.games.MATEMATIKA_BATTLE.initialize();
      await this.games.MATEMATIKA_BATTLE.saveConfig(overrides.mathBattle);
    }
    const settings = mergeSettings(this.settings, overrides);
    this.activeGame = settings.activeGame ?? this.activeGame;
    this.applySettings({ ...settings, activeGame: this.activeGame });
    void settingsStore.save(this.settings);

    this.players.clear();
    this.totalComments = 0;
    this.totalValidGuesses = 0;
    this.totalGifts = 0;
    this.lastSessionSummary = null;
    const baseCoins = this.settings.giftGoalCoins ?? 100;
    this.giftGoal = { currentCoins: 0, targetCoins: baseCoins, tier: 1, lastGifter: null };

    const row = await prisma.liveSession.create({
      data: { status: "ACTIVE", activeGame: this.activeGame, settingsJson: JSON.stringify(this.settings) },
    });
    this.sessionId = row.id;
    this.status = "ACTIVE";
    this.timer.start(this.settings.liveTimer);

    try {
      await Promise.all(Object.values(this.games).map((game) => game.initialize()));
      await this.getCurrentAdapter().start(this.settings);
    } catch (err) {
      // Roll back so the host can fix the problem (e.g. an empty word bank) and retry.
      this.timer.stop();
      await Promise.all(Object.values(this.games).map((game) => game.stop().catch(() => {})));
      await prisma.liveSession.update({ where: { id: row.id }, data: { status: "ENDED", endedAt: new Date() } }).catch(() => {});
      this.sessionId = null;
      this.status = "CREATED";
      this.broadcastFullState();
      throw err;
    }

    await this.logEvent("SESSION_STARTED", { activeGame: this.activeGame });
    this.broadcastFullState();
  }

  async pauseSession(): Promise<void> {
    if (this.status !== "ACTIVE") throw new Error("Sesi tidak sedang berjalan.");
    this.status = "PAUSED";
    this.timer.pause();
    await this.getCurrentAdapter().pause();
    await this.persistStatus();
    await this.logEvent("SESSION_PAUSED", {});
    this.broadcaster.publish({ type: "SESSION_PAUSED", payload: {} });
    this.broadcastFullState();
  }

  async resumeSession(): Promise<void> {
    if (this.status !== "PAUSED") throw new Error("Sesi tidak sedang dijeda.");
    if (this.timer.isOvertime) {
      throw new Error("Waktu LIVE sudah habis — tambah waktu (+5/+10 menit) atau tunggu gift untuk melanjutkan.");
    }
    await this.resumeInternal();
  }

  protected async resumeInternal(): Promise<void> {
    this.status = "ACTIVE";
    this.timer.resume();
    await this.getCurrentAdapter().resume();
    await this.persistStatus();
    await this.logEvent("SESSION_RESUMED", {});
    this.broadcaster.publish({ type: "SESSION_RESUMED", payload: {} });
    this.broadcastFullState();
  }

  protected async enterOvertime(graceEndsAt: Date): Promise<void> {
    if (this.status !== "ACTIVE") return;
    this.status = "PAUSED";
    await this.getCurrentAdapter().pause();
    await this.persistStatus();
    await this.logEvent("LIVE_TIMER_OVERTIME", { graceEndsAt: graceEndsAt.toISOString() });
    const graceSeconds = Math.round((graceEndsAt.getTime() - Date.now()) / 1000);
    this.broadcaster.publish({ type: "LIVE_TIMER_OVERTIME", payload: { graceEndsAt: graceEndsAt.toISOString(), graceSeconds } });
    this.broadcaster.publish({ type: "SESSION_PAUSED", payload: {} });
    this.broadcastFullState();
  }

  async endSession(reason: "HOST" | "TIMER" = "HOST"): Promise<SessionSummary> {
    if (!this.sessionId || !this.isLive()) throw new Error("Belum ada sesi LIVE yang berjalan.");
    const sessionId = this.sessionId;

    this.timer.stop();
    for (const game of Object.values(this.games)) await game.stop().catch(logError(`stop ${game.gameType}`));

    const summary = buildSummary(sessionId, this.snapshot(), collectProgress(this.games));
    this.status = "ENDED";
    await prisma.liveSession
      .update({ where: { id: sessionId }, data: { status: "ENDED", endedAt: new Date() } })
      .catch(logError("persist end"));
    await this.logEvent("SESSION_ENDED", { ...summary, reason, leaderboard: undefined });
    this.lastSessionSummary = summary;
    this.broadcaster.publish({ type: "SESSION_ENDED", payload: { summary } });

    this.sessionId = null;
    await this.refreshChampions();
    this.broadcastFullState();
    for (const listener of this.endedListeners) listener();
    return summary;
  }

  // ---------------------------------------------------------------------
  // Switching game (PRD sections 28–31)
  // ---------------------------------------------------------------------

  async switchGame(newGame: GameType, newSettings?: Partial<SessionSettings>): Promise<void> {
    if (!isGameType(newGame)) throw new Error("Game tidak dikenal.");
    if (newSettings) this.applySettings(mergeSettings(this.settings, newSettings));
    if (this.activeGame === newGame) {
      this.broadcastFullState();
      return;
    }

    await this.getCurrentAdapter().stop();
    this.activeGame = newGame;
    this.applySettings({ ...this.settings, activeGame: newGame });
    void settingsStore.save(this.settings);

    if (this.sessionId) {
      await prisma.liveSession
        .update({ where: { id: this.sessionId }, data: { activeGame: newGame, settingsJson: JSON.stringify(this.settings) } })
        .catch(logError("persist game switch"));
      await this.logEvent("GAME_CHANGED", { gameType: newGame });
    }
    this.broadcaster.publish({ type: "GAME_CHANGED", payload: { gameType: newGame } });

    if (this.isLive()) {
      const next = this.getCurrentAdapter();
      await next.initialize();
      await next.start(this.settings);
      if (this.status === "PAUSED") await next.pause();
    }
    this.broadcastFullState();
  }

  // ---------------------------------------------------------------------
  // Comment & gift ingestion
  // ---------------------------------------------------------------------

  async handleComment(comment: IncomingComment): Promise<void> {
    this.totalComments++;
    if (this.status !== "ACTIVE") return;
    await this.getCurrentAdapter().handleComment(comment);
  }

  async handleGift(gift: IncomingGift): Promise<void> {
    if (!this.isLive()) return;
    const count = typeof gift.count === "number" ? Math.max(0, Math.floor(gift.count)) : 1;

    if (count > 0) {
      this.totalGifts += count;
      const unitCoins = await giftCoinValue(gift);
      const coins = unitCoins * count;
      const addedSeconds = this.timer.secondsForCoins(coins);
      if (addedSeconds > 0) {
        const rescued = this.timer.addSeconds(addedSeconds);
        const endsAt = this.timer.currentEndsAt ?? new Date(Date.now() + this.timer.view().secondsRemaining * 1000);
        this.broadcaster.publish({
          type: "LIVE_TIMER_EXTENDED",
          payload: { addedSeconds, coins, username: gift.username, newEndsAt: endsAt.toISOString() },
        });
        if (rescued && this.status === "PAUSED") await this.resumeInternal();
      }

      if (coins > 0) {
        const oldRank = this.players.getPlayerRank(gift.platformUserId);
        const gifter = this.players.getOrCreate(gift, this.sessionId);
        const is100Coins = unitCoins === 100 || coins === 100 || (coins > 0 && coins % 100 === 0 && unitCoins >= 100);
        const is30Coins = !is100Coins && (unitCoins === 30 || coins === 30 || (coins > 0 && coins % 30 === 0 && unitCoins >= 30));

        let pointsAwarded = 0;
        let isScoreReset = false;
        let deductedOpponentPoints = 0;

        if (is100Coins) {
          this.players.resetAllPoints();
          const multiplier = unitCoins === 100 ? count : Math.floor(coins / 100);
          pointsAwarded = 1000 * Math.max(1, multiplier);
          gifter.points = pointsAwarded;
          isScoreReset = true;
          await this.logEvent("GIFT_SCORE_RESET", {
            username: gift.username,
            giftId: gift.giftId,
            coins,
            pointsAwarded: gifter.points,
          });
        } else if (is30Coins) {
          const multiplier = unitCoins === 30 ? count : Math.floor(coins / 30);
          pointsAwarded = coins * 100;
          gifter.points += pointsAwarded;
          deductedOpponentPoints = 100 * Math.max(1, multiplier);

          let opponentUserIds: string[] | undefined;
          if (this.activeGame === "MATEMATIKA_BATTLE") {
            const opps = this.games.MATEMATIKA_BATTLE.getOpponentUserIds(gift.platformUserId, gift.giftId, gift.giftName);
            if (opps.length > 0) opponentUserIds = opps;
          }
          this.players.deductOpponentPoints(gift.platformUserId, deductedOpponentPoints, opponentUserIds);

          await this.logEvent("GIFT_DEDUCT_OPPONENT", {
            username: gift.username,
            giftId: gift.giftId,
            coins,
            pointsAwarded,
            deducted: deductedOpponentPoints,
          });
        } else {
          pointsAwarded = coins * 100;
          gifter.points += pointsAwarded;
          await this.logEvent("GIFT_POINTS_AWARDED", {
            username: gift.username,
            giftId: gift.giftId,
            coins,
            pointsAwarded,
          });
        }

        const newRank = this.players.getPlayerRank(gift.platformUserId);
        const rankRose = newRank !== null && (oldRank === null || newRank < oldRank);

        this.giftGoal.currentCoins += coins;
        this.giftGoal.lastGifter = gift.username;

        if (this.giftGoal.currentCoins >= this.giftGoal.targetCoins) {
          const reachedGoal = { ...this.giftGoal };
          const baseCoins = this.settings.giftGoalCoins ?? 100;
          this.giftGoal.tier += 1;
          this.giftGoal.currentCoins = Math.max(0, this.giftGoal.currentCoins - this.giftGoal.targetCoins);
          this.giftGoal.targetCoins = baseCoins * this.giftGoal.tier;

          this.games.MATEMATIKA.setNextBoss(true);
          this.games.TEBAK_KATA.setNextBoss(true);
          this.games.TEKA_KATA.setNextBoss(true);

          this.broadcaster.publish({
            type: "GIFT_GOAL_ACHIEVED",
            payload: {
              goal: reachedGoal,
              reward: "BOSS_ROUND",
              message: "TARGET TERCAPAI! SOAL BERIKUTNYA: BOSS ROUND (POIN BERLIPAT)",
            },
          });
        } else {
          this.broadcaster.publish({
            type: "GIFT_GOAL_UPDATED",
            payload: { ...this.giftGoal },
          });
        }

        this.broadcaster.publish({
          type: "GIFT_REWARD",
          payload: {
            id: `gr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId: gift.platformUserId,
            username: gift.username,
            displayName: gift.displayName,
            avatarUrl: gift.avatarUrl,
            giftId: gift.giftId,
            giftName: gift.giftName,
            coins,
            count,
            pointsAwarded,
            addedSeconds,
            isScoreReset,
            deductedOpponentPoints,
            oldRank,
            newRank,
            rankRose,
            createdAt: new Date().toISOString(),
          },
        });

        this.broadcastLeaderboard();
        this.broadcastFullState();
      }
    }

    const adapter = this.getCurrentAdapter();
    if (this.status !== "ACTIVE" && !adapter.acceptsGiftsWhilePaused) return;
    const act = adapter.giftMode === "PER_DELTA" ? count > 0 : gift.comboEnded !== false;
    if (act) await adapter.handleGift({ ...gift, count });
  }

  /** Same code path as a real gift (used by the simulator and test buttons). */
  async applyGift(gift: IncomingGift): Promise<void> {
    await this.handleGift(gift);
  }

  addLiveTimerSeconds(seconds: number): void {
    if (!this.sessionId || !this.timer.enabled) throw new Error("Timer sesi LIVE tidak aktif.");
    const rescued = this.timer.addSeconds(seconds);
    if (rescued && this.status === "PAUSED") {
      void this.resumeInternal().catch(logError("resume after add-time"));
      return;
    }
    this.broadcastFullState();
  }
}
