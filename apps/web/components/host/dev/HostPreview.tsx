"use client";

import { useMemo, useState } from "react";
import { DEFAULT_SCORING, type ChatMessageView, type GameStateHost, type LeaderboardEntry, type SessionStatus } from "@tebak-kata/shared";
import type { AppConfig } from "@/lib/api";
import type { ConnectionStatus } from "@/lib/useGameSocket";
import { HostDashboardView } from "../HostDashboard";

// Deliberately invalid: buttons in the preview hit the real API and must be rejected.
const PREVIEW_TOKEN = "dev-preview-invalid-token";

const STATUSES: readonly SessionStatus[] = ["CREATED", "ACTIVE", "PAUSED", "ENDED"];
const SOCKETS: readonly ConnectionStatus[] = ["open", "connecting", "closed"];
const SOURCES: readonly AppConfig["liveSource"][] = ["tiktok", "mock"];

const LEADERBOARD: LeaderboardEntry[] = [
  { userId: "1", username: "andi", points: 55, wins: 6 },
  { userId: "2", username: "budi_santoso", points: 30, wins: 3 },
  { userId: "3", username: "siti.nur", points: 20, wins: 2 },
  { userId: "4", username: "rian99", points: 15, wins: 2 },
  { userId: "5", username: "dewi_kece_banget_sekali_loh", points: 10, wins: 1 },
];

const CHAT: ChatMessageView[] = [
  { id: "c1", username: "rian99", rawComment: "kelas", matchedLength: 5, isFullMatch: true, isWinner: true, createdAt: "2026-09-16T12:34:30.000Z" },
  { id: "c2", username: "siti.nur", rawComment: "kelam", matchedLength: 4, isFullMatch: false, isWinner: false, createdAt: "2026-09-16T12:34:20.000Z" },
  { id: "c3", username: "budi_santoso", rawComment: "Kemas!!", matchedLength: 2, isFullMatch: false, isWinner: false, createdAt: "2026-09-16T12:34:10.000Z" },
  { id: "c4", username: "andi", rawComment: "kotak", matchedLength: 1, isFullMatch: false, isWinner: false, createdAt: "2026-09-16T12:34:00.000Z" },
  { id: "c5", username: "dewi_kece_banget_sekali_loh", rawComment: "ayo semangat tebak kata nya, seru banget live hari ini", matchedLength: 0, isFullMatch: false, isWinner: false, createdAt: "2026-09-16T12:33:50.000Z" },
];

/** Dev-only harness for the host dashboard (no server, token, or LIVE needed). */
export function HostPreview() {
  const [status, setStatus] = useState<SessionStatus>("ACTIVE");
  const [socketStatus, setSocketStatus] = useState<ConnectionStatus>("open");
  const [source, setSource] = useState<AppConfig["liveSource"]>("tiktok");
  const [isBoss, setIsBoss] = useState(false);
  const [longWord, setLongWord] = useState(false);

  const hostState = useMemo<GameStateHost>(() => {
    const word = longWord ? "TRANSPORTASIUMUM" : "KELAS";
    const revealed = longWord ? 6 : 3;
    const hasPuzzle = status === "ACTIVE" || status === "PAUSED";
    return {
      sessionId: "preview",
      status,
      activeGame: "TEBAK_KATA",
      puzzle: hasPuzzle
        ? {
            puzzleId: `${word}-${isBoss ? "boss" : "normal"}`,
            category: longWord ? { id: "kendaraan", name: "Kendaraan", emoji: "🚗" } : { id: "pendidikan", name: "Pendidikan", emoji: "🎓" },
            difficulty: isBoss ? "boss" : "easy",
            isBoss,
            wordLength: word.length,
            display: word.split("").map((letter, index) => (index < revealed ? letter : null)),
            revealedLength: revealed,
            status: "ACTIVE",
            winner: null,
            rewardPoints: isBoss ? DEFAULT_SCORING.boss : DEFAULT_SCORING.easy,
            targetWord: word,
          }
        : null,
      tekaKataPuzzle: null,
      mathQuestion: null,
      battle: null,
      mathBattle: null,
      leaderboard: status === "CREATED" ? [] : LEADERBOARD,
      progress: { wordsFound: 27, wordsSkipped: 3, bossesDefeated: 1, wordsUntilNextBoss: 3 },
      timer: null,
      settings: { scoring: DEFAULT_SCORING, bossEveryNWords: 10, antiRepeatWindow: 8, mockTikTokEnabled: true },
      lastSessionSummary:
        status === "ENDED"
          ? {
              sessionId: "preview",
              totalPlayers: 128,
              totalComments: 8421,
              totalValidGuesses: 5120,
              wordsSolved: 27,
              wordsSkipped: 3,
              bossesDefeated: 1,
              topPlayer: LEADERBOARD[0],
            }
          : null,
      stats: { totalPlayers: 128, totalComments: 8421, totalValidGuesses: 5120, totalGifts: 184 },
      liveSource: { kind: source, running: status === "ACTIVE" || status === "PAUSED", status: source === "tiktok" ? "Terhubung ke @contoh_host" : "Simulasi berjalan" },
    };
  }, [status, isBoss, longWord, source]);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b-3 border-ink bg-ink px-4 py-2 text-xs font-bold uppercase text-white">
        <span className="text-yellow">Host preview (dev)</span>
        <Select label="Sesi" options={STATUSES} value={status} onChange={setStatus} />
        <Select label="Server" options={SOCKETS} value={socketStatus} onChange={setSocketStatus} />
        <Select label="Sumber" options={SOURCES} value={source} onChange={setSource} />
        <Check label="Boss" checked={isBoss} onChange={setIsBoss} />
        <Check label="Kata panjang" checked={longWord} onChange={setLongWord} />
        <span className="normal-case text-white/70">Data palsu — tombol memanggil API dengan token tidak valid.</span>
      </div>
      <div className="min-h-0 flex-1">
        <HostDashboardView
          token={PREVIEW_TOKEN}
          socketStatus={socketStatus}
          hostState={hostState}
          chatLog={status === "CREATED" ? [] : CHAT}
          config={{ liveSource: source, tiktokUsername: "contoh_host" }}
          configFailed={false}
        />
      </div>
    </div>
  );
}

function Select<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return (
    <label className="flex items-center gap-1.5">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="rounded border-2 border-white bg-ink px-1 py-0.5 text-xs font-bold text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5">
      <input type="checkbox" className="h-4 w-4 accent-yellow" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
