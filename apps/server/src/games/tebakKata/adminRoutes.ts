import { Router } from "express";
import { z } from "zod";
import { normalizeGuess } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";
import { requireHostAuth } from "../../core/auth.js";
import { asyncRoute } from "../../core/http.js";
import type { GameSessionManager } from "../../core/session/sessionManager.js";
import { copyTekaKataWordsToTebakKata } from "./syncWords.js";

const difficultySchema = z.enum(["easy", "medium", "hard", "boss"]);
const categoryInput = z.object({ name: z.string().trim().min(1).max(40), emoji: z.string().trim().min(1).max(8) });
const wordInput = z.object({
  word: z.string().min(1).max(40),
  categoryId: z.string().min(1),
  difficulty: difficultySchema,
  isActive: z.boolean().optional().default(true),
});

/** Admin → Tebak Kata: categories and word bank (mounted under /api/admin). */
export function tebakKataAdminRouter(manager: GameSessionManager): Router {
  const router = Router();
  router.use(requireHostAuth);
  const refresh = () => manager.getTebakKataAdapter().refreshCaches();

  router.get(
    "/categories",
    asyncRoute(async (_req, res) => {
      res.json(await prisma.category.findMany({ orderBy: { name: "asc" } }));
    }),
  );

  router.post(
    "/categories",
    asyncRoute(async (req, res) => {
      const parsed = categoryInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Nama dan emoji kategori wajib diisi." });
      res.status(201).json(await prisma.category.create({ data: parsed.data }));
      await refresh();
    }),
  );

  router.put(
    "/categories/:id",
    asyncRoute(async (req, res) => {
      const parsed = categoryInput.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data kategori tidak valid." });
      res.json(await prisma.category.update({ where: { id: req.params.id }, data: parsed.data }));
      await refresh();
    }),
  );

  router.delete(
    "/categories/:id",
    asyncRoute(async (req, res) => {
      await prisma.category.delete({ where: { id: req.params.id } });
      await refresh();
      res.status(204).end();
    }),
  );

  router.get(
    "/words",
    asyncRoute(async (req, res) => {
      const { difficulty, categoryId } = req.query;
      res.json(
        await prisma.word.findMany({
          where: {
            difficulty: typeof difficulty === "string" && difficulty ? difficulty : undefined,
            categoryId: typeof categoryId === "string" && categoryId ? categoryId : undefined,
          },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        }),
      );
    }),
  );

  router.post(
    "/words",
    asyncRoute(async (req, res) => {
      const parsed = wordInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Kata, kategori, dan tingkat kesulitan wajib diisi." });
      const word = normalizeGuess(parsed.data.word);
      if (word.length < 2) return res.status(400).json({ error: "Kata minimal 2 huruf." });
      res.status(201).json(await prisma.word.create({ data: { ...parsed.data, word } }));
      await refresh();
    }),
  );

  router.post(
    "/words/sync-from-susun-kata",
    asyncRoute(async (_req, res) => {
      const copiedCount = await copyTekaKataWordsToTebakKata();
      await refresh();
      res.json({ ok: true, copiedCount });
    }),
  );

  router.put(
    "/words/:id",
    asyncRoute(async (req, res) => {
      const parsed = wordInput.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data kata tidak valid." });
      const data = { ...parsed.data, word: parsed.data.word ? normalizeGuess(parsed.data.word) : undefined };
      res.json(await prisma.word.update({ where: { id: req.params.id }, data }));
      await refresh();
    }),
  );

  router.delete(
    "/words/:id",
    asyncRoute(async (req, res) => {
      await prisma.word.delete({ where: { id: req.params.id } });
      await refresh();
      res.status(204).end();
    }),
  );

  return router;
}
