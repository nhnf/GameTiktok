import type { Express } from "express";
import type { Broadcaster } from "../core/realtime/broadcaster.js";
import type { GameAdapterContext } from "../core/session/gameAdapter.js";
import type { GameSessionManager } from "../core/session/sessionManager.js";
import { TebakKataAdapter } from "./tebakKata/adapter.js";
import { tebakKataRouter } from "./tebakKata/routes.js";
import { tebakKataAdminRouter } from "./tebakKata/adminRoutes.js";
import { TekaKataAdapter } from "./tekaKata/adapter.js";
import { tekaKataRouter } from "./tekaKata/routes.js";
import { tekaKataAdminRouter } from "./tekaKata/adminRoutes.js";
import { MatematikaAdapter } from "./matematika/adapter.js";
import { matematikaRouter } from "./matematika/routes.js";
import { MathBattleAdapter } from "./mathBattle/adapter.js";
import { mathBattleRouter } from "./mathBattle/routes.js";
import { AutoBattleAdapter } from "./autoBattle/adapter.js";
import { autoBattleRouter } from "./autoBattle/routes.js";
import { autoBattleMappingRouter } from "./autoBattle/mappingRoutes.js";

/** One adapter per game module, keyed by GameType. */
export function createGameAdapters(broadcaster: Broadcaster, ctx: GameAdapterContext) {
  return {
    TEBAK_KATA: new TebakKataAdapter(broadcaster, ctx),
    TEKA_KATA: new TekaKataAdapter(broadcaster, ctx),
    MATEMATIKA: new MatematikaAdapter(broadcaster, ctx),
    MATEMATIKA_BATTLE: new MathBattleAdapter(broadcaster, ctx),
    AUTO_BATTLE: new AutoBattleAdapter(broadcaster, ctx),
  } as const;
}

export type GameAdapters = ReturnType<typeof createGameAdapters>;

/** Mounts every game module's host + admin HTTP API. */
export function mountGameRoutes(app: Express, manager: GameSessionManager): void {
  app.use("/api/puzzle", tebakKataRouter(manager));
  app.use("/api/admin/teka-kata", tekaKataAdminRouter(manager));
  app.use("/api/admin", tebakKataAdminRouter(manager));
  app.use("/api/teka-kata", tekaKataRouter(manager));
  app.use("/api/matematika", matematikaRouter(manager));
  app.use("/api/math-battle", mathBattleRouter(manager));
  app.use("/api/battle", autoBattleRouter(manager));
  app.use("/api/battle", autoBattleMappingRouter(manager));
}
