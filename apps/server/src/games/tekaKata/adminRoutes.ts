import { Router } from "express";
import { z } from "zod";
import { normalizeTekaKataWord } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";
import { requireHostAuth } from "../../core/auth.js";
import { asyncRoute, numberParam } from "../../core/http.js";
import type { GameSessionManager } from "../../core/session/sessionManager.js";
import { importTekaKataRows, parseTekaKataCsv } from "./csvImport.js";

const difficultySchema = z.enum(["easy", "medium", "hard", "boss"]);
const categoryInput = z.object({
  name: z.string().trim().min(1).max(40),
  description: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});
const wordInput = z.object({
  word: z.string().min(1).max(40),
  categoryId: z.string().min(1),
  difficulty: difficultySchema,
  minimumLength: z.number().int().optional(),
  maximumLength: z.number().int().optional(),
  isAllowed: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
});

/** Admin → Susun Kata: categories, word bank, CSV import, puzzle history (mounted under /api/admin/teka-kata). */
export function tekaKataAdminRouter(manager: GameSessionManager): Router {
  const router = Router();
  router.use(requireHostAuth);
  const refresh = () => manager.getTekaKataAdapter().refreshCaches();

  router.get(
    "/categories",
    asyncRoute(async (_req, res) => {
      res.json(await prisma.tekaKataCategory.findMany({ orderBy: { name: "asc" } }));
    }),
  );

  router.post(
    "/categories",
    asyncRoute(async (req, res) => {
      const parsed = categoryInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Nama kategori wajib diisi." });
      res.status(201).json(await prisma.tekaKataCategory.create({ data: parsed.data }));
      await refresh();
    }),
  );

  router.put(
    "/categories/:id",
    asyncRoute(async (req, res) => {
      const parsed = categoryInput.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data kategori tidak valid." });
      res.json(await prisma.tekaKataCategory.update({ where: { id: req.params.id }, data: parsed.data }));
      await refresh();
    }),
  );

  router.delete(
    "/categories/:id",
    asyncRoute(async (req, res) => {
      await prisma.tekaKataCategory.delete({ where: { id: req.params.id } });
      await refresh();
      res.status(204).end();
    }),
  );

  router.get(
    "/words",
    asyncRoute(async (req, res) => {
      const { difficulty, categoryId, search } = req.query;
      res.json(
        await prisma.tekaKataWord.findMany({
          where: {
            difficulty: typeof difficulty === "string" && difficulty ? difficulty : undefined,
            categoryId: typeof categoryId === "string" && categoryId ? categoryId : undefined,
            word: typeof search === "string" && search.trim() ? { contains: normalizeTekaKataWord(search) } : undefined,
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
      const word = normalizeTekaKataWord(parsed.data.word);
      if (!/^[A-Z]{3,12}$/.test(word)) return res.status(400).json({ error: "Kata harus 3–12 huruf A–Z." });
      const created = await prisma.tekaKataWord.create({
        data: {
          ...parsed.data,
          word,
          normalizedWord: word,
          minimumLength: parsed.data.minimumLength ?? word.length,
          maximumLength: parsed.data.maximumLength ?? word.length,
        },
      });
      await refresh();
      res.status(201).json(created);
    }),
  );

  router.put(
    "/words/:id",
    asyncRoute(async (req, res) => {
      const parsed = wordInput.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data kata tidak valid." });
      const word = parsed.data.word ? normalizeTekaKataWord(parsed.data.word) : undefined;
      if (word !== undefined && !/^[A-Z]{3,12}$/.test(word)) return res.status(400).json({ error: "Kata harus 3–12 huruf A–Z." });
      const updated = await prisma.tekaKataWord.update({
        where: { id: req.params.id },
        data: { ...parsed.data, word, normalizedWord: word },
      });
      await refresh();
      res.json(updated);
    }),
  );

  router.delete(
    "/words/:id",
    asyncRoute(async (req, res) => {
      await prisma.tekaKataWord.delete({ where: { id: req.params.id } });
      await refresh();
      res.status(204).end();
    }),
  );

  router.post(
    "/words/bulk",
    asyncRoute(async (req, res) => {
      const { ids, action, isActive } = (req.body ?? {}) as { ids?: unknown; action?: unknown; isActive?: unknown };
      if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
        return res.status(400).json({ error: "Pilih minimal satu kata." });
      }
      if (action === "delete") await prisma.tekaKataWord.deleteMany({ where: { id: { in: ids } } });
      else if (action === "toggle") {
        await prisma.tekaKataWord.updateMany({ where: { id: { in: ids } }, data: { isActive: isActive !== false } });
      } else return res.status(400).json({ error: "Aksi tidak dikenal." });
      await refresh();
      res.json({ ok: true, count: ids.length });
    }),
  );

  router.post(
    "/import-csv",
    asyncRoute(async (req, res) => {
      const { csvContent, dryRun } = (req.body ?? {}) as { csvContent?: unknown; dryRun?: unknown };
      if (typeof csvContent !== "string" || !csvContent.trim()) return res.status(400).json({ error: "Isi CSV kosong." });
      const { rows, errors } = await parseTekaKataCsv(csvContent);
      if (dryRun) {
        return res.json({ preview: rows.slice(0, 50), totalValid: rows.length, totalErrors: errors.length, errors });
      }
      const importedCount = await importTekaKataRows(rows);
      await refresh();
      res.json({ ok: true, importedCount, errors });
    }),
  );

  router.get(
    "/history",
    asyncRoute(async (req, res) => {
      const puzzles = await prisma.tekaKataPuzzle.findMany({
        take: numberParam(req.query.limit, 20, 1, 100),
        orderBy: { createdAt: "desc" },
        include: { category: true, words: { include: { foundBy: true } } },
      });
      res.json(puzzles);
    }),
  );

  return router;
}
