import type { MathQuestionHostState, MathQuestionPublicState, ServerEvent } from "@tebak-kata/shared";

/** Applies Matematika realtime events between full state snapshots. */
export function patchMathQuestion<T extends MathQuestionPublicState | MathQuestionHostState>(question: T | null, event: ServerEvent): T | null {
  if (!question) return question;
  switch (event.type) {
    case "MATH_QUESTION_READY":
    case "MATH_QUESTION_STARTED":
      return event.payload.questionId === question.questionId ? { ...question, ...event.payload } : question;
    case "MATH_ANSWER_CORRECT": {
      const { player, answer, rank, points } = event.payload;
      if (question.correctAnswers.some((a) => a.player.userId === player.userId)) return question;
      const record = { player, submittedAnswer: answer, rank, points, createdAt: new Date().toISOString() };
      return { ...question, correctAnswers: [...question.correctAnswers, record], totalCorrect: question.totalCorrect + 1 };
    }
    case "MATH_TIME_UP":
      return {
        ...question,
        status: "TIME_UP",
        revealedAnswer: event.payload.answer,
        totalCorrect: event.payload.totalCorrect,
        correctAnswers: event.payload.correctAnswers,
      };
    case "MATH_ANSWER_REVEALED":
    case "MATH_QUESTION_COMPLETED":
      return { ...question, status: question.status === "TIME_UP" ? "TIME_UP" : "COMPLETED", revealedAnswer: event.payload.answer };
    case "MATH_QUESTION_SKIPPED":
      return { ...question, status: "SKIPPED" };
    default:
      return question;
  }
}
