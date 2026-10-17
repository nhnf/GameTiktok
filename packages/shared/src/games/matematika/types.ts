import type { PlayerRef } from "../../core/types.js";

export type MathOperator = "+" | "-" | "*" | "/";

export type MathOperationMode =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "add_sub"
  | "mul_div"
  | "mixed";

export type MathQuestionStatus =
  | "DRAFT"
  | "READY"
  | "ACTIVE"
  | "TIME_UP"
  | "COMPLETED"
  | "SKIPPED";

export interface MathConfig {
  durationSeconds: number; // default 10 (range 3-60)
  minNumber: number; // default 1
  maxNumber: number; // default 99
  operationMode: MathOperationMode; // default "mixed"
  allowNegative: boolean; // default false
  autoNext: boolean; // default true
  minPoints: number; // default 1
  firstPlacePoints: number; // default 10
  rankPoints?: number[]; // Points for rank 1 to 9: [r1, r2, ..., r9]
  rank10PlusPoints?: number; // Points for rank 10+
}

export interface MathCorrectAnswer {
  player: PlayerRef;
  submittedAnswer: number;
  rank: number;
  points: number;
  streak?: number;
  streakBonus?: number;
  createdAt: string;
}

export interface MathQuestionPublicState {
  questionId: string;
  expression: string; // e.g. "27 + 14 + 38"
  durationSeconds: number;
  startedAt: string | null;
  endsAt: string | null;
  status: MathQuestionStatus;
  correctAnswers: MathCorrectAnswer[];
  totalCorrect: number;
  revealedAnswer: number | null; // null while ACTIVE/DRAFT/READY, revealed on TIME_UP/REVEAL
  isBoss?: boolean;
  pointMultiplier?: number;
}

export interface MathQuestionHostState extends MathQuestionPublicState {
  answer: number; // always visible to host
  number1: number;
  number2: number;
  number3: number;
  operator1: MathOperator;
  operator2: MathOperator;
}

export interface MathAnswerEvaluation {
  rawComment: string;
  parsedNumber: number | null;
  isCorrect: boolean;
  points: number;
  rank: number;
  streak?: number;
  streakBonus?: number;
}

/** Realtime events (PRD Matematika §57–59). */
export type MatematikaServerEvent =
  | { type: "MATH_QUESTION_READY"; payload: MathQuestionPublicState }
  | { type: "MATH_QUESTION_STARTED"; payload: MathQuestionPublicState }
  | {
      type: "MATH_ANSWER_CORRECT";
      payload: {
        questionId: string;
        player: PlayerRef;
        answer: number;
        rank: number;
        points: number;
        totalPoints: number;
        isBoss?: boolean;
        streak?: number;
        streakBonus?: number;
      };
    }
  | {
      type: "MATH_TIME_UP";
      payload: { questionId: string; answer: number; totalCorrect: number; correctAnswers: MathCorrectAnswer[] };
    }
  | { type: "MATH_ANSWER_REVEALED"; payload: { questionId: string; answer: number } }
  | { type: "MATH_QUESTION_COMPLETED"; payload: { questionId: string; answer: number } }
  | { type: "MATH_QUESTION_SKIPPED"; payload: { questionId: string } };
