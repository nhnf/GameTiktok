import { Router } from "express";
import type { TekaKataConfig } from "@tebak-kata/shared";
import { requireHostAuth } from "../../core/auth.js";
import { asyncRoute } from "../../core/http.js";
import type { GameSessionManager } from "../../core/session/sessionManager.js";

const CONFIG_KEYS: (keyof TekaKataConfig)[] = [
  "difficulty",
  "categoryId",
  "wordCount",
  "minWordLength",
  "maxWordLength",
  "autoGenerateNext",
  "allowGiftReveal",
];

function pickConfig(body: unknown): Partial<TekaKataConfig> {
  const input = (body ?? {}) as Record<string, unknown>;
  return Object.fromEntries(CONFIG_KEYS.filter((k) => input[k] !== undefined).map((k) => [k, input[k]])) as Partial<TekaKataConfig>;
}

/** Host endpoints for Susun Kata (PRD 32: generate, start, reveal letter/word, skip, config). */
export function tekaKataRouter(manager: GameSessionManager): Router {
  const router = Router();
  router.use(requireHostAuth);
  const game = () => manager.getTekaKataAdapter();
  const guardLive = () => {
    if (manager.getActiveGame() !== "TEKA_KATA") throw new Error("Game aktif bukan Susun Kata.");
    if (!manager.isLive()) throw new Error("Sesi LIVE belum berjalan.");
  };

  router.post(
    "/generate",
    asyncRoute(async (req, res) => {
      guardLive();
      manager.updateSettings({ tekaKata: { ...game().getConfig(), ...pickConfig(req.body) } });
      const puzzle = await game().generatePuzzle();
      res.json({ ok: true, puzzle, hostState: manager.getHostState() });
    }),
  );

  router.post(
    "/start",
    asyncRoute(async (_req, res) => {
      guardLive();
      await game().startPuzzle();
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/reveal-letter",
    asyncRoute(async (_req, res) => {
      guardLive();
      await game().revealLetter("HOST");
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/reveal-word",
    asyncRoute(async (req, res) => {
      guardLive();
      const { wordId } = (req.body ?? {}) as { wordId?: string };
      await game().revealWord(typeof wordId === "string" ? wordId : undefined);
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/skip",
    asyncRoute(async (_req, res) => {
      guardLive();
      await game().skipPuzzle();
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/config",
    asyncRoute(async (req, res) => {
      manager.updateSettings({ tekaKata: { ...game().getConfig(), ...pickConfig(req.body) } });
      res.json({ ok: true, config: game().getConfig() });
    }),
  );

  return router;
}
