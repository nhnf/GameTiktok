import type { Server as HttpServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { WebSocket as WS } from "ws";
import { env } from "../env.js";
import type { Broadcaster } from "./broadcaster.js";
import type { GameSessionManager } from "../session/sessionManager.js";

interface AliveSocket extends WebSocket {
  isAlive?: boolean;
}

/**
 * PRD section 34 — Real-Time State Distribution to Host Dashboard + OBS
 * Overlay. Connect with `?role=overlay` (default) or `?role=host&token=...`.
 * Host connections must present HOST_TOKEN — that's the only extra data
 * they're entitled to (the puzzle's target answer).
 */
export function attachWebSocketServer(httpServer: HttpServer, broadcaster: Broadcaster, manager: GameSessionManager): void {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (socket: AliveSocket, request) => {
    const url = new URL(request.url ?? "/", "http://internal");
    const role = url.searchParams.get("role") === "host" ? "host" : "overlay";

    if (role === "host" && url.searchParams.get("token") !== env.hostToken) {
      socket.close(4401, "unauthorized");
      return;
    }

    broadcaster.register(socket, role);
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    try {
      if (role === "host") {
        broadcaster.sendTo(socket, { type: "SESSION_STATE_HOST", payload: manager.getHostState() });
      } else {
        broadcaster.sendTo(socket, { type: "SESSION_STATE", payload: manager.getPublicState() });
      }
    } catch (err) {
      console.error("[ws] failed to send initial state:", err);
    }

    socket.on("close", () => broadcaster.unregister(socket));
    socket.on("error", () => broadcaster.unregister(socket));
  });

  // Dead-connection sweep (NFR Reliability — recover cleanly from drops).
  const heartbeat = setInterval(() => {
    for (const client of wss.clients as Set<AliveSocket>) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      if (client.readyState === WS.OPEN) client.ping();
    }
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));
}
