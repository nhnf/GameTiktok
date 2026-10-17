import type { OverlayGameModule, OverlayGameProps } from "../../overlayTypes";
import { BattleOverlay } from "./BattleOverlay";

function AutoBattleLayout({ state, options, battleFrame, subscribeBattle }: OverlayGameProps) {
  return (
    <BattleOverlay frame={battleFrame} subscribe={subscribeBattle} state={state?.battle ?? null} reducedMotion={options.reducedMotion} hero3d={options.hero3d} />
  );
}

export const autoBattleOverlay: OverlayGameModule = { Layout: AutoBattleLayout, ownPauseScreen: true };
