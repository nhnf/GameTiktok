import type { HostGameModule, HostGameProps } from "../../hostTypes";
import { TebakKataPuzzlePanel } from "./PuzzlePanel";
import { TebakKataControls } from "./TebakKataControls";

function TebakKataHostMain({ token, hostState }: HostGameProps) {
  return (
    <>
      <TebakKataPuzzlePanel puzzle={hostState.puzzle} />
      <TebakKataControls token={token} hostState={hostState} />
    </>
  );
}

export const tebakKataHost: HostGameModule = {
  Main: TebakKataHostMain,
  stats: ({ progress }) => [
    { label: "Kata terjawab", value: progress.wordsFound, tone: "bg-green" },
    { label: "Kata dilewati", value: progress.wordsSkipped, tone: "bg-orange" },
    { label: "Boss kalah", value: progress.bossesDefeated, tone: "bg-purple" },
  ],
};
