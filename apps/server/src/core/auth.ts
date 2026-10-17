import type { NextFunction, Request, Response } from "express";
import { env } from "./env.js";

/**
 * PRD section 49 — Security Architecture: "Host API: Authenticated".
 * Minimal bearer-token guard for V1. Swap for real session auth when the
 * admin/host login flow is designed.
 */
export function requireHostAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (token !== env.hostToken) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  next();
}
