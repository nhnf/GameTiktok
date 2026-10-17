"use client";

import { useState, type ReactNode } from "react";
import { GAME_INFO, GAME_TYPES, type GameStateHost, type GameType, type LiveSessionTimer, type SessionStatus } from "@tebak-kata/shared";
import type { AppConfig } from "@/lib/api";
import type { ConnectionStatus } from "@/lib/useGameSocket";
import { GameSwitchModal } from "./GameSwitchModal";
import { LiveTimerPill } from "./LiveTimerPill";

const SESSION_PILL: Record<SessionStatus, { text: string; tone: string }> = {
  CREATED: { text: "Belum mulai", tone: "bg-white" },
  ACTIVE: { text: "Live", tone: "bg-green" },
  PAUSED: { text: "Jeda", tone: "bg-orange" },
  ENDED: { text: "Selesai", tone: "bg-white" },
};

const SOCKET_PILL: Record<ConnectionStatus, { text: string; tone: string }> = {
  open: { text: "Server terhubung", tone: "bg-green" },
  connecting: { text: "Menghubungkan...", tone: "bg-yellow" },
  closed: { text: "Server terputus", tone: "bg-red" },
  unauthorized: { text: "Token ditolak", tone: "bg-red" },
};

interface TopbarProps {
  token?: string;
  subtitle?: string;
  activeGame?: GameType;
  status?: SessionStatus;
  socketStatus?: ConnectionStatus;
  config?: AppConfig | null;
  timer?: LiveSessionTimer | null;
  liveSource?: GameStateHost["liveSource"];
  /** Forget the host token (shows the login form again). */
  onSignOut?: () => void;
}

/** Design System §25 — 64px topbar; status is always icon/dot + text, never color alone. */
export function Topbar({ token, subtitle, activeGame, status, socketStatus, config, timer, liveSource, onSignOut }: TopbarProps) {
  const [targetGame, setTargetGame] = useState<GameType | null>(null);
  const live = status === "ACTIVE" || status === "PAUSED";
  const sourceText = liveSource
    ? liveSource.kind === "tiktok"
      ? liveSource.running
        ? liveSource.status
        : "TikTok belum terhubung"
      : liveSource.running
        ? "Simulasi aktif"
        : "Simulasi"
    : config
      ? config.liveSource === "tiktok"
        ? "Sumber: TikTok LIVE"
        : "Sumber: Simulasi"
      : null;
  const sourceOk = liveSource ? liveSource.running && !/Menghubungkan|tidak/i.test(liveSource.status) : true;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b-3 border-ink bg-yellow px-5 text-ink">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 -rotate-1 rounded-nb-sm border-3 border-ink bg-white px-3 py-1 font-display text-lg uppercase leading-none shadow-nb-sm">
            Interactive LIVE
          </span>

          {activeGame && token && (
            <label className="flex items-center gap-1.5 rounded-nb-sm border-2 border-ink bg-white px-2 py-1 shadow-nb-sm">
              <span className="text-[11px] font-bold uppercase text-muted">Game:</span>
              <select
                value={activeGame}
                onChange={(e) => e.target.value !== activeGame && setTargetGame(e.target.value as GameType)}
                className="cursor-pointer bg-transparent font-display text-sm uppercase tracking-wide text-ink outline-none"
                aria-label="Pilih game"
              >
                {GAME_TYPES.map((game) => (
                  <option key={game} value={game}>
                    {GAME_INFO[game].emoji} {GAME_INFO[game].label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {subtitle && <span className="truncate text-xs font-bold uppercase tracking-widest">{subtitle}</span>}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {timer && live && <LiveTimerPill timer={timer} paused={status === "PAUSED"} />}
          {sourceText && <Pill tone={live && !sourceOk ? "bg-orange" : "bg-white"}>{sourceText}</Pill>}
          {socketStatus && <Pill tone={SOCKET_PILL[socketStatus].tone}>{SOCKET_PILL[socketStatus].text}</Pill>}
          {status && (
            <Pill tone={SESSION_PILL[status].tone} dot={status === "ACTIVE"}>
              {SESSION_PILL[status].text}
            </Pill>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Keluar (hapus host token dari browser ini)"
              className="h-8 rounded-full border-3 border-ink bg-white px-3 text-xs font-bold uppercase text-ink hover:bg-red"
            >
              Keluar
            </button>
          )}
        </div>
      </header>

      {token && activeGame && targetGame && (
        <GameSwitchModal token={token} currentGame={activeGame} targetGame={targetGame} isSessionLive={live} onClose={() => setTargetGame(null)} />
      )}
    </>
  );
}

function Pill({ tone, dot = false, children }: { tone: string; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex h-8 max-w-[260px] items-center gap-2 whitespace-nowrap rounded-full border-3 border-ink px-3 text-xs font-bold uppercase ${tone}`}>
      {dot && <span className="h-2.5 w-2.5 animate-blink rounded-full bg-ink" aria-hidden />}
      <span className="truncate">{children}</span>
    </span>
  );
}
