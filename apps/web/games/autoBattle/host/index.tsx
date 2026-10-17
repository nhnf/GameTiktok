import type { HostGameModule, HostGameProps } from "../../hostTypes";
import { BattleControls } from "./BattleControls";
import { BattleGiftPanel } from "./BattleGiftPanel";
import { BattleMonitor } from "./BattleMonitor";
import { BattleTopCard } from "./BattleTopCard";

function AutoBattleHostMain({ token, hostState, battleFrame }: HostGameProps) {
  return (
    <>
      <BattleMonitor frame={battleFrame} battle={hostState.battle} />
      <BattleControls token={token} status={hostState.status} matchStatus={battleFrame?.status ?? hostState.battle?.status ?? "WAITING"} />
    </>
  );
}

export const autoBattleHost: HostGameModule = {
  Main: AutoBattleHostMain,
  Middle: ({ token, hostState, battleGiftLog }) => <BattleGiftPanel token={token} battle={hostState.battle} log={battleGiftLog} />,
  Side: ({ battleFrame }) => <BattleTopCard entries={battleFrame?.top ?? []} />,
  stats: ({ battle }) => [{ label: "Match", value: battle?.matchNumber ?? 0, tone: "bg-blue" }],
};
