import type { Category, Difficulty, GuessEvaluation, IncomingComment, WordRecord } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";

/** DB writes for Tebak Kata. Every function swallows errors: a DB hiccup must never stop the game. */
export const tebakKataStore = {
  async loadWords(): Promise<{ words: WordRecord[]; categories: Map<string, Category> }> {
    const [words, categories] = await Promise.all([
      prisma.word.findMany({ where: { isActive: true } }),
      prisma.category.findMany(),
    ]);
    return {
      words: words.map((w) => ({
        id: w.id,
        word: w.word,
        categoryId: w.categoryId,
        difficulty: w.difficulty as Difficulty,
        isActive: w.isActive,
        usageCount: w.usageCount,
      })),
      categories: new Map(categories.map((c) => [c.id, { id: c.id, name: c.name, emoji: c.emoji }])),
    };
  },

  async createPuzzle(data: { sessionId: string; wordId: string; difficulty: Difficulty; isBoss: boolean; displayState: string }) {
    const row = await prisma.puzzle.create({ data: { ...data, status: "ACTIVE" } });
    await prisma.word.update({ where: { id: data.wordId }, data: { usageCount: { increment: 1 } } }).catch(logError);
    return row.id;
  },

  updateDisplay(puzzleId: string, displayState: string): void {
    prisma.puzzle.update({ where: { id: puzzleId }, data: { displayState } }).catch(logError);
  },

  markSkipped(puzzleId: string): Promise<unknown> {
    return prisma.puzzle.update({ where: { id: puzzleId }, data: { status: "SKIPPED" } }).catch(logError);
  },

  async recordWin(
    playerDbId: Promise<string>,
    puzzle: { dbId: string; word: string; rewardPoints: number },
    comment: IncomingComment,
    evaluation: GuessEvaluation,
  ): Promise<void> {
    try {
      const playerId = await playerDbId;
      await prisma.$transaction([
        prisma.puzzle.update({
          where: { id: puzzle.dbId },
          data: { status: "SOLVED", winnerPlayerId: playerId, solvedAt: new Date(), displayState: puzzle.word },
        }),
        prisma.sessionPlayer.update({
          where: { id: playerId },
          data: { points: { increment: puzzle.rewardPoints }, wins: { increment: 1 }, guesses: { increment: 1 } },
        }),
        prisma.puzzleGuess.create({
          data: {
            puzzleId: puzzle.dbId,
            playerId,
            rawComment: comment.rawComment,
            normalizedGuess: evaluation.normalized,
            matchedLength: evaluation.matchedLength,
            isFullMatch: true,
            isWinner: true,
          },
        }),
      ]);
    } catch (err) {
      logError(err);
    }
  },

  async recordGuess(playerDbId: Promise<string>, puzzleDbId: string, comment: IncomingComment, evaluation: GuessEvaluation) {
    try {
      const playerId = await playerDbId;
      await prisma.sessionPlayer.update({ where: { id: playerId }, data: { guesses: { increment: 1 } } });
      await prisma.puzzleGuess.create({
        data: {
          puzzleId: puzzleDbId,
          playerId,
          rawComment: comment.rawComment,
          normalizedGuess: evaluation.normalized,
          matchedLength: evaluation.matchedLength,
          isFullMatch: evaluation.isFullMatch,
          isWinner: false,
        },
      });
    } catch (err) {
      logError(err);
    }
  },
};

function logError(err: unknown): void {
  console.error("[tebakKata] persistence failed:", err);
}
