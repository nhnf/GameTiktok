import type { HostGameModule, HostGameProps } from "../../hostTypes";
import { TekaKataPuzzlePanel } from "./PuzzlePanel";
import { TekaKataControls } from "./TekaKataControls";

function TekaKataHostMain({ token, hostState }: HostGameProps) {
  return (
    <>
      <TekaKataPuzzlePanel token={token} puzzle={hostState.tekaKataPuzzle} />
      <TekaKataControls token={token} hostState={hostState} />
    </>
  );
}

export const tekaKataHost: HostGameModule = {
  Main: TekaKataHostMain,
  stats: ({ progress }) => [
    { label: "Puzzle selesai", value: progress.tekaKataPuzzlesCompleted ?? 0, tone: "bg-green" },
    { label: "Kata ditemukan", value: progress.tekaKataWordsFound ?? 0, tone: "bg-purple" },
  ],
};
