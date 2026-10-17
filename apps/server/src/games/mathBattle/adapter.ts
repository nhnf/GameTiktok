import { nanoid } from "nanoid";
import {
  EventIdDeduper,
  calculateAnswerPower,
  findMathBattleGiftMapping,
  parseMathAnswer,
  parseTeamJoinComment,
  type ChatVerdict,
  type IncomingComment,
  type IncomingGift,
  type MathBattleConfig,
  type MathBattleGiftMapping,
  type MathBattleHostState,
  type MathBattlePlayer,
  type MathBattlePublicState,
  type MathBattleTeamId,
  type SessionSettings,
} from "@tebak-kata/shared";
import type { GameAdapter } from "../../core/session/gameAdapter.js";
import { MathBattleFlow } from "./flow.js";
import { mathBattleStore } from "./persistence.js";

const GIFT_FEED_SIZE = 10;

/** Matematika Tarik Tambang LIVE (NEW_MODULE_MATEMATIKA_BATTLE.md): Blue vs Red math tug of war. */
export class MathBattleAdapter extends MathBattleFlow implements GameAdapter {
  readonly gameType = "MATEMATIKA_BATTLE" as const;
  readonly giftMode = "PER_DELTA" as const;
  /** Gift power sent during a pause is banked for the next round. */
  readonly acceptsGiftsWhilePaused = true;
  private readonly deduper = new EventIdDeduper();

  async initialize(): Promise<void> {
    this.config = await mathBattleStore.loadConfig();
    this.mappings = await mathBattleStore.loadMappings().catch((err: unknown) => {
      console.error("[mathBattle] failed to load gift mappings:", err);
      return this.mappings;
    });
  }

  async start(_settings: SessionSettings): Promise<void> {
    this.players.clear();
    this.banked = { blue: 0, red: 0 };
    this.matchesCompleted = 0;
    this.roundsCompleted = 0;
    this.resetMatch();
    this.startMatch();
  }

  async pause(): Promise<void> {
    this.pauseMatch();
  }

  async resume(): Promise<void> {
    this.resumeMatch();
  }

  async stop(): Promise<void> {
    this.resetMatch();
  }

  getConfig(): MathBattleConfig {
    return this.config;
  }

  async saveConfig(partial: Partial<MathBattleConfig>): Promise<MathBattleConfig> {
    this.config = { ...this.config, ...partial };
    await mathBattleStore.saveConfig(this.config);
    this.ctx.broadcastFullState();
    return this.config;
  }

  getMappings(): MathBattleGiftMapping[] {
    return this.mappings;
  }

  async reloadMappings(): Promise<void> {
    this.mappings = await mathBattleStore.loadMappings();
    this.ctx.broadcastFullState();
  }

  getProgress() {
    return { mathBattleMatchesCompleted: this.matchesCompleted, mathBattleRoundsCompleted: this.roundsCompleted };
  }

  // -- Comments: join a team, answer your team's question ------------------------

  async handleComment(comment: IncomingComment): Promise<void> {
    const joined = parseTeamJoinComment(comment.rawComment);
    if (joined) {
      const player = this.ensurePlayer(comment, joined);
      player.team = joined;
      this.updatePlayerCounts();
      this.ctx.getOrCreatePlayer(comment);
      this.broadcastChat(comment, "JOINED", joined, 0);
      this.ctx.broadcastFullState();
      return;
    }

    const answer = parseMathAnswer(comment.rawComment);
    const round = this.round;
    if (answer === null || this.status !== "QUESTION_ACTIVE" || !round) return;

    const player = this.ensurePlayer(comment, this.smallerTeam());
    this.ctx.countValidGuess();
    const alreadyScored = [...round.blue.playerAnswers, ...round.red.playerAnswers].some((a) => a.playerId === comment.platformUserId);
    if (alreadyScored) {
      this.broadcastChat(comment, "ALREADY_FOUND", player.team, 0);
      return;
    }

    const side = player.team === "BLUE" ? round.blue : round.red;
    if (answer !== side.question.answer) {
      player.wrongAnswers++;
      this.broadcastChat(comment, "INVALID", player.team, 0);
      return;
    }

    const elapsed = Math.max(0.1, (Date.now() - this.roundStartedAt) / 1000);
    const power = calculateAnswerPower(elapsed);
    side.playerAnswers.push({
      playerId: comment.platformUserId,
      username: comment.username,
      displayName: comment.displayName,
      avatarUrl: comment.avatarUrl,
      team: player.team,
      submittedAnswer: answer,
      isCorrect: true,
      answeredAtSeconds: Number(elapsed.toFixed(2)),
      powerAwarded: power,
    });
    side.correctCount++;
    side.answerPower += power;
    player.correctAnswers++;
    player.totalAnswerPower += power;
    player.matchPower += power;

    const sessionPlayer = this.ctx.getOrCreatePlayer(comment);
    sessionPlayer.points += power;
    sessionPlayer.wins++;
    sessionPlayer.guesses++;
    this.broadcastChat(comment, "CORRECT", player.team, power);
    this.ctx.updateLeaderboard();
    this.ctx.broadcastFullState();
  }

  // -- Gifts: power for the mapped team (banked when no round is running) --------

  async handleGift(gift: IncomingGift): Promise<void> {
    const count = typeof gift.count === "number" ? gift.count : 1;
    if (count <= 0) return;
    const eventId = gift.eventId ?? `local:${nanoid()}`;
    const mapping = findMathBattleGiftMapping(this.mappings, gift.giftId, gift.giftName);
    if (!mapping || !mapping.enabled || mapping.team === "NEUTRAL" || mapping.power <= 0) return;
    if (!this.deduper.markIfNew(eventId)) return;

    const team = mapping.team;
    const power = mapping.power * count;
    const key = team === "BLUE" ? "blue" : "red";
    if (this.status === "QUESTION_ACTIVE" && this.round) this.round[key].giftPower += power;
    else this.banked[key] += power;

    const player = this.ensurePlayer(gift, team);
    this.ctx.getOrCreatePlayer(gift); // counts as a session participant
    player.totalGiftPower += power;
    player.matchPower += power;

    const item = {
      id: nanoid(),
      timestamp: Date.now(),
      viewerId: gift.platformUserId,
      username: gift.username,
      avatarUrl: gift.avatarUrl,
      giftId: gift.giftId,
      giftName: mapping.giftName,
      team,
      tier: mapping.tier,
      power,
      count,
    };
    this.recentGifts = [item, ...this.recentGifts].slice(0, GIFT_FEED_SIZE);
    this.broadcaster.publish({ type: "MATH_BATTLE_GIFT", payload: item });
    this.ctx.broadcastFullState();
    const roundNumber = this.roundNumber;
    void this.matchRowReady?.then(() => mathBattleStore.recordGift(this.matchId, roundNumber, eventId, item));
  }

  movePlayer(userId: string, team: MathBattleTeamId): void {
    const player = this.players.get(userId);
    if (!player) throw new Error("Pemain tidak ditemukan.");
    player.team = team;
    this.updatePlayerCounts();
    this.ctx.broadcastFullState();
  }

  getOpponentUserIds(gifterUserId: string, giftId?: string | null, giftName?: string | null): string[] {
    let team: MathBattleTeamId | null = null;
    const player = this.players.get(gifterUserId);
    if (player?.team) {
      team = player.team;
    } else {
      const mapping = findMathBattleGiftMapping(this.mappings, giftId, giftName);
      if (mapping && mapping.team !== "NEUTRAL") {
        team = mapping.team;
      }
    }
    if (!team) return [];
    const oppTeam: MathBattleTeamId = team === "BLUE" ? "RED" : "BLUE";
    return [...this.players.values()]
      .filter((p) => p.team === oppTeam)
      .map((p) => p.userId);
  }

  private smallerTeam(): MathBattleTeamId {
    if (this.config.assignmentMode === "RANDOM") return Math.random() < 0.5 ? "BLUE" : "RED";
    return this.blueScore.playerCount <= this.redScore.playerCount ? "BLUE" : "RED";
  }

  private ensurePlayer(identity: Pick<IncomingComment, "platformUserId" | "username" | "displayName" | "avatarUrl">, team: MathBattleTeamId): MathBattlePlayer {
    let player = this.players.get(identity.platformUserId);
    if (!player) {
      player = {
        userId: identity.platformUserId,
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        team,
        correctAnswers: 0,
        wrongAnswers: 0,
        totalAnswerPower: 0,
        totalGiftPower: 0,
        matchPower: 0,
      };
      this.players.set(identity.platformUserId, player);
      this.updatePlayerCounts();
    } else {
      player.username = identity.username || player.username;
      player.avatarUrl = identity.avatarUrl ?? player.avatarUrl;
    }
    return player;
  }

  private broadcastChat(comment: IncomingComment, status: ChatVerdict, team: MathBattleTeamId, points: number): void {
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
        gameType: "MATEMATIKA_BATTLE",
        status,
        points,
        team,
        createdAt: new Date().toISOString(),
      },
    });
  }

  // -- Views ----------------------------------------------------------------------

  getPublicState(): MathBattlePublicState {
    const hideAnswers = this.round && this.status === "QUESTION_ACTIVE";
    const round = this.round && hideAnswers
      ? {
          ...this.round,
          blue: { ...this.round.blue, question: { ...this.round.blue.question, answer: -1 } },
          red: { ...this.round.red, question: { ...this.round.red.question, answer: -1 } },
        }
      : this.round;
    return {
      matchId: this.matchId,
      matchNumber: this.matchNumber,
      status: this.status,
      pausedFrom: this.pausedFrom,
      bankedGiftPower: { ...this.banked },
      config: this.config,
      round,
      ropePosition: this.ropePosition,
      winLineDistance: this.config.winLineDistance,
      blueTeamScore: this.blueScore,
      redTeamScore: this.redScore,
      streak: this.streak,
      recentGifts: this.recentGifts,
      winner: this.summary?.winner ?? null,
      winningReason: this.summary?.winningReason,
      giftGuide: this.mappings.filter((m) => m.enabled && m.team !== "NEUTRAL"),
      summary: this.summary,
    };
  }

  getHostState(): MathBattleHostState {
    return { ...this.getPublicState(), round: this.round, players: [...this.players.values()], mappings: this.mappings };
  }

  mockComment(viewerId: string): string | null {
    const player = this.players.get(viewerId);
    if (!player || Math.random() < 0.05) return Math.random() < 0.5 ? "BIRU" : "MERAH";
    const round = this.round;
    if (this.status !== "QUESTION_ACTIVE" || !round) return null;
    const answer = (player.team === "BLUE" ? round.blue : round.red).question.answer;
    return Math.random() < 0.6 ? String(answer) : String(answer + 1 + Math.floor(Math.random() * 9));
  }
}
