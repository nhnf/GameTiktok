import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Prisma known-request error codes we translate for the host UI. */
const PRISMA_MESSAGES: Record<string, string> = {
  P2002: "Data dengan nilai yang sama sudah ada (duplikat).",
  P2003: "Data masih dipakai oleh data lain, tidak bisa diubah/dihapus.",
  P2025: "Data tidak ditemukan.",
};

/** Human-readable message for any thrown value (never leaks a stack trace). */
export function errorText(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code === "string" && PRISMA_MESSAGES[code]) return PRISMA_MESSAGES[code];
  if (err instanceof Error && err.message) return err.message;
  return "Terjadi kesalahan.";
}

type Handler = (req: Request, res: Response) => unknown | Promise<unknown>;

/**
 * Wraps an async Express 4 handler: a rejected promise becomes a 400 JSON
 * error instead of an unhandled rejection (which would crash the process).
 */
export function asyncRoute(handler: Handler, status = 400): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((err: unknown) => {
        if (res.headersSent) return next(err);
        console.error(`[http] ${req.method} ${req.originalUrl} failed:`, errorText(err));
        res.status(status).json({ error: errorText(err) });
      });
  };
}

/** Reads a finite number from a request value, or returns the fallback. */
export function numberParam(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
