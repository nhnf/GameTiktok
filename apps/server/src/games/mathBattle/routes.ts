import { Router } from "express";
import { z } from "zod";
import { requireHostAuth } from "../../core/auth.js";
import { prisma } from "../../core/db.js";
import { asyncRoute, numberParam } from "../../core/http.js";
import type { GameSessionManager } from "../../core/session/sessionManager.js";
import { mathBattleStore } from "./persistence.js";

const team = z.enum(["BLUE", "RED"]);
const configInput = z
  .object({
    totalRounds: z.number().int().min(1).max(50),
    roundDurationSeconds: z.number().int().min(3).max(120),
    difficulty: z.enum(["easy", "normal", "hard", "extreme"]),
    operators: z.array(z.enum(["+", "-"])).min(1),
    assignmentMode: z.enum(["COMMENT", "RANDOM", "HOST"]),
    minRopeMovement: z.number().int().min(0).max(100),
    maxRopeMovement: z.number().int().min(1).max(200),
    winLineDistance: z.number().int().min(10).max(1000),
    streakEnabled: z.boolean(),
    powerDisplayEnabled: z.boolean(),
    playerCountEnabled: z.boolean(),
    giftNotificationEnabled: z.boolean(),
    soundEnabled: z.boolean(),
    giftSmallPower: z.number().int().min(0),
    giftMediumPower: z.number().int().min(0),
    giftLargePower: z.number().int().min(0),
  })
  .partial();
const giftInput = z.object({
  id: z.string().optional(),
  giftId: z.string().trim().max(40).nullable().optional().transform((v) => (v ? v : null)),
  giftName: z.string().trim().min(1).max(60),
  team: z.enum(["BLUE", "RED", "NEUTRAL"]),
  tier: z.enum(["SMALL", "MEDIUM", "LARGE", "NEUTRAL"]),
  power: z.number().int().min(0).max(100000),
  enabled: z.boolean().optional().default(true),
  imageUrl: z.string().max(500).nullable().optional(),
  diamondCount: z.number().int().min(0).nullable().optional(),
});

/** Host + admin API for Matematika Tarik Tambang LIVE. */
export function mathBattleRouter(manager: GameSessionManager): Router {
  const router = Router();
  router.use(requireHostAuth);
  const game = () => manager.getMathBattleAdapter();
  const guardLive = () => {
    if (manager.getActiveGame() !== "MATEMATIKA_BATTLE") throw new Error("Game aktif bukan Tarik Tambang.");
    if (manager.getStatus() !== "ACTIVE") throw new Error("Sesi LIVE belum berjalan (atau sedang dijeda).");
  };
  const control = (action: () => unknown | Promise<unknown>) =>
    asyncRoute(async (_req, res) => {
      guardLive();
      await action();
      res.json(manager.getHostState());
    });

  router.post("/start", control(() => game().startMatch()));
  router.post("/next-round", control(() => game().skipAhead()));
  router.post("/pause", control(() => game().pauseMatch()));
  router.post("/resume", control(() => game().resumeMatch()));
  router.post(
    "/end",
    asyncRoute(async (req, res) => {
      guardLive();
      const winner = (req.body as { winner?: unknown })?.winner;
      const parsed = z.enum(["BLUE", "RED", "DRAW"]).optional().safeParse(winner);
      await game().endMatch("HOST", parsed.success ? parsed.data : undefined);
      res.json(manager.getHostState());
    }),
  );
  router.post(
    "/reset",
    asyncRoute(async (_req, res) => {
      game().resetMatch();
      manager.broadcastFullState();
      res.json(manager.getHostState());
    }),
  );
  router.post(
    "/move-player",
    asyncRoute(async (req, res) => {
      const parsed = z.object({ userId: z.string().min(1), team }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "userId dan team wajib diisi." });
      game().movePlayer(parsed.data.userId, parsed.data.team);
      res.json(manager.getHostState());
    }),
  );

  router.get("/config", (_req, res) => {
    res.json(game().getConfig());
  });
  router.put(
    "/config",
    asyncRoute(async (req, res) => {
      const parsed = configInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Pengaturan Tarik Tambang tidak valid." });
      const config = await game().saveConfig(parsed.data);
      res.json({ ok: true, config });
    }),
  );

  router.get(
    "/gifts",
    asyncRoute(async (_req, res) => {
      res.json(await mathBattleStore.loadMappings());
    }),
  );
  router.post(
    "/gifts",
    asyncRoute(async (req, res) => {
      const parsed = giftInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data gift tidak valid (nama, tim, tier, power)." });
      const { id, ...data } = parsed.data;
      const row = id
        ? await prisma.mathBattleGiftMapping.update({ where: { id }, data })
        : await prisma.mathBattleGiftMapping.create({ data });
      await game().reloadMappings();
      res.json(row);
    }),
  );
  router.post(
    "/gifts/reset-defaults",
    asyncRoute(async (_req, res) => {
      await mathBattleStore.resetMappings();
      await game().reloadMappings();
      res.json(game().getMappings());
    }),
  );
  router.delete(
    "/gifts/:id",
    asyncRoute(async (req, res) => {
      await prisma.mathBattleGiftMapping.deleteMany({ where: { id: req.params.id } });
      await game().reloadMappings();
      res.json({ ok: true });
    }),
  );

  router.get(
    "/history",
    asyncRoute(async (req, res) => {
      const page = numberParam(req.query.page, 1, 1, 10_000);
      const limit = numberParam(req.query.limit, 10, 1, 50);
      const [items, total] = await mathBattleStore.history(page, limit);
      res.json({ items, total, page, limit });
    }),
  );

  return router;
}
