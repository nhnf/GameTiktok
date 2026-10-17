import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { env } from "./core/env.js";
import { errorText } from "./core/http.js";
import { Broadcaster } from "./core/realtime/broadcaster.js";
import { attachWebSocketServer } from "./core/realtime/wsServer.js";
import { GameSessionManager } from "./core/session/sessionManager.js";
import type { LiveAdapter } from "./core/live/liveAdapter.js";
import { MockTikTokAdapter } from "./core/live/mockTikTokAdapter.js";
import { TikTokLiveAdapter } from "./core/live/tiktokLiveAdapter.js";
import { configRouter } from "./core/routes/config.js";
import { stateRouter } from "./core/routes/state.js";
import { sessionRouter } from "./core/routes/session.js";
import { settingsRouter } from "./core/routes/settings.js";
import { wordGiftsRouter } from "./core/routes/wordGifts.js";
import { mockRouter } from "./core/routes/mock.js";
import { mountGameRoutes } from "./games/registry.js";

const broadcaster = new Broadcaster();
const manager = new GameSessionManager(broadcaster);

// PRD section 53 (V3 roadmap) — same engine, swappable event source.
const liveAdapter: LiveAdapter =
  env.liveSource === "tiktok"
    ? new TikTokLiveAdapter(
        manager,
        env.tiktokUsername ?? "",
        env.tiktokSignApiKey,
        env.tiktokSessionId && env.tiktokTargetIdc ? { sessionId: env.tiktokSessionId, ttTargetIdc: env.tiktokTargetIdc } : undefined,
      )
    : new MockTikTokAdapter(manager);

// Disconnect from TikTok / stop the simulator whenever a session ends (host or timer).
manager.onSessionEnded(() => liveAdapter.stop());
manager.setLiveSourceProbe(() => ({ kind: liveAdapter.kind, running: liveAdapter.isRunning(), status: liveAdapter.describe?.() ?? "" }));

const app = express();
app.use(cors({ origin: env.webOrigin }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, connections: broadcaster.connectionCount, liveSource: env.liveSource });
});

app.use("/api/config", configRouter());
app.use("/api/state", stateRouter(manager));
app.use("/api/session", sessionRouter(manager, liveAdapter));
app.use("/api/admin/settings", settingsRouter(manager, liveAdapter));
app.use("/api/admin/gifts", wordGiftsRouter());
app.use("/api/mock", mockRouter(manager));
mountGameRoutes(app, manager);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server] unhandled error:", err);
  const status = (err as { type?: string })?.type === "entity.parse.failed" ? 400 : 500;
  res.status(status).json({ error: status === 400 ? "Body JSON tidak valid." : errorText(err) });
});

// Last line of defence: log instead of crashing the LIVE if something slips through.
process.on("unhandledRejection", (reason) => console.error("[server] unhandled rejection:", reason));

const httpServer = createServer(app);
attachWebSocketServer(httpServer, broadcaster, manager);

manager
  .init()
  .catch((err: unknown) => console.error("[server] failed to load stored settings:", err))
  .finally(() => {
    httpServer.listen(env.port, () => {
      console.log(`[server] Interactive Game API listening on http://localhost:${env.port}`);
      console.log(`[server] Live source: ${env.liveSource}${env.liveSource === "tiktok" ? ` (default @${env.tiktokUsername ?? "unset"})` : ""}`);
      console.log(`[server] WebSocket endpoint: ws://localhost:${env.port}/ws?role=overlay | ?role=host&token=<HOST_TOKEN>`);
    });
  });

httpServer.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[server] Port ${env.port} sudah dipakai. Tutup server lain yang masih berjalan lalu coba lagi.`);
    process.exit(1);
  }
  console.error("[server] http error:", err);
});

const shutdown = () => {
  liveAdapter.stop();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
