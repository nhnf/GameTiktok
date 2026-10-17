import { Router } from "express";
import { z } from "zod";
import { GAME_TYPES, MATH_OPERATION_MODES, sanitizeMathConfig, type GameType, type MathConfig } from "@tebak-kata/shared";
import { requireHostAuth } from "../auth.js";
import { asyncRoute } from "../http.js";
import type { LiveAdapter } from "../live/liveAdapter.js";
import type { GameSessionManager } from "../session/sessionManager.js";

const difficulty = z.enum(["easy", "medium", "hard", "boss"]);

const settingsInput = z.object({
  scoring: z
    .object({ easy: z.number().int().min(1), medium: z.number().int().min(1), hard: z.number().int().min(1), boss: z.number().int().min(1) })
    .partial()
    .optional(),
  bossEveryNWords: z.number().int().min(1).max(1000).optional(),
  antiRepeatWindow: z.number().int().min(0).max(10000).optional(),
  mockTikTokEnabled: z.boolean().optional(),
  activeGame: z.enum(GAME_TYPES as [GameType, ...GameType[]]).optional(),
  tekaKata: z
    .object({
      difficulty: z.union([difficulty, z.literal("random")]),
      categoryId: z.string().nullable(),
      wordCount: z.number().int().min(2).max(50),
      minWordLength: z.number().int().min(3).max(12),
      maxWordLength: z.number().int().min(3).max(12),
      autoGenerateNext: z.boolean(),
      allowGiftReveal: z.boolean(),
    })
    .partial()
    .optional(),
  matematika: z
    .object({
      durationSeconds: z.number().int().min(3).max(120),
      minNumber: z.number().int().min(0).max(999),
      maxNumber: z.number().int().min(1).max(999),
      operationMode: z.enum(MATH_OPERATION_MODES),
      allowNegative: z.boolean(),
      autoNext: z.boolean(),
      minPoints: z.number().int().min(0),
      firstPlacePoints: z.number().int().min(1),
      rankPoints: z.array(z.number().int().min(0).max(1000)).max(9),
      rank10PlusPoints: z.number().int().min(0).max(1000),
    })
    .partial()
    .optional(),
  liveTimer: z
    .object({
      enabled: z.boolean(),
      initialMinutes: z.number().int().min(1).max(24 * 60).optional(),
      secondsPerCoin: z.number().int().min(0).max(3600).optional(),
    })
    .optional(),
});

/** Admin → Pengaturan (PRD 13.2: scoring "dapat diubah melalui konfigurasi admin"). */
export function settingsRouter(manager: GameSessionManager, adapter: LiveAdapter): Router {
  const router = Router();
  router.use(requireHostAuth);

  router.get("/", (_req, res) => {
    res.json(manager.getSettings());
  });

  router.put(
    "/",
    asyncRoute(async (req, res) => {
      const parsed = settingsInput.safeParse(req.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return res.status(400).json({ error: `Pengaturan tidak valid: ${issue.path.join(".")} — ${issue.message}` });
      }
      const data = parsed.data;
      const current = manager.getSettings();
      const matematika = data.matematika
        ? sanitizeMathConfig({ ...(current.matematika as MathConfig), ...data.matematika })
        : undefined;
      if (data.activeGame && data.activeGame !== manager.getActiveGame()) {
        await manager.switchGame(data.activeGame);
      }
      const settings = manager.updateSettings({
        ...data,
        scoring: data.scoring ? { ...current.scoring, ...data.scoring } : undefined,
        matematika,
        activeGame: undefined,
      });

      if (data.mockTikTokEnabled === false) adapter.stop();
      if (data.mockTikTokEnabled === true && manager.isLive()) {
        await adapter.start().catch((err: unknown) => console.error("[settings] live source start failed:", err));
      }
      res.json(settings);
    }),
  );

  return router;
}
