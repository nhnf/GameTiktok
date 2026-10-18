import {
  isGameType,
  type ChampionEntry,
  type GameStateHost,
  type GameStatePublic,
  type GameType,
  type SessionSettings,
  type SessionStatus,
  type SessionSummary,
} from "@tebak-kata/shared";
import { prisma } from "../db.js";
import type { Broadcaster } from "../realtime/broadcaster.js";
import { createGameAdapters, type GameAdapters } from "../../games/registry.js";
import type { GameAdapter, GameAdapterContext } from "./gameAdapter.js";
import { LiveTimer } from "./liveTimer.js";
import { PlayerRegistry } from "./playerRegistry.js";
import { defaultSessionSettings, mergeSettings } from "./settings.js";
import { settingsStore } from "./settingsStore.js";
import { buildHostState, buildPublicState, type SessionSnapshot } from "./sessionViews.js";

type SessionListener = () => void;

/**
 * Session state, settings and broadcasting. The lifecycle and comment/gift
 * ingestion rules live in `GameSessionManager` (sessionManager.ts).
 */
export abstract class SessionCore {
  protected sessionId: string | null = null;
  protected status: SessionStatus = "CREATED";
  protected activeGame: GameType = "TEBAK_KATA";
  protected settings: SessionSettings = defaultSessionSettings();
  protected readonly players = new PlayerRegistry();
  protected totalComments = 0;
  protected totalValidGuesses = 0;
  protected totalGifts = 0;
  protected lastSessionSummary: SessionSummary | null = null;
  protected readonly endedListeners = new Set<SessionListener>();
  protected readonly timer: LiveTimer;
  protected giftGoal = {
    currentCoins: 0,
    targetCoins: 100,
    tier: 1,
    lastGifter: null as string | null,
  };
  protected champions: ChampionEntry[] = [];
  private liveSourceProbe: (() => GameStateHost["liveSource"]) | null = null;
  readonly games: GameAdapters;

  constructor(protected readonly broadcaster: Broadcaster) {
    const ctx: GameAdapterContext = {
      getSessionId: () => this.sessionId,
      getOrCreatePlayer: (identity) => this.players.getOrCreate(identity, this.sessionId),
      toPlayerRef: (player) => this.players.toPlayerRef(player),
      broadcastFullState: () => this.broadcastFullState(),
      logEvent: (type, payload) => this.logEvent(type, payload),
      updateLeaderboard: () => this.broadcastLeaderboard(),
      countValidGuess: () => {
        this.totalValidGuesses++;
      },
    };
    this.games = createGameAdapters(broadcaster, ctx);
    this.timer = new LiveTimer({
      onOvertime: (graceEndsAt) => void this.enterOvertime(graceEndsAt).catch(logError("overtime")),
      onExpired: () => void this.endSession("TIMER").catch(logError("timer end")),
    });
  }

  /** Loads persisted settings (call once at startup). */
  async init(): Promise<void> {
    const stored = await settingsStore.load();
    if (stored) this.applySettings(mergeSettings(this.settings, stored));
    if (isGameType(this.settings.activeGame)) this.activeGame = this.settings.activeGame;
    await this.refreshChampions();
  }

  async refreshChampions(): Promise<void> {
    try {
      const endedSessions = await prisma.liveSession.findMany({
        where: {
          status: "ENDED",
        },
        orderBy: { endedAt: "desc" },
        take: 200,
        include: {
          players: {
            orderBy: { points: "desc" },
            take: 1,
          },
        },
      });

      const map = new Map<string, ChampionEntry>();

      for (const session of endedSessions) {
        const top = session.players[0];
        if (top && (top.points > 0 || top.wins > 0)) {
          const existing = map.get(top.platformUserId);
          if (existing) {
            existing.championCount += 1;
            existing.totalPoints = (existing.totalPoints ?? 0) + top.points;
            if (top.avatarUrl) existing.avatarUrl = top.avatarUrl;
            if (top.username) existing.username = top.username;
          } else {
            map.set(top.platformUserId, {
              userId: top.platformUserId,
              username: top.username,
              displayName: top.displayName ?? undefined,
              avatarUrl: top.avatarUrl ?? undefined,
              championCount: 1,
              totalPoints: top.points,
              lastSessionDate: session.endedAt?.toISOString() || session.startedAt.toISOString(),
            });
          }
        }
      }

      this.champions = [...map.values()]
        .sort((a, b) => {
          // 1. Paling banyak kali juara (descending)
          if (b.championCount !== a.championCount) {
            return b.championCount - a.championCount;
          }
          // 2. Baru saja juara (sesi terbaru di atas)
          const timeA = a.lastSessionDate ? new Date(a.lastSessionDate).getTime() : 0;
          const timeB = b.lastSessionDate ? new Date(b.lastSessionDate).getTime() : 0;
          if (timeB !== timeA) {
            return timeB - timeA;
          }
          // Fallback poin
          return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
        })
        .slice(0, 5);
    } catch (err) {
      console.error("[champions] failed to fetch champions:", err);
    }
  }

  async removeChampion(userId: string): Promise<void> {
    try {
      const players = await prisma.sessionPlayer.findMany({ where: { platformUserId: userId }, select: { id: true } });
      const ids = players.map((p) => p.id);
      if (ids.length > 0) {
        await prisma.mathAnswer.deleteMany({ where: { playerId: { in: ids } } }).catch(() => {});
        await prisma.puzzleGuess.deleteMany({ where: { playerId: { in: ids } } }).catch(() => {});
        await prisma.tekaKataFoundWord.deleteMany({ where: { playerId: { in: ids } } }).catch(() => {});
        await prisma.sessionPlayer.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
      }
      await this.refreshChampions();
      this.broadcastFullState();
    } catch (err) {
      console.error("[champions] failed to remove champion:", err);
    }
  }

  // Typed access for the game routers --------------------------------------
  getTebakKataAdapter() {
    return this.games.TEBAK_KATA;
  }
  getTekaKataAdapter() {
    return this.games.TEKA_KATA;
  }
  getMatematikaAdapter() {
    return this.games.MATEMATIKA;
  }
  getMathBattleAdapter() {
    return this.games.MATEMATIKA_BATTLE;
  }
  getAutoBattleAdapter() {
    return this.games.AUTO_BATTLE;
  }
  getCurrentAdapter(): GameAdapter {
    return this.games[this.activeGame];
  }
  getActiveGame(): GameType {
    return this.activeGame;
  }
  getStatus(): SessionStatus {
    return this.status;
  }
  getSettings(): SessionSettings {
    return this.settings;
  }
  isLive(): boolean {
    return this.status === "ACTIVE" || this.status === "PAUSED";
  }
  /** Lets the host dashboard show the live source's connection status. */
  setLiveSourceProbe(probe: () => GameStateHost["liveSource"]): void {
    this.liveSourceProbe = probe;
  }

  /** Called whenever a session ends (host, timer, or error). */
  onSessionEnded(listener: SessionListener): () => void {
    this.endedListeners.add(listener);
    return () => this.endedListeners.delete(listener);
  }

  protected abstract enterOvertime(graceEndsAt: Date): Promise<void>;
  abstract endSession(reason?: "HOST" | "TIMER"): Promise<SessionSummary>;

  // ---------------------------------------------------------------------
  // Settings & state
  // ---------------------------------------------------------------------

  updateSettings(partial: Partial<SessionSettings>): SessionSettings {
    this.applySettings(mergeSettings(this.settings, partial));
    void settingsStore.save(this.settings);
    this.broadcastFullState();
    return this.settings;
  }

  setGiftGoalCoins(coins: number): void {
    const valid = Math.max(1, Math.round(coins));
    this.settings.giftGoalCoins = valid;
    this.giftGoal.targetCoins = valid * this.giftGoal.tier;
    void settingsStore.save(this.settings);
    this.broadcaster.publish({
      type: "GIFT_GOAL_UPDATED",
      payload: { ...this.giftGoal },
    });
    this.broadcastFullState();
  }

  setLiveTimerSecondsPerCoin(seconds: number): void {
    const valid = Math.max(0, Math.round(seconds));
    if (!this.settings.liveTimer) {
      this.settings.liveTimer = { enabled: true, initialMinutes: 30, secondsPerCoin: valid };
    } else {
      this.settings.liveTimer.secondsPerCoin = valid;
    }
    this.timer.setSecondsPerCoin(valid);
    void settingsStore.save(this.settings);
    this.broadcastFullState();
  }

  /** Pushes settings into the game modules that read them live. */
  protected applySettings(settings: SessionSettings): void {
    this.settings = settings;
    if (settings.giftGoalCoins && settings.giftGoalCoins > 0) {
      this.giftGoal.targetCoins = settings.giftGoalCoins * this.giftGoal.tier;
    }
    if (settings.liveTimer?.secondsPerCoin !== undefined) {
      this.timer.setSecondsPerCoin(settings.liveTimer.secondsPerCoin);
    }
    this.games.TEBAK_KATA.updateSettings(settings);
    if (settings.tekaKata) this.games.TEKA_KATA.updateConfig(settings.tekaKata);
    if (settings.matematika) this.games.MATEMATIKA.updateConfig(settings.matematika);
  }

  protected snapshot(): SessionSnapshot {
    const live = this.isLive() && this.sessionId !== null;
    return {
      sessionId: this.sessionId,
      status: this.status,
      activeGame: this.activeGame,
      settings: this.settings,
      leaderboard: this.players.leaderboard(),
      timer: live && this.timer.enabled ? this.timer.view() : null,
      giftGoal: { ...this.giftGoal },
      champions: this.champions,
      lastSessionSummary: this.lastSessionSummary,
      stats: {
        totalPlayers: this.players.size,
        totalComments: this.totalComments,
        totalValidGuesses: this.totalValidGuesses,
        totalGifts: this.totalGifts,
      },
      liveSource: this.liveSourceProbe?.() ?? null,
    };
  }

  getPublicState(): GameStatePublic {
    return buildPublicState(this.snapshot(), this.games);
  }

  getHostState(): GameStateHost {
    return buildHostState(this.snapshot(), this.games);
  }

  broadcastFullState(): void {
    const snapshot = this.snapshot();
    this.broadcaster.publish({ type: "SESSION_STATE", payload: buildPublicState(snapshot, this.games) }, "overlay");
    this.broadcaster.publish({ type: "SESSION_STATE_HOST", payload: buildHostState(snapshot, this.games) }, "host");
  }

  broadcastLeaderboard(): void {
    this.broadcaster.publish({ type: "LEADERBOARD_UPDATED", payload: { leaderboard: this.players.leaderboard() } });
  }

  protected async persistStatus(): Promise<void> {
    if (!this.sessionId) return;
    await prisma.liveSession
      .update({ where: { id: this.sessionId }, data: { status: this.status, activeGame: this.activeGame } })
      .catch(logError("persist status"));
  }

  async logEvent(type: string, payload: unknown): Promise<void> {
    if (!this.sessionId) return;
    try {
      await prisma.gameEvent.create({ data: { sessionId: this.sessionId, type, payloadJson: JSON.stringify(payload) } });
    } catch (err) {
      console.error("[session] logEvent error:", err);
    }
  }
}
export function logError(what: string) {
  return (err: unknown) => console.error(`[session] ${what} failed:`, err);
}
