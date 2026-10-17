import { Router } from "express";
import { requireHostAuth } from "../../core/auth.js";
import { prisma } from "../../core/db.js";
import { asyncRoute, numberParam } from "../../core/http.js";
import { getGiftCatalog } from "../../core/live/giftCatalog.js";
import type { GameSessionManager } from "../../core/session/sessionManager.js";
import { battleMappings } from "./mappings.js";
import { checkMappingConflicts, mappingInput } from "./schemas.js";

/** Admin → Auto Battle → Gift → Pasukan: mapping CRUD, TikTok gift catalog, detected gifts. */
export function autoBattleMappingRouter(manager: GameSessionManager): Router {
  const router = Router();
  router.use(requireHostAuth);
  const battle = () => manager.getAutoBattleAdapter();
  const afterChange = async () => {
    await battle().reloadMappings();
    void battle().enrichMappings();
    manager.broadcastFullState();
  };

  router.get(
    "/mappings",
    asyncRoute(async (_req, res) => {
      await battle().initialize();
      res.json(await battle().reloadMappings());
    }),
  );

  router.post(
    "/mappings",
    asyncRoute(async (req, res) => {
      const parsed = mappingInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data mapping tidak valid (nama gift, tim, unit, jumlah 1–50)." });
      const conflict = await checkMappingConflicts(parsed.data);
      if (conflict) return res.status(409).json({ error: conflict });
      const row = await prisma.battleGiftMapping.create({ data: parsed.data });
      await afterChange();
      res.status(201).json(row);
    }),
  );

  router.put(
    "/mappings/:id",
    asyncRoute(async (req, res) => {
      const existing = await prisma.battleGiftMapping.findUnique({ where: { id: req.params.id } });
      if (!existing) return res.status(404).json({ error: "Mapping tidak ditemukan." });
      const parsed = mappingInput.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data mapping tidak valid." });
      const merged = mappingInput.parse({ ...existing, ...parsed.data });
      const conflict = await checkMappingConflicts(merged, existing.id);
      if (conflict) return res.status(409).json({ error: conflict });
      const row = await prisma.battleGiftMapping.update({ where: { id: existing.id }, data: merged });
      await afterChange();
      res.json(row);
    }),
  );

  router.delete(
    "/mappings/:id",
    asyncRoute(async (req, res) => {
      await prisma.battleGiftMapping.deleteMany({ where: { id: req.params.id } });
      await battle().reloadMappings();
      manager.broadcastFullState();
      res.status(204).end();
    }),
  );

  router.post(
    "/mappings/reset-defaults",
    asyncRoute(async (_req, res) => {
      await battleMappings.resetDefaults();
      await afterChange();
      res.json(battle().getMappings());
    }),
  );

  router.get(
    "/gift-catalog",
    asyncRoute(async (req, res) => {
      const q = String(req.query.q ?? "").trim().toLowerCase();
      const limit = numberParam(req.query.limit, 60, 1, 300);
      const catalog = await getGiftCatalog();
      const hits = q ? catalog.filter((g) => g.name.toLowerCase().includes(q) || g.id === q) : catalog;
      res.json({ total: catalog.length, gifts: hits.slice(0, limit) });
    }),
  );

  router.post(
    "/gift-catalog/refresh",
    asyncRoute(async (_req, res) => {
      const catalog = await getGiftCatalog(true);
      await battle().enrichMappings();
      res.json({ total: catalog.length });
    }),
  );

  router.get(
    "/seen-gifts",
    asyncRoute(async (_req, res) => {
      res.json(await prisma.seenGift.findMany({ orderBy: { lastSeenAt: "desc" }, take: 200 }));
    }),
  );

  router.delete(
    "/seen-gifts",
    asyncRoute(async (_req, res) => {
      await prisma.seenGift.deleteMany({});
      res.status(204).end();
    }),
  );

  return router;
}
