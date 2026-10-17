import { Router } from "express";
import { env } from "../env.js";

/** Public, non-sensitive — lets the Host Dashboard know whether to show a TikTok username field. */
export function configRouter(): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ liveSource: env.liveSource, tiktokUsername: env.liveSource === "tiktok" ? (env.tiktokUsername ?? null) : null });
  });

  return router;
}
