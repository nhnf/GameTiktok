import type { GameType } from "@tebak-kata/shared";
import type { OverlayGameModule } from "./overlayTypes";
import { tebakKataOverlay } from "./tebakKata/overlay";
import { tekaKataOverlay } from "./tekaKata/overlay";
import { matematikaOverlay } from "./matematika/overlay";
import { mathBattleOverlay } from "./mathBattle/overlay/MathBattleLayout";
import { autoBattleOverlay } from "./autoBattle/overlay";

/** OBS overlay layout + banners contributed by each game module. */
export const OVERLAY_GAMES: Record<GameType, OverlayGameModule> = {
  TEBAK_KATA: tebakKataOverlay,
  TEKA_KATA: tekaKataOverlay,
  MATEMATIKA: matematikaOverlay,
  MATEMATIKA_BATTLE: mathBattleOverlay,
  AUTO_BATTLE: autoBattleOverlay,
};
