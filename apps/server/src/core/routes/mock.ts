import { Router } from "express";
import { z } from "zod";
import { requireHostAuth } from "../auth.js";
import { asyncRoute } from "../http.js";
import type { GameSessionManager } from "../session/sessionManager.js";

const commentInput = z.object({
  platformUserId: z.string().min(1).optional(),
  username: z.string().trim().min(1).max(40),
  rawComment: z.string().min(1).max(300),
});
const giftInput = z.object({
  platformUserId: z.string().min(1).optional(),
  username: z.string().trim().min(1).max(40),
  giftId: z.string().min(1),
  giftName: z.string().optional(),
  count: z.number().int().min(1).max(500).optional(),
  diamondCount: z.number().int().min(1).max(100000).optional(),
});

/**
 * Manual comment/gift injection — lets a host demo or debug exact
 * scenarios without waiting on the simulator. Same code path a real
 * TikTok event hits (`GameSessionManager.handleComment` / `.applyGift`).
 */
export function mockRouter(manager: GameSessionManager): Router {
  const router = Router();
  router.use(requireHostAuth);

  router.post(
    "/comment",
    asyncRoute(async (req, res) => {
      const parsed = commentInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Username dan komentar wajib diisi." });
      if (manager.getStatus() !== "ACTIVE") return res.status(409).json({ error: "Sesi LIVE belum berjalan." });
      const { username, rawComment, platformUserId } = parsed.data;
      await manager.handleComment({ platformUserId: platformUserId ?? `manual-${username}`, username, rawComment });
      res.json({ ok: true });
    }),
  );

  router.post(
    "/gift",
    asyncRoute(async (req, res) => {
      const parsed = giftInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data gift tidak valid." });
      if (!manager.isLive()) return res.status(409).json({ error: "Sesi LIVE belum berjalan." });
      const { username, giftId, platformUserId, giftName, count, diamondCount } = parsed.data;
      await manager.applyGift({
        platformUserId: platformUserId ?? `manual-${username}`,
        username,
        giftId,
        giftName,
        count,
        diamondCount,
        eventId: `manual:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      });
      res.json({ ok: true });
    }),
  );

  return router;
}
