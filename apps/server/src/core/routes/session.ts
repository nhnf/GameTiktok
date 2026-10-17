import { Router } from "express";
import { isGameType } from "@tebak-kata/shared";
import { requireHostAuth } from "../auth.js";
import { asyncRoute, numberParam } from "../http.js";
import type { LiveAdapter } from "../live/liveAdapter.js";
import type { GameSessionManager } from "../session/sessionManager.js";

/** PRD section 23 & 30 — START / PAUSE / RESUME / END LIVE, SWITCH GAME, ADD TIME. */
export function sessionRouter(manager: GameSessionManager, adapter: LiveAdapter): Router {
  const router = Router();
  router.use(requireHostAuth);

  const liveSourceEnabled = () => manager.getSettings().mockTikTokEnabled;

  router.post(
    "/start",
    asyncRoute(async (req, res) => {
      const { tiktokUsername, ...overrides } = (req.body ?? {}) as Record<string, unknown>;
      if (typeof tiktokUsername === "string" && tiktokUsername.trim()) {
        adapter.configure?.({ username: tiktokUsername });
      }
      await manager.startSession(overrides);
      if (liveSourceEnabled()) {
        try {
          await adapter.start();
        } catch (err) {
          // The session itself is fine; tell the host why no comments will arrive.
          res.status(201).json({ ...manager.getHostState(), warning: (err as Error).message });
          return;
        }
      }
      res.status(201).json(manager.getHostState());
    }),
  );

  router.post(
    "/pause",
    asyncRoute(async (_req, res) => {
      await manager.pauseSession();
      if (!adapter.keepAliveOnPause) adapter.stop();
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/resume",
    asyncRoute(async (_req, res) => {
      await manager.resumeSession();
      if (liveSourceEnabled()) await adapter.start();
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/end",
    asyncRoute(async (_req, res) => {
      const summary = await manager.endSession("HOST");
      res.json(summary);
    }),
  );

  router.post(
    "/switch-game",
    asyncRoute(async (req, res) => {
      const { gameType, settings } = (req.body ?? {}) as { gameType?: unknown; settings?: Record<string, unknown> };
      if (!isGameType(gameType)) {
        res.status(400).json({ error: "Game tidak dikenal." });
        return;
      }
      await manager.switchGame(gameType, settings);
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/add-time",
    asyncRoute(async (req, res) => {
      const seconds = numberParam((req.body as { seconds?: unknown })?.seconds, 0, 0, 24 * 3600);
      if (seconds <= 0) {
        res.status(400).json({ error: "Jumlah detik tidak valid." });
        return;
      }
      manager.addLiveTimerSeconds(seconds);
      res.json(manager.getHostState());
    }),
  );

  router.delete(
    "/champions/:userId",
    asyncRoute(async (req, res) => {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "userId tidak valid." });
        return;
      }
      await manager.removeChampion(userId);
      res.json(manager.getHostState());
    }),
  );

  return router;
}
