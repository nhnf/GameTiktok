import type { HostGameModule, HostGameProps } from "../../hostTypes";
import { MathQuestionPanel } from "./QuestionPanel";
import { MathControls } from "./MathControls";

function MatematikaHostMain({ token, hostState }: HostGameProps) {
  return (
    <>
      <MathQuestionPanel question={hostState.mathQuestion} />
      <MathControls token={token} hostState={hostState} />
    </>
  );
}

export const matematikaHost: HostGameModule = {
  Main: MatematikaHostMain,
  stats: ({ progress }) => [
    { label: "Soal selesai", value: progress.mathQuestionsCompleted ?? 0, tone: "bg-green" },
    { label: "Jawaban masuk", value: progress.mathAnswersCount ?? 0, tone: "bg-yellow" },
  ],
};
