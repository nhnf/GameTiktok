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

  router.get(
    "/champions/export",
    asyncRoute(async (_req, res) => {
      const data = await manager.exportSessionsForChampions();
      res.json(data);
    }),
  );

  router.post(
    "/champions/import-merge",
    asyncRoute(async (req, res) => {
      const body = req.body;
      if (!body || !Array.isArray(body.sessions)) {
        res.status(400).json({ error: "Format data tidak valid. File harus berisi data sesi." });
        return;
      }
      const result = await manager.importAndMergeSessions(body);
      res.json({ ...manager.getHostState(), mergeResult: result });
    }),
  );

  router.post(
    "/gift-goal",
    asyncRoute(async (req, res) => {
      const targetCoins = numberParam((req.body as { targetCoins?: unknown })?.targetCoins, 0, 1, 100000);
      if (targetCoins <= 0) {
        res.status(400).json({ error: "Target koin tidak valid (minimal 1 koin)." });
        return;
      }
      manager.setGiftGoalCoins(targetCoins);
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/timer-rate",
    asyncRoute(async (req, res) => {
      const secondsPerCoin = numberParam((req.body as { secondsPerCoin?: unknown })?.secondsPerCoin, 0, 0, 3600);
      manager.setLiveTimerSecondsPerCoin(secondsPerCoin);
      res.json(manager.getHostState());
    }),
  );

  return router;
}
