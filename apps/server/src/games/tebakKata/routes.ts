import { Router } from "express";
import { requireHostAuth } from "../../core/auth.js";
import { asyncRoute } from "../../core/http.js";
import type { GameSessionManager } from "../../core/session/sessionManager.js";

/** PRD section 18/22/23 — HINT, SKIP, NEW WORD host controls (Tebak Kata). */
export function tebakKataRouter(manager: GameSessionManager): Router {
  const router = Router();
  router.use(requireHostAuth);

  const guard = () => {
    if (manager.getActiveGame() !== "TEBAK_KATA") throw new Error("Game aktif bukan Tebak Kata.");
    if (!manager.isLive()) throw new Error("Sesi LIVE belum berjalan.");
    return manager.getTebakKataAdapter();
  };

  router.post(
    "/hint",
    asyncRoute(async (_req, res) => {
      await guard().hint();
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/skip",
    asyncRoute(async (_req, res) => {
      await guard().skipCurrentPuzzle(true);
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/new",
    asyncRoute(async (_req, res) => {
      await guard().skipCurrentPuzzle(false);
      res.json(manager.getHostState());
    }),
  );

  return router;
}
