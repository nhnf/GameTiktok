import type { GeneratedMathQuestion, MathConfig } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";

function logError(err: unknown): void {
  console.error("[matematika] persistence failed:", err);
}

/** DB access for Matematika LIVE. Writes never throw into the game loop. */
export const mathStore = {
  async createQuestion(sessionId: string, q: GeneratedMathQuestion, config: MathConfig): Promise<string> {
    const row = await prisma.mathQuestion.create({
      data: {
        sessionId,
        expression: q.expression,
        number1: q.number1,
        number2: q.number2,
        number3: q.number3,
        operator1: q.operator1,
        operator2: q.operator2,
        answer: q.answer,
        minNumber: config.minNumber,
        maxNumber: config.maxNumber,
        allowNegative: config.allowNegative,
        durationSeconds: config.durationSeconds,
        status: "READY",
      },
    });
    return row.id;
  },

  setStatus(questionId: string, data: { status: string; startedAt?: Date; endsAt?: Date; completedAt?: Date }): Promise<void> {
    return prisma.mathQuestion
      .update({ where: { id: questionId }, data })
      .then(() => undefined)
      .catch(logError);
  },

  async recordAnswer(args: {
    questionId: string;
    playerDbId: Promise<string>;
    submittedAnswer: number;
    rawComment: string;
    isCorrect: boolean;
    rank: number;
    points: number;
  }): Promise<void> {
    try {
      const playerId = await args.playerDbId;
      const answer = prisma.mathAnswer.create({
        data: {
          questionId: args.questionId,
          playerId,
          submittedAnswer: args.submittedAnswer,
          rawComment: args.rawComment,
          isCorrect: args.isCorrect,
          rank: args.rank,
          points: args.points,
        },
      });
      if (!args.isCorrect) {
        await answer;
        return;
      }
      await prisma.$transaction([
        prisma.sessionPlayer.update({
          where: { id: playerId },
          data: { points: { increment: args.points }, wins: { increment: 1 } },
        }),
        answer,
      ]);
    } catch (err) {
      logError(err);
    }
  },

  history(limit: number) {
    return prisma.mathQuestion.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { answers: { where: { isCorrect: true }, include: { player: true }, orderBy: { rank: "asc" } } },
    });
  },
};
