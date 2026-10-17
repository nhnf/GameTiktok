import type { WebSocket } from "ws";
import type { ServerEvent } from "@tebak-kata/shared";

export type ClientRole = "overlay" | "host";

/**
 * Tracks connected sockets and fans out ServerEvents.
 * "host" audience only reaches Host Dashboard connections — this is how the
 * target word (carried on SESSION_STATE_HOST) stays off the public overlay
 * (PRD section 49: game state authoritative on server, client only receives
 * what it's entitled to).
 */
export class Broadcaster {
  private readonly clients = new Map<WebSocket, ClientRole>();

  register(socket: WebSocket, role: ClientRole): void {
    this.clients.set(socket, role);
  }

  unregister(socket: WebSocket): void {
    this.clients.delete(socket);
  }

  /**
   * `all`: every client. `host`: host dashboards only (carries answers).
   * `overlay`: public clients only (hosts get the richer host copy instead).
   */
  publish(event: ServerEvent, audience: "all" | "host" | "overlay" = "all"): void {
    const data = JSON.stringify(event);
    for (const [socket, role] of this.clients) {
      if (socket.readyState !== socket.OPEN) continue;
      if (audience === "host" && role !== "host") continue;
      if (audience === "overlay" && role !== "overlay") continue;
      try {
        socket.send(data);
      } catch (err) {
        console.error("[broadcaster] send failed:", err);
      }
    }
  }

  sendTo(socket: WebSocket, event: ServerEvent): void {
    if (socket.readyState !== socket.OPEN) return;
    try {
      socket.send(JSON.stringify(event));
    } catch (err) {
      console.error("[broadcaster] send failed:", err);
    }
  }

  get connectionCount(): number {
    return this.clients.size;
  }
}
