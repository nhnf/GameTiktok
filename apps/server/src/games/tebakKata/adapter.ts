import { nanoid } from "nanoid";
import {
  DEFAULT_ANTI_REPEAT_WINDOW,
  DEFAULT_BOSS_EVERY_N_WORDS,
  DEFAULT_SCORING,
  TEBAK_KATA_AUTO_ADVANCE_MS,
  TEBAK_KATA_DIFFICULTY_ROTATION,
  buildDisplay,
  displayStateString,
  evaluateGuess,
  isFullyRevealed,
  pickNextWord,
  revealNextLetter,
  scoreForDifficulty,
  shouldTriggerBoss,
  type Category,
  type Difficulty,
  type IncomingComment,
  type IncomingGift,
  type PlayerRef,
  type PuzzleHostState,
  type PuzzlePublicState,
  type SessionSettings,
  type WordRecord,
} from "@tebak-kata/shared";
import type { Broadcaster } from "../../core/realtime/broadcaster.js";
import type { GameAdapter, GameAdapterContext } from "../../core/session/gameAdapter.js";
import { findWordGiftConfig } from "../../core/gifts/wordGiftConfig.js";
import { tebakKataStore } from "./persistence.js";
import { TebakKataPuzzles, type ActivePuzzle } from "./puzzles.js";

/** Tebak Kata (PRD_Tebak_Kata_Live_TikTok.md): prefix-matching word guessing with boss rounds. */
export class TebakKataAdapter extends TebakKataPuzzles implements GameAdapter {
  readonly gameType = "TEBAK_KATA" as const;
  readonly giftMode = "PER_COMBO" as const;
  readonly acceptsGiftsWhilePaused = false;

  async initialize(): Promise<void> {
    await this.refreshCaches();
  }

  async start(settings: SessionSettings): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.refreshCaches();
    this.wordsFound = 0;
    this.wordsSkipped = 0;
    this.bossesDefeated = 0;
    this.wordsSolvedSinceLastBoss = 0;
    await this.newPuzzle();
  }

  async pause(): Promise<void> {
    this.clearAutoAdvance();
  }

  async resume(): Promise<void> {
    if (!this.puzzle || this.puzzle.status !== "ACTIVE") await this.newPuzzle();
  }

  async stop(): Promise<void> {
    this.clearAutoAdvance();
    if (this.puzzle?.status === "ACTIVE") void tebakKataStore.markSkipped(this.puzzle.dbId);
    this.puzzle = null;
  }

  async handleGift(gift: IncomingGift): Promise<void> {
    if (!this.puzzle || this.puzzle.status !== "ACTIVE") return;
    const config = await findWordGiftConfig(gift);
    if (!config || !config.enabled || config.effect !== "REVEAL_NEXT_LETTER") return;

    this.broadcaster.publish({
      type: "GIFT_RECEIVED",
      payload: { id: nanoid(), username: gift.username, giftName: config.giftName, effect: "REVEAL_NEXT_LETTER", createdAt: new Date().toISOString() },
    });
    await this.ctx.logEvent("GIFT_RECEIVED", { username: gift.username, giftId: gift.giftId });
    await this.revealOne("GIFT");
  }

  async handleComment(comment: IncomingComment): Promise<void> {
    const puzzle = this.puzzle;
    if (!puzzle || puzzle.status !== "ACTIVE") return;

    const target = puzzle.word.word;
    const evaluation = evaluateGuess(target, puzzle.revealedLength, comment.rawComment);
    if (evaluation.normalized === "") return;

    const player = this.ctx.getOrCreatePlayer(comment);
    player.guesses++;
    if (evaluation.matchedLength > 0) this.ctx.countValidGuess();

    // Synchronous critical section: the first exact match wins.
    const oldRevealed = puzzle.revealedLength;
    const isWinner = evaluation.isFullMatch;
    if (isWinner) {
      puzzle.status = "SOLVED";
      puzzle.revealedLength = target.length;
      puzzle.winner = this.ctx.toPlayerRef(player);
      player.points += puzzle.rewardPoints;
      player.wins++;
      this.wordsFound++;
      if (puzzle.isBoss) {
        this.bossesDefeated++;
        this.wordsSolvedSinceLastBoss = 0;
      } else {
        this.wordsSolvedSinceLastBoss++;
      }
    } else if (evaluation.revealAdvanced) {
      puzzle.revealedLength = evaluation.newRevealedLength;
    }

    this.broadcaster.publish({
      type: "CHAT_MESSAGE",
      payload: {
        id: nanoid(),
        username: comment.username,
        avatarUrl: comment.avatarUrl,
        rawComment: comment.rawComment,
        matchedLength: evaluation.matchedLength,
        isFullMatch: evaluation.isFullMatch,
        isWinner,
        gameType: "TEBAK_KATA",
        status: isWinner ? "CORRECT" : undefined,
        points: isWinner ? puzzle.rewardPoints : undefined,
        createdAt: new Date().toISOString(),
      },
    });

    for (let pos = oldRevealed; pos < puzzle.revealedLength; pos++) {
      this.broadcaster.publish({ type: "LETTER_REVEALED", payload: { position: pos, letter: target[pos], source: "GUESS" } });
    }

    if (isWinner) {
      const winner = puzzle.winner!;
      this.broadcaster.publish({ type: "PLAYER_WON", payload: { winner, points: puzzle.rewardPoints, word: target } });
      if (puzzle.isBoss) {
        this.broadcaster.publish({ type: "BOSS_DEFEATED", payload: { winner, points: puzzle.rewardPoints, word: target } });
      }
      this.ctx.updateLeaderboard();
      this.ctx.broadcastFullState();
      void tebakKataStore.recordWin(player.dbReady, { dbId: puzzle.dbId, word: target, rewardPoints: puzzle.rewardPoints }, comment, evaluation);
      void this.ctx.logEvent("PLAYER_WON", { username: player.username, points: puzzle.rewardPoints, word: target });
      this.scheduleAutoAdvance();
    } else {
      void tebakKataStore.recordGuess(player.dbReady, puzzle.dbId, comment, evaluation);
      if (oldRevealed !== puzzle.revealedLength) {
        tebakKataStore.updateDisplay(puzzle.dbId, displayStateString(target, puzzle.revealedLength));
      }
    }
  }

  mockComment(): string | null {
    const target = this.puzzle?.status === "ACTIVE" ? this.puzzle.word.word : null;
    if (!target) return null;
    const roll = Math.random();
    if (roll < 0.1) return target;
    if (roll > 0.55) return null;
    const prefixLen = 1 + Math.floor(Math.random() * Math.max(1, target.length - 1));
    const tail = Array.from({ length: Math.max(0, target.length - prefixLen) }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    ).join("");
    return target.slice(0, prefixLen) + tail;
  }
}
