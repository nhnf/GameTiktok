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

export interface ActivePuzzle {
  dbId: string;
  word: WordRecord;
  category: Category;
  isBoss: boolean;
  difficulty: Difficulty;
  revealedLength: number;
  status: "ACTIVE" | "SOLVED" | "SKIPPED";
  winner: PlayerRef | null;
  rewardPoints: number;
}

/** Puzzle state and host actions for Tebak Kata (new word, skip, hint, reveals, views). */
export abstract class TebakKataPuzzles {
  protected settings: SessionSettings = {
    scoring: DEFAULT_SCORING,
    bossEveryNWords: DEFAULT_BOSS_EVERY_N_WORDS,
    antiRepeatWindow: DEFAULT_ANTI_REPEAT_WINDOW,
    mockTikTokEnabled: true,
  };

  protected puzzle: ActivePuzzle | null = null;

  protected readonly usedWordIds = new Set<string>();

  protected wordsCache: WordRecord[] = [];

  protected categoriesById = new Map<string, Category>();

  protected wordsFound = 0;

  protected wordsSkipped = 0;

  protected bossesDefeated = 0;

  protected wordsSolvedSinceLastBoss = 0;

  protected autoAdvanceTimer: NodeJS.Timeout | null = null;

  constructor(
    protected readonly broadcaster: Broadcaster,
    protected readonly ctx: GameAdapterContext,
  ) {}

  updateSettings(partial: Partial<SessionSettings>): void {
    this.settings = { ...this.settings, ...partial };
  }

  getProgress() {
    return {
      wordsFound: this.wordsFound,
      wordsSkipped: this.wordsSkipped,
      bossesDefeated: this.bossesDefeated,
      wordsUntilNextBoss: Math.max(0, this.settings.bossEveryNWords - this.wordsSolvedSinceLastBoss),
    };
  }

  async newPuzzle(): Promise<void> {
    const sessionId = this.ctx.getSessionId();
    if (!sessionId) return;
    this.clearAutoAdvance();

    const isBoss = shouldTriggerBoss(this.wordsSolvedSinceLastBoss, this.settings.bossEveryNWords);
    const wanted: Difficulty = isBoss
      ? "boss"
      : TEBAK_KATA_DIFFICULTY_ROTATION[Math.floor(Math.random() * TEBAK_KATA_DIFFICULTY_ROTATION.length)];
    const word = pickNextWord(this.wordsCache, wanted, this.usedWordIds);
    if (!word) throw new Error("Bank kata Tebak Kata kosong. Tambahkan kata aktif di Admin → Tebak Kata → Bank Kata.");

    const category = this.categoriesById.get(word.categoryId) ?? { id: word.categoryId, name: "Umum", emoji: "🔤" };
    const difficulty: Difficulty = isBoss ? "boss" : word.difficulty;
    const initialRevealedLength = word.word.length <= 2 ? word.word.length : 1;
    const dbId = await tebakKataStore.createPuzzle({
      sessionId,
      wordId: word.id,
      difficulty,
      isBoss,
      displayState: displayStateString(word.word, initialRevealedLength),
    });

    this.puzzle = {
      dbId,
      word,
      category,
      isBoss,
      difficulty,
      revealedLength: initialRevealedLength,
      status: "ACTIVE",
      winner: null,
      rewardPoints: scoreForDifficulty(difficulty, this.settings.scoring),
    };

    await this.ctx.logEvent("PUZZLE_STARTED", { wordId: word.id, difficulty, isBoss });
    const publicPuzzle = this.getPublicState()!;
    this.broadcaster.publish({ type: "NEW_PUZZLE", payload: publicPuzzle });
    if (isBoss) {
      await this.ctx.logEvent("BOSS_STARTED", { wordId: word.id });
      this.broadcaster.publish({ type: "BOSS_STARTED", payload: publicPuzzle });
    }
    this.ctx.broadcastFullState();
  }

  async skipCurrentPuzzle(countAsSkip: boolean): Promise<void> {
    if (this.puzzle && this.puzzle.status === "ACTIVE") {
      const word = this.puzzle.word.word;
      this.puzzle.status = "SKIPPED";
      if (countAsSkip) this.wordsSkipped++;
      await tebakKataStore.markSkipped(this.puzzle.dbId);
      await this.ctx.logEvent("PUZZLE_SKIPPED", { word });
      this.broadcaster.publish({ type: "PUZZLE_SKIPPED", payload: { word } });
    }
    await this.newPuzzle();
  }

  async hint(): Promise<void> {
    if (!this.puzzle || this.puzzle.status !== "ACTIVE") throw new Error("Tidak ada kata yang sedang aktif.");
    await this.revealOne("HINT");
  }

  protected async revealOne(source: "HINT" | "GIFT"): Promise<void> {
    if (!this.puzzle) return;
    const target = this.puzzle.word.word;
    if (isFullyRevealed(target, this.puzzle.revealedLength)) {
      this.broadcaster.publish({ type: "ALL_LETTERS_REVEALED", payload: {} });
      return;
    }
    const position = this.puzzle.revealedLength;
    this.puzzle.revealedLength = revealNextLetter(target, this.puzzle.revealedLength);
    const letter = target[position];

    this.broadcaster.publish({ type: "LETTER_REVEALED", payload: { position, letter, source } });
    if (source === "HINT") {
      this.broadcaster.publish({ type: "HINT_USED", payload: { position, letter } });
      await this.ctx.logEvent("HINT_USED", { position, letter });
    }
    tebakKataStore.updateDisplay(this.puzzle.dbId, displayStateString(target, this.puzzle.revealedLength));
  }

  getPublicState(): PuzzlePublicState | null {
    const p = this.puzzle;
    if (!p) return null;
    return {
      puzzleId: p.dbId,
      category: p.category,
      difficulty: p.difficulty,
      isBoss: p.isBoss,
      wordLength: p.word.word.length,
      display: buildDisplay(p.word.word, p.revealedLength),
      revealedLength: p.revealedLength,
      status: p.status,
      winner: p.winner,
      rewardPoints: p.rewardPoints,
    };
  }

  getHostState(): PuzzleHostState | null {
    const pub = this.getPublicState();
    return pub && this.puzzle ? { ...pub, targetWord: this.puzzle.word.word } : null;
  }

  protected scheduleAutoAdvance(): void {
    this.clearAutoAdvance();
    this.autoAdvanceTimer = setTimeout(() => {
      this.newPuzzle().catch((err) => console.error("[tebakKata] auto-advance failed:", err));
    }, TEBAK_KATA_AUTO_ADVANCE_MS);
  }

  protected clearAutoAdvance(): void {
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    this.autoAdvanceTimer = null;
  }

  async refreshCaches(): Promise<void> {
    const { words, categories } = await tebakKataStore.loadWords();
    this.wordsCache = words;
    this.categoriesById = categories;
  }
}
