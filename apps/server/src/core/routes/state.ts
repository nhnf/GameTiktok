import { Router } from "express";
import { requireHostAuth } from "../auth.js";
import type { GameSessionManager } from "../session/sessionManager.js";

export function stateRouter(manager: GameSessionManager): Router {
  const router = Router();

  router.get("/public", (_req, res) => {
    res.json(manager.getPublicState());
  });

  router.get("/host", requireHostAuth, (_req, res) => {
    res.json(manager.getHostState());
  });

  return router;
}
