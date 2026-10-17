"use client";

import { useEffect, useState } from "react";
import { DEFAULT_GIFT_GOAL_COINS, DEFAULT_LIVE_TIMER, GAME_INFO, type GameStateHost } from "@tebak-kata/shared";
import { api, type AppConfig } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { coinRuleLabel } from "@/lib/useLiveCountdown";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { SessionSummaryBlock } from "./SessionSummaryBlock";

const PRESET_MINUTES = [15, 30, 45, 60, 90, 120];
const PRESET_GIFT_GOAL_COINS = [50, 100, 200, 500, 1000];

interface SessionStartCardProps {
  token: string;
  hostState: GameStateHost | null;
  config: AppConfig | null;
  configFailed: boolean;
}

/** Start a LIVE session for the selected game: TikTok account + session timer. */
export function SessionStartCard({ token, hostState, config, configFailed }: SessionStartCardProps) {
  const liveSource = config?.liveSource ?? "mock";
  const timerSettings = hostState?.settings.liveTimer ?? DEFAULT_LIVE_TIMER;
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [timerEnabled, setTimerEnabled] = useState(timerSettings.enabled);
  const [minutes, setMinutes] = useState(timerSettings.initialMinutes ?? DEFAULT_LIVE_TIMER.initialMinutes);
  const [secondsPerCoin, setSecondsPerCoin] = useState(timerSettings.secondsPerCoin ?? DEFAULT_LIVE_TIMER.secondsPerCoin);
  const [giftGoalCoins, setGiftGoalCoins] = useState(hostState?.settings.giftGoalCoins ?? DEFAULT_GIFT_GOAL_COINS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const game = hostState?.activeGame ?? "TEBAK_KATA";

  useEffect(() => {
    if (config?.tiktokUsername) setTiktokUsername((current) => current || config.tiktokUsername || "");
  }, [config]);

  useEffect(() => {
    setTimerEnabled(timerSettings.enabled);
    setMinutes(timerSettings.initialMinutes ?? DEFAULT_LIVE_TIMER.initialMinutes);
    setSecondsPerCoin(timerSettings.secondsPerCoin ?? DEFAULT_LIVE_TIMER.secondsPerCoin);
    if (hostState?.settings.giftGoalCoins) {
      setGiftGoalCoins(hostState.settings.giftGoalCoins);
    }
  }, [timerSettings.enabled, timerSettings.initialMinutes, timerSettings.secondsPerCoin, hostState?.settings.giftGoalCoins]);

  const start = async () => {
    setBusy(true);
    setError(null);
    setWarning(null);
    try {
      const res = await api.startSession(token, {
        activeGame: game,
        tiktokUsername: liveSource === "tiktok" ? tiktokUsername.trim().replace(/^@/, "") : undefined,
        liveTimer: { ...timerSettings, enabled: timerEnabled, initialMinutes: Math.max(1, minutes), secondsPerCoin },
        giftGoalCoins: Math.max(1, giftGoalCoins),
      });
      if (res.warning) setWarning(res.warning);
    } catch (err) {
      setError(errorMessage(err, "Gagal memulai sesi."));
    } finally {
      setBusy(false);
    }
  };

  const needsUsername = liveSource === "tiktok" && !tiktokUsername.trim();
  const configReady = config !== null || configFailed;

  return (
    <Card>
      <CardTitle>{hostState?.status === "ENDED" ? "Sesi selesai — mulai lagi?" : "Mulai sesi LIVE"}</CardTitle>
      {hostState?.status === "ENDED" && hostState.lastSessionSummary && <SessionSummaryBlock summary={hostState.lastSessionSummary} />}

      <p className="mb-3 text-sm font-medium">
        Game: <b>{GAME_INFO[game].emoji} {GAME_INFO[game].label}</b>
        <span className="block text-xs text-muted">Ganti game lewat pilihan di bar atas.</span>
      </p>

      {liveSource === "tiktok" && (
        <label className="mb-3 block">
          <span className="nb-label mb-1.5 block">Username TikTok (tanpa @)</span>
          <input value={tiktokUsername} onChange={(e) => setTiktokUsername(e.target.value)} placeholder="username" className="nb-input" />
          <span className="mt-1 block text-xs font-medium text-muted">Akun harus sedang LIVE saat sesi dimulai.</span>
        </label>
      )}

      <div className="mb-4 rounded-nb-sm border-2 border-ink bg-paper p-3">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" className="h-4 w-4 accent-ink" checked={timerEnabled} onChange={(e) => setTimerEnabled(e.target.checked)} />
          Timer sesi LIVE
        </label>
        {timerEnabled && (
          <div className="mt-2 space-y-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted">Durasi Sesi:</span>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
                  className="nb-input h-9 w-24 py-1 font-mono text-xs font-bold text-center"
                  placeholder="menit"
                  aria-label="Durasi sesi menit"
                />
                <span className="text-xs font-bold text-muted">menit</span>
              </div>
              {/* Quick Preset Buttons */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted">Pilihan cepat:</span>
                {PRESET_MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(m)}
                    className={`rounded-nb-sm border-2 border-ink px-2 py-0.5 text-[11px] font-bold transition-all ${
                      minutes === m
                        ? "bg-yellow text-ink shadow-sm scale-105"
                        : "bg-white text-ink hover:bg-paper-deep"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-ink/20 pt-2">
              <span className="text-xs font-bold text-muted">Waktu per 1 Koin:</span>
              <input
                type="number"
                min={0}
                max={3600}
                value={secondsPerCoin}
                onChange={(e) => setSecondsPerCoin(Math.max(0, Number(e.target.value) || 0))}
                className="nb-input h-9 w-20 py-1 font-mono text-xs text-center"
                placeholder="detik"
              />
              <span className="text-[11px] font-bold text-muted">detik ({coinRuleLabel(secondsPerCoin)})</span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 rounded-nb-sm border-2 border-ink bg-paper p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold flex items-center gap-1.5">
            🎯 Target Gift Goal (Boss Round)
          </span>
          <span className="rounded-full border border-ink bg-purple px-2 py-0.5 text-[10px] font-bold text-white uppercase">
            Poin Berlipat
          </span>
        </div>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">Target Koin:</span>
            <input
              type="number"
              min={1}
              max={50000}
              value={giftGoalCoins}
              onChange={(e) => setGiftGoalCoins(Math.max(1, Number(e.target.value) || 1))}
              className="nb-input h-9 w-24 py-1 font-mono text-xs font-bold text-center"
              placeholder="koin"
              aria-label="Target koin gift goal"
            />
            <span className="text-xs font-bold text-muted">koin</span>
          </div>
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted">Pilihan cepat:</span>
            {PRESET_GIFT_GOAL_COINS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setGiftGoalCoins(c)}
                className={`rounded-nb-sm border-2 border-ink px-2 py-0.5 text-[11px] font-bold transition-all ${
                  giftGoalCoins === c
                    ? "bg-yellow text-ink shadow-sm scale-105"
                    : "bg-white text-ink hover:bg-paper-deep"
                }`}
              >
                {c} koin
              </button>
            ))}
          </div>
          <p className="text-[11px] font-medium text-muted">
            Saat total gift penonton mencapai target, soal/puzzle berikutnya otomatis menjadi Boss Round.
          </p>
        </div>
      </div>

      {error && <ErrorNote message={error} className="mb-3" />}
      {warning && <ErrorNote message={`Sesi berjalan, tapi: ${warning}`} className="mb-3" />}

      <Button size="lg" className="w-full" disabled={busy || !configReady || needsUsername} onClick={() => void start()}>
        {busy ? "Memulai..." : "▶ Mulai sesi LIVE"}
      </Button>
    </Card>
  );
}
