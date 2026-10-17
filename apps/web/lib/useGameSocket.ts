"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BattleGiftLogView,
  BattleSnapshot,
  ChatMessageView,
  GameStateHost,
  GameStatePublic,
  ServerEvent,
} from "@tebak-kata/shared";
import { WS_BASE } from "./config";
import { applyHostEvent, applyPublicEvent } from "./gameStateReducer";

export type ConnectionStatus = "connecting" | "open" | "closed" | "unauthorized";

interface GameSocketResult {
  status: ConnectionStatus;
  publicState: GameStatePublic | null;
  hostState: GameStateHost | null;
  lastEvent: (ServerEvent & { seq: number }) | null;
  chatLog: ChatMessageView[];
  /** Latest battle frame, throttled for DOM/HUD use (≤ 4 updates/sec). */
  battleFrame: BattleSnapshot | null;
  /**
   * Every non-battle event, delivered synchronously. Use this (not
   * `lastEvent`) when no event may be missed: React can coalesce several
   * events that arrive in one burst into a single render.
   */
  subscribeEvents: (listener: (event: ServerEvent & { seq: number }) => void) => () => void;
  /** Every battle frame (10/sec) for the canvas renderer, without React re-renders. */
  subscribeBattle: (listener: (frame: BattleSnapshot) => void) => () => void;
  /** Host only: outcome of every gift the battle game received. */
  battleGiftLog: BattleGiftLogView[];
}

const CHAT_LOG_LIMIT = 40;
const RECONNECT_DELAY_MS = 2000;
const BATTLE_LOG_LIMIT = 40;
const BATTLE_STATE_THROTTLE_MS = 250;
/** Close code the server uses for a wrong host token. */
const UNAUTHORIZED_CLOSE = 4401;

/**
 * PRD section 34 — Real-Time State Distribution. `role="overlay"` is public
 * (no auth); `role="host"` requires the host token and receives the host
 * state (with answers). Reconnects automatically, except after a rejected token.
 */
export function useGameSocket(role: "overlay" | "host", token?: string | null): GameSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [publicState, setPublicState] = useState<GameStatePublic | null>(null);
  const [hostState, setHostState] = useState<GameStateHost | null>(null);
  const [lastEvent, setLastEvent] = useState<(ServerEvent & { seq: number }) | null>(null);
  const [chatLog, setChatLog] = useState<ChatMessageView[]>([]);
  const [battleFrame, setBattleFrame] = useState<BattleSnapshot | null>(null);
  const [battleGiftLog, setBattleGiftLog] = useState<BattleGiftLogView[]>([]);
  const seqRef = useRef(0);
  const battleListeners = useRef(new Set<(frame: BattleSnapshot) => void>());
  const lastBattleState = useRef(0);
  const sessionRef = useRef<string | null>(null);
  const eventListeners = useRef(new Set<(event: ServerEvent & { seq: number }) => void>());

  const subscribeEvents = useCallback((listener: (event: ServerEvent & { seq: number }) => void) => {
    eventListeners.current.add(listener);
    return () => {
      eventListeners.current.delete(listener);
    };
  }, []);

  const subscribeBattle = useCallback((listener: (frame: BattleSnapshot) => void) => {
    battleListeners.current.add(listener);
    return () => {
      battleListeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (role === "host" && !token) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const handle = (event: ServerEvent) => {
      // Battle frames arrive ~10×/sec: hand them straight to the canvas and
      // only refresh React state a few times a second.
      if (event.type === "BATTLE_TICK") {
        for (const listener of battleListeners.current) listener(event.payload);
        const now = Date.now();
        const important = event.payload.fx.some((f) => f.k === "destroy") || event.payload.result !== null;
        if (important || now - lastBattleState.current >= BATTLE_STATE_THROTTLE_MS) {
          lastBattleState.current = now;
          setBattleFrame(event.payload);
        }
        return;
      }
      if (event.type === "BATTLE_GIFT") {
        setBattleGiftLog((prev) => [event.payload, ...prev].slice(0, BATTLE_LOG_LIMIT));
        return;
      }

      seqRef.current += 1;
      const numbered = { ...event, seq: seqRef.current };
      for (const listener of eventListeners.current) listener(numbered);
      setLastEvent(numbered);
      if (role === "overlay") setPublicState((prev) => applyPublicEvent(prev, event));
      else setHostState((prev) => applyHostEvent(prev, event));
      if (event.type === "CHAT_MESSAGE") setChatLog((prev) => [event.payload, ...prev].slice(0, CHAT_LOG_LIMIT));
      if (event.type === "SESSION_STATE" || event.type === "SESSION_STATE_HOST") {
        // A new LIVE session starts with an empty chat.
        const sessionId = event.payload.sessionId;
        if (sessionId && sessionId !== sessionRef.current) {
          if (sessionRef.current !== null) setChatLog([]);
          sessionRef.current = sessionId;
        }
      }
    };

    const connect = () => {
      if (cancelled) return;
      setStatus("connecting");
      const url =
        role === "host" ? `${WS_BASE}/ws?role=host&token=${encodeURIComponent(token ?? "")}` : `${WS_BASE}/ws?role=overlay`;
      socket = new WebSocket(url);
      socket.onopen = () => setStatus("open");
      socket.onmessage = (raw) => {
        try {
          handle(JSON.parse(raw.data as string) as ServerEvent);
        } catch (err) {
          console.error("[socket] bad message", err);
        }
      };
      socket.onclose = (closeEvent) => {
        if (closeEvent.code === UNAUTHORIZED_CLOSE) {
          setStatus("unauthorized");
          return;
        }
        setStatus("closed");
        if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [role, token]);

  return { status, publicState, hostState, lastEvent, chatLog, battleFrame, subscribeBattle, subscribeEvents, battleGiftLog };
}
