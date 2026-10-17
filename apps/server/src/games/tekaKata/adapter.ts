import { nanoid } from "nanoid";
import {
  canFormWord,
  normalizeTekaKataWord,
  wordCells,
  type ChatVerdict,
  type IncomingComment,
  type IncomingGift,
  type SessionSettings,
  type TekaKataPuzzleHostState,
  type TekaKataPuzzlePublicState,
} from "@tebak-kata/shared";
import type { GameAdapter } from "../../core/session/gameAdapter.js";
import { findWordGiftConfig } from "../../core/gifts/wordGiftConfig.js";
import { tekaKataStore } from "./persistence.js";
import { TekaKataFlow } from "./flow.js";
import { tekaKataHostView, tekaKataPublicView } from "./views.js";

/** Susun Kata (PRD_TEKA_KATA_LIVE_UPDATE 1.md): viewers form words from a letter pool to fill a crossword. */
export class TekaKataAdapter extends TekaKataFlow implements GameAdapter {
  readonly gameType = "TEKA_KATA" as const;
  readonly giftMode = "PER_COMBO" as const;
  readonly acceptsGiftsWhilePaused = false;

  async initialize(): Promise<void> {
    await this.refreshCaches();
  }

  async start(settings: SessionSettings): Promise<void> {
    if (settings.tekaKata) this.updateConfig(settings.tekaKata);
    this.puzzlesCompleted = 0;
    this.wordsFound = 0;
    this.paused = false;
    await this.generateAndStart();
  }

  async pause(): Promise<void> {
    this.paused = true;
    this.clearAutoAdvance();
  }

  async resume(): Promise<void> {
    this.paused = false;
    const status = this.puzzle?.status;
    if (!this.puzzle || status === "COMPLETED" || status === "SKIPPED") {
      if (!this.puzzle || this.config.autoGenerateNext) await this.generateAndStart();
    }
  }

  async stop(): Promise<void> {
    this.clearAutoAdvance();
    if (this.puzzle && (this.puzzle.status === "ACTIVE" || this.puzzle.status === "READY")) {
      void tekaKataStore.setStatus(this.puzzle.dbId, "SKIPPED");
    }
    this.puzzle = null;
    this.paused = false;
  }

  getProgress() {
    return { tekaKataPuzzlesCompleted: this.puzzlesCompleted, tekaKataWordsFound: this.wordsFound };
  }

  // -- Comments: first correct claim wins (PRD 22–24) ------------------------

  async handleComment(comment: IncomingComment): Promise<void> {
    const normalized = normalizeTekaKataWord(comment.rawComment);
    const puzzle = this.puzzle;
    if (!normalized || normalized.length < 2 || !puzzle || puzzle.status !== "ACTIVE" || this.paused) return;

    const player = this.ctx.getOrCreatePlayer(comment);
    player.guesses++;
    const matched = puzzle.words.find((w) => w.word === normalized);
    if (matched || canFormWord(normalized, puzzle.letters)) this.ctx.countValidGuess();

    if (!matched || matched.isFound || matched.isRevealed) {
      this.broadcastChat(comment, matched ? "ALREADY_FOUND" : "INVALID", 0);
      return;
    }

    // Synchronous claim: nothing awaits between the check above and here.
    matched.isFound = true;
    matched.foundBy = this.ctx.toPlayerRef(player);
    matched.foundAt = new Date().toISOString();
    player.points += matched.points;
    player.wins++;
    puzzle.foundWords++;
    this.wordsFound++;
    const cells = wordCells(matched);
    for (const c of cells) puzzle.revealedCellKeys.add(`${c.row},${c.column}`);
    const isComplete = puzzle.foundWords >= puzzle.totalWords;
    if (isComplete) puzzle.status = "COMPLETED";

    const playerRef = this.ctx.toPlayerRef(player);
    this.broadcaster.publish({
      type: "TK_WORD_FOUND",
      payload: {
        puzzleId: puzzle.dbId,
        wordId: matched.id,
        word: matched.word,
        player: playerRef,
        points: matched.points,
        isComplete,
        foundWords: puzzle.foundWords,
        totalWords: puzzle.totalWords,
        revealedPositions: cells,
      },
    });
    this.broadcaster.publish({ type: "TK_PLAYER_SCORED", payload: { player: playerRef, points: matched.points, totalPoints: player.points } });
    this.broadcastChat(comment, "CORRECT", matched.points);
    this.ctx.updateLeaderboard();
    this.ctx.broadcastFullState();

    void tekaKataStore.recordFoundWord({
      puzzleId: puzzle.dbId,
      puzzleWordId: matched.id,
      playerDbId: player.dbReady,
      rawComment: comment.rawComment,
      points: matched.points,
      foundWords: puzzle.foundWords,
    });
    if (isComplete) await this.completePuzzle(puzzle);
  }

  async handleGift(gift: IncomingGift): Promise<void> {
    if (!this.config.allowGiftReveal || !this.puzzle || this.puzzle.status !== "ACTIVE") return;
    const config = await findWordGiftConfig(gift);
    if (!config || !config.enabled || config.effect !== "REVEAL_NEXT_LETTER") return;
    this.broadcaster.publish({
      type: "GIFT_RECEIVED",
      payload: { id: nanoid(), username: gift.username, giftName: config.giftName, effect: "REVEAL_NEXT_LETTER", createdAt: new Date().toISOString() },
    });
    await this.revealLetter("GIFT");
  }

  private broadcastChat(comment: IncomingComment, status: ChatVerdict, points: number): void {
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
        gameType: "TEKA_KATA",
        status,
        points,
        createdAt: new Date().toISOString(),
      },
    });
  }

  getPublicState(): TekaKataPuzzlePublicState | null {
    return this.puzzle ? tekaKataPublicView(this.puzzle) : null;
  }

  getHostState(): TekaKataPuzzleHostState | null {
    return this.puzzle ? tekaKataHostView(this.puzzle) : null;
  }

  mockComment(): string | null {
    const puzzle = this.puzzle;
    if (!puzzle || puzzle.status !== "ACTIVE") return null;
    const open = puzzle.words.filter((w) => !w.isFound && !w.isRevealed);
    const roll = Math.random();
    if (roll < 0.3 && open.length > 0) return open[Math.floor(Math.random() * open.length)].word;
    if (roll < 0.5) return puzzle.words[Math.floor(Math.random() * puzzle.words.length)].word;
    return null;
  }
}
