import { Router } from "express";
import { nanoid } from "nanoid";
import { DEFAULT_BATTLE_CONFIG, type BattleConfig } from "@tebak-kata/shared";
import { requireHostAuth } from "../../core/auth.js";
import { prisma } from "../../core/db.js";
import { asyncRoute, numberParam } from "../../core/http.js";
import type { GameSessionManager } from "../../core/session/sessionManager.js";
import { configInput, testGiftInput } from "./schemas.js";

/** Auto Battle Arena host API (PRD §32–36): match control, config, test gifts, history. */
export function autoBattleRouter(manager: GameSessionManager): Router {
  const router = Router();
  router.use(requireHostAuth);
  const battle = () => manager.getAutoBattleAdapter();

  const control = (action: () => unknown) =>
    asyncRoute(async (_req, res) => {
      if (manager.getActiveGame() !== "AUTO_BATTLE") throw new Error("Game aktif bukan Auto Battle.");
      await battle().initialize();
      action();
      res.json(manager.getHostState());
    });

  router.post("/match/start", control(() => battle().startMatch()));
  router.post("/match/end", control(() => battle().endMatch()));
  router.post("/match/reset", control(() => battle().resetMatch()));
  router.post("/match/pause", control(() => battle().pauseMatch()));
  router.post("/match/resume", control(() => battle().resumeMatch()));

  router.get("/gift-log", (_req, res) => {
    res.json(battle().getGiftLog());
  });

  router.get(
    "/config",
    asyncRoute(async (_req, res) => {
      await battle().initialize();
      res.json(battle().getConfig());
    }),
  );

  router.put(
    "/config",
    asyncRoute(async (req, res) => {
      const parsed = configInput.safeParse(req.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return res.status(400).json({ error: `Pengaturan tidak valid: ${issue.path.join(".")} — ${issue.message}` });
      }
      res.json(await battle().updateConfig(parsed.data as Partial<BattleConfig>));
    }),
  );

  router.post(
    "/config/reset",
    asyncRoute(async (_req, res) => {
      await prisma.battleSetting.deleteMany({ where: { id: "default" } });
      res.json(await battle().updateConfig(DEFAULT_BATTLE_CONFIG));
    }),
  );

  // Test gift: same code path as a real TikTok gift.
  router.post(
    "/test-gift",
    asyncRoute(async (req, res) => {
      const parsed = testGiftInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data gift tes tidak valid." });
      if (!manager.isLive()) return res.status(409).json({ error: "Sesi LIVE belum aktif. Mulai sesi dulu di Host Dashboard." });
      if (manager.getActiveGame() !== "AUTO_BATTLE") return res.status(409).json({ error: "Game aktif bukan Auto Battle. Ganti game dulu." });
      const { mappingId, username, count } = parsed.data;
      let { giftId, giftName } = parsed.data;
      if (mappingId) {
        const m = battle().getMappings().find((x) => x.id === mappingId);
        if (!m) return res.status(404).json({ error: "Mapping tidak ditemukan." });
        giftId = m.giftId ?? `name:${m.giftName}`;
        giftName = m.giftName;
      }
      if (!giftId && !giftName) return res.status(400).json({ error: "Isi giftId, giftName, atau mappingId." });
      await manager.applyGift({
        platformUserId: `test-${username.toLowerCase()}`,
        username,
        giftId: giftId ?? `name:${giftName}`,
        giftName,
        count,
        diamondCount: 1,
        comboEnded: true,
        eventId: `test:${nanoid()}`,
      });
      res.json({ log: battle().getGiftLog()[0] ?? null });
    }),
  );

  router.get(
    "/history",
    asyncRoute(async (req, res) => {
      const matches = await prisma.battleMatch.findMany({
        where: { status: "ENDED" },
        orderBy: { startedAt: "desc" },
        take: numberParam(req.query.limit, 20, 1, 100),
        include: { contributions: { orderBy: { score: "desc" }, take: 5 } },
      });
      res.json(matches.map(({ resultJson: _r, ...m }) => m));
    }),
  );

  return router;
}
