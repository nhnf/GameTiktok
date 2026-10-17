import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireHostAuth } from "../auth.js";
import { asyncRoute } from "../http.js";

const giftInput = z.object({
  giftId: z.string().trim().min(1),
  giftName: z.string().trim().min(1),
  effect: z.literal("REVEAL_NEXT_LETTER").default("REVEAL_NEXT_LETTER"),
  enabled: z.boolean().optional().default(true),
});

/** Admin → Gift LIVE: gifts that open a letter in the word games (Tebak Kata / Susun Kata). */
export function wordGiftsRouter(): Router {
  const router = Router();
  router.use(requireHostAuth);

  router.get(
    "/",
    asyncRoute(async (_req, res) => {
      res.json(await prisma.giftConfig.findMany({ orderBy: { giftName: "asc" } }));
    }),
  );

  router.post(
    "/",
    asyncRoute(async (req, res) => {
      const parsed = giftInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Gift ID dan nama gift wajib diisi." });
      res.status(201).json(await prisma.giftConfig.create({ data: parsed.data }));
    }),
  );

  router.put(
    "/:id",
    asyncRoute(async (req, res) => {
      const parsed = giftInput.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Data gift tidak valid." });
      res.json(await prisma.giftConfig.update({ where: { id: req.params.id }, data: parsed.data }));
    }),
  );

  router.delete(
    "/:id",
    asyncRoute(async (req, res) => {
      await prisma.giftConfig.deleteMany({ where: { id: req.params.id } });
      res.status(204).end();
    }),
  );

  return router;
}
