import type { GameType } from "@tebak-kata/shared";
import type { HostGameModule } from "./hostTypes";
import { tebakKataHost } from "./tebakKata/host";
import { tekaKataHost } from "./tekaKata/host";
import { matematikaHost } from "./matematika/host";
import { mathBattleHost } from "./mathBattle/host";
import { autoBattleHost } from "./autoBattle/host";

/** Host Dashboard panels contributed by each game module. */
export const HOST_GAMES: Record<GameType, HostGameModule> = {
  TEBAK_KATA: tebakKataHost,
  TEKA_KATA: tekaKataHost,
  MATEMATIKA: matematikaHost,
  MATEMATIKA_BATTLE: mathBattleHost,
  AUTO_BATTLE: autoBattleHost,
};
