import type { HostGameModule, HostGameProps } from "../../hostTypes";
import { MatchPanel } from "./MatchPanel";
import { MatchControls } from "./MatchControls";
import { PlayersPanel } from "./PlayersPanel";

function MathBattleHostMain({ token, hostState }: HostGameProps) {
  return (
    <>
      <MatchPanel battle={hostState.mathBattle} />
      <MatchControls token={token} hostState={hostState} />
      <PlayersPanel token={token} battle={hostState.mathBattle} />
    </>
  );
}

export const mathBattleHost: HostGameModule = {
  Main: MathBattleHostMain,
  stats: ({ progress }) => [
    { label: "Match selesai", value: progress.mathBattleMatchesCompleted ?? 0, tone: "bg-blue" },
    { label: "Ronde", value: progress.mathBattleRoundsCompleted ?? 0, tone: "bg-yellow" },
  ],
};
