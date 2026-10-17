import type { TekaKataDifficulty, TekaKataPuzzleWordHost, TekaKataWordRecord } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";

function logError(err: unknown): void {
  console.error("[tekaKata] persistence failed:", err);
}

/** DB access for Susun Kata. Writes never throw into the game loop. */
export const tekaKataStore = {
  async loadWords(): Promise<{ words: TekaKataWordRecord[]; categories: Map<string, { id: string; name: string }> }> {
    const [words, categories] = await Promise.all([
      prisma.tekaKataWord.findMany({ where: { isActive: true, isAllowed: true } }),
      prisma.tekaKataCategory.findMany({ where: { isActive: true } }),
    ]);
    return {
      words: words.map((w) => ({
        id: w.id,
        word: w.word,
        normalizedWord: w.normalizedWord,
        categoryId: w.categoryId,
        difficulty: w.difficulty as TekaKataDifficulty,
        minimumLength: w.minimumLength,
        maximumLength: w.maximumLength,
        isAllowed: w.isAllowed,
        isActive: w.isActive,
        usageCount: w.usageCount,
      })),
      categories: new Map(categories.map((c) => [c.id, { id: c.id, name: c.name }])),
    };
  },

  /** Creates the puzzle with the in-memory word ids so later found-word rows can reference them. */
  async createPuzzle(data: {
    sessionId: string;
    difficulty: TekaKataDifficulty;
    categoryId: string | null;
    letters: string[];
    gridRows: number;
    gridColumns: number;
    isBoss: boolean;
    words: (TekaKataPuzzleWordHost & { bankWordId: string | null })[];
  }): Promise<string> {
    const row = await prisma.tekaKataPuzzle.create({
      data: {
        sessionId: data.sessionId,
        difficulty: data.difficulty,
        categoryId: data.categoryId,
        lettersJson: JSON.stringify(data.letters),
        gridRows: data.gridRows,
        gridColumns: data.gridColumns,
        status: "READY",
        totalWords: data.words.length,
        foundWords: 0,
        isBoss: data.isBoss,
        words: {
          create: data.words.map((w) => ({
            id: w.id,
            wordId: w.bankWordId,
            word: w.word,
            row: w.row,
            column: w.column,
            direction: w.direction,
            points: w.points,
          })),
        },
      },
    });
    const bankIds = data.words.map((w) => w.bankWordId).filter((id): id is string => Boolean(id));
    if (bankIds.length > 0) {
      prisma.tekaKataWord.updateMany({ where: { id: { in: bankIds } }, data: { usageCount: { increment: 1 } } }).catch(logError);
    }
    return row.id;
  },

  setStatus(puzzleId: string, status: string, extra: { startedAt?: Date; completedAt?: Date } = {}): Promise<void> {
    return prisma.tekaKataPuzzle
      .update({ where: { id: puzzleId }, data: { status, ...extra } })
      .then(() => undefined)
      .catch(logError);
  },

  async recordFoundWord(args: {
    puzzleId: string;
    puzzleWordId: string;
    playerDbId: Promise<string>;
    rawComment: string;
    points: number;
    foundWords: number;
  }): Promise<void> {
    try {
      const playerId = await args.playerDbId;
      await prisma.$transaction([
        prisma.sessionPlayer.update({
          where: { id: playerId },
          data: { points: { increment: args.points }, wins: { increment: 1 }, guesses: { increment: 1 } },
        }),
        prisma.tekaKataPuzzleWord.update({
          where: { id: args.puzzleWordId },
          data: { isFound: true, foundByPlayerId: playerId, foundAt: new Date() },
        }),
        prisma.tekaKataFoundWord.create({
          data: {
            puzzleId: args.puzzleId,
            puzzleWordId: args.puzzleWordId,
            playerId,
            rawComment: args.rawComment,
            points: args.points,
          },
        }),
        prisma.tekaKataPuzzle.update({ where: { id: args.puzzleId }, data: { foundWords: args.foundWords } }),
      ]);
    } catch (err) {
      logError(err);
    }
  },

  markWordRevealed(puzzleId: string, puzzleWordId: string, foundWords: number): void {
    prisma
      .$transaction([
        prisma.tekaKataPuzzleWord.update({ where: { id: puzzleWordId }, data: { isRevealed: true } }),
        prisma.tekaKataPuzzle.update({ where: { id: puzzleId }, data: { foundWords } }),
      ])
      .catch(logError);
  },
};
