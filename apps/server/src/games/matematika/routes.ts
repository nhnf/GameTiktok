import { Router } from "express";
import { sanitizeMathConfig, type MathConfig } from "@tebak-kata/shared";
import { requireHostAuth } from "../../core/auth.js";
import { asyncRoute, numberParam } from "../../core/http.js";
import type { GameSessionManager } from "../../core/session/sessionManager.js";
import { mathStore } from "./persistence.js";

const CONFIG_KEYS: (keyof MathConfig)[] = [
  "durationSeconds",
  "minNumber",
  "maxNumber",
  "operationMode",
  "allowNegative",
  "autoNext",
  "minPoints",
  "firstPlacePoints",
  "rankPoints",
  "rank10PlusPoints",
];

function pickConfig(body: unknown): Partial<MathConfig> {
  const input = (body ?? {}) as Record<string, unknown>;
  return Object.fromEntries(CONFIG_KEYS.filter((k) => input[k] !== undefined).map((k) => [k, input[k]])) as Partial<MathConfig>;
}

/** Host endpoints for Matematika LIVE (PRD 32–38). */
export function matematikaRouter(manager: GameSessionManager): Router {
  const router = Router();
  router.use(requireHostAuth);
  const game = () => manager.getMatematikaAdapter();
  const guardLive = () => {
    if (manager.getActiveGame() !== "MATEMATIKA") throw new Error("Game aktif bukan Matematika.");
    if (!manager.isLive()) throw new Error("Sesi LIVE belum berjalan.");
  };
  const saveConfig = (body: unknown) =>
    manager.updateSettings({ matematika: sanitizeMathConfig({ ...game().getConfig(), ...pickConfig(body) }) });

  router.post(
    "/generate",
    asyncRoute(async (req, res) => {
      guardLive();
      saveConfig(req.body);
      const question = await game().generateQuestion();
      res.json({ ok: true, question, hostState: manager.getHostState() });
    }),
  );

  router.post(
    "/start",
    asyncRoute(async (_req, res) => {
      guardLive();
      await game().startQuestion();
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/reveal",
    asyncRoute(async (_req, res) => {
      guardLive();
      await game().revealAnswer();
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/skip",
    asyncRoute(async (_req, res) => {
      guardLive();
      await game().skipQuestion();
      res.json(manager.getHostState());
    }),
  );

  router.post(
    "/config",
    asyncRoute(async (req, res) => {
      saveConfig(req.body);
      res.json({ ok: true, config: game().getConfig() });
    }),
  );

  router.get(
    "/history",
    asyncRoute(async (req, res) => {
      res.json(await mathStore.history(numberParam(req.query.limit, 20, 1, 100)));
    }),
  );

  return router;
}
