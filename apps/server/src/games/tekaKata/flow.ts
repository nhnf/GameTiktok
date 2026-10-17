import { nanoid } from "nanoid";
import {
  DEFAULT_TEKA_KATA_CONFIG,
  TEKA_KATA_AUTO_ADVANCE_MS,
  wordCells,
  type TekaKataConfig,
  type TekaKataPuzzleHostState,
  type TekaKataWordRecord,
} from "@tebak-kata/shared";
import type { Broadcaster } from "../../core/realtime/broadcaster.js";
import type { GameAdapterContext } from "../../core/session/gameAdapter.js";
import { tekaKataStore } from "./persistence.js";
import { buildTekaKataPuzzle, type ActiveTekaKataPuzzle } from "./puzzleFactory.js";
import { tekaKataHostView, tekaKataPublicView } from "./views.js";

/** Puzzle lifecycle and host actions for Susun Kata (generate, start, skip, reveal, complete). */
export abstract class TekaKataFlow {
  protected config: TekaKataConfig = { ...DEFAULT_TEKA_KATA_CONFIG };
  protected puzzle: ActiveTekaKataPuzzle | null = null;
  protected paused = false;
  protected autoAdvanceTimer: NodeJS.Timeout | null = null;
  protected wordsCache: TekaKataWordRecord[] = [];
  protected readonly usedWordIds = new Set<string>();
  protected categories = new Map<string, { id: string; name: string }>();
  protected puzzlesCompleted = 0;
  protected wordsFound = 0;

  constructor(
    protected readonly broadcaster: Broadcaster,
    protected readonly ctx: GameAdapterContext,
  ) {}

  getConfig(): TekaKataConfig {
    return this.config;
  }

  updateConfig(partial: Partial<TekaKataConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  // -- Puzzle control (PRD 15–21, 32–33) -------------------------------------

  async generatePuzzle(): Promise<TekaKataPuzzleHostState> {
    this.clearAutoAdvance();
    await this.refreshCaches();
    const built = buildTekaKataPuzzle(this.config, this.wordsCache, this.usedWordIds, this.categories);
    const previous = this.puzzle;
    if (previous?.status === "ACTIVE") void tekaKataStore.setStatus(previous.dbId, "SKIPPED");

    const sessionId = this.ctx.getSessionId();
    const dbId = sessionId
      ? await tekaKataStore.createPuzzle({
          sessionId,
          difficulty: built.difficulty,
          categoryId: built.category.id === "general" ? null : built.category.id,
          letters: built.letters,
          gridRows: built.gridRows,
          gridColumns: built.gridColumns,
          isBoss: built.isBoss,
          words: built.words,
        })
      : nanoid();

    this.puzzle = { ...built, dbId };
    this.broadcaster.publish({ type: "TK_PUZZLE_READY", payload: tekaKataPublicView(this.puzzle) });
    this.ctx.broadcastFullState();
    return tekaKataHostView(this.puzzle);
  }

  async startPuzzle(): Promise<void> {
    const status = this.puzzle?.status;
    if (!this.puzzle || status === "COMPLETED" || status === "SKIPPED") await this.generatePuzzle();
    const puzzle = this.puzzle!;
    if (puzzle.status === "ACTIVE") return;

    puzzle.status = "ACTIVE";
    await tekaKataStore.setStatus(puzzle.dbId, "ACTIVE", { startedAt: new Date() });
    await this.ctx.logEvent("TK_PUZZLE_STARTED", { puzzleId: puzzle.dbId });
    this.broadcaster.publish({ type: "TK_PUZZLE_STARTED", payload: tekaKataPublicView(puzzle) });
    this.ctx.broadcastFullState();
  }

  protected async generateAndStart(): Promise<void> {
    await this.generatePuzzle();
    await this.startPuzzle();
  }

  async skipPuzzle(): Promise<void> {
    const puzzle = this.puzzle;
    if (puzzle && puzzle.status !== "COMPLETED" && puzzle.status !== "SKIPPED") {
      puzzle.status = "SKIPPED";
      await tekaKataStore.setStatus(puzzle.dbId, "SKIPPED");
      await this.ctx.logEvent("TK_PUZZLE_SKIPPED", { puzzleId: puzzle.dbId });
      this.broadcaster.publish({ type: "TK_PUZZLE_SKIPPED", payload: { puzzleId: puzzle.dbId } });
    }
    await this.generateAndStart();
  }

  async revealLetter(source: "HINT" | "GIFT" | "HOST" = "HOST"): Promise<void> {
    const puzzle = this.puzzle;
    if (!puzzle || puzzle.status !== "ACTIVE") return;

    const hidden = puzzle.words
      .filter((w) => !w.isFound && !w.isRevealed)
      .flatMap((w) => wordCells(w))
      .filter((c) => !puzzle.revealedCellKeys.has(`${c.row},${c.column}`));
    if (hidden.length === 0) return;

    const chosen = hidden[Math.floor(Math.random() * hidden.length)];
    puzzle.revealedCellKeys.add(`${chosen.row},${chosen.column}`);
    this.broadcaster.publish({ type: "TK_LETTER_REVEALED", payload: { ...chosen, source } });
    await this.ctx.logEvent("TK_LETTER_REVEALED", { ...chosen, source });
    this.ctx.broadcastFullState();
  }

  async revealWord(wordId?: string): Promise<void> {
    const puzzle = this.puzzle;
    if (!puzzle || puzzle.status !== "ACTIVE") return;
    const target = wordId
      ? puzzle.words.find((w) => w.id === wordId)
      : puzzle.words.find((w) => !w.isFound && !w.isRevealed);
    if (!target || target.isFound || target.isRevealed) return;

    target.isRevealed = true;
    puzzle.foundWords++;
    for (const c of wordCells(target)) puzzle.revealedCellKeys.add(`${c.row},${c.column}`);
    const isComplete = puzzle.foundWords >= puzzle.totalWords;
    if (isComplete) puzzle.status = "COMPLETED";
    tekaKataStore.markWordRevealed(puzzle.dbId, target.id, puzzle.foundWords);

    this.broadcaster.publish({
      type: "TK_WORD_REVEALED",
      payload: {
        wordId: target.id,
        word: target.word,
        row: target.row,
        column: target.column,
        direction: target.direction,
        isComplete,
        foundWords: puzzle.foundWords,
        totalWords: puzzle.totalWords,
      },
    });
    await this.ctx.logEvent("TK_WORD_REVEALED", { wordId: target.id, word: target.word });
    this.ctx.broadcastFullState();
    if (isComplete) await this.completePuzzle(puzzle);
  }

  protected async completePuzzle(puzzle: ActiveTekaKataPuzzle): Promise<void> {
    this.puzzlesCompleted++;
    await tekaKataStore.setStatus(puzzle.dbId, "COMPLETED", { completedAt: new Date() });
    this.broadcaster.publish({
      type: "TK_PUZZLE_COMPLETED",
      payload: {
        puzzleId: puzzle.dbId,
        foundWords: puzzle.foundWords,
        totalWords: puzzle.totalWords,
        autoNext: this.config.autoGenerateNext,
        words: puzzle.words.map((w) => ({ word: w.word, foundBy: w.foundBy, points: w.points })),
      },
    });
    await this.ctx.logEvent("TK_PUZZLE_COMPLETED", { puzzleId: puzzle.dbId });
    this.ctx.broadcastFullState();

    if (this.config.autoGenerateNext && !this.paused) {
      this.clearAutoAdvance();
      this.autoAdvanceTimer = setTimeout(() => {
        this.generateAndStart().catch((err) => console.error("[tekaKata] auto-advance failed:", err));
      }, TEKA_KATA_AUTO_ADVANCE_MS);
    }
  }

  protected clearAutoAdvance(): void {
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    this.autoAdvanceTimer = null;
  }

  async refreshCaches(): Promise<void> {
    const { words, categories } = await tekaKataStore.loadWords();
    this.wordsCache = words;
    this.categories = categories;
  }
}
