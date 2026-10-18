"use client";

import { useEffect, useRef, useState } from "react";
import type { GameStateHost } from "@tebak-kata/shared";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { coinRuleLabel, formatDuration, useLiveCountdown } from "@/lib/useLiveCountdown";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { Modal } from "@/components/ui/Modal";
import { Kbd, isTypingTarget } from "@/components/ui/Kbd";

/** Pause / resume / end the running LIVE session and add time (keyboard: P). */
export function SessionLiveCard({ token, hostState }: { token: string; hostState: GameStateHost }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [editGoalCoins, setEditGoalCoins] = useState(hostState.giftGoal?.targetCoins ?? 100);
  const timer = hostState.timer;
  const [editSecondsPerCoin, setEditSecondsPerCoin] = useState(timer?.secondsPerCoin ?? 30);
  const { remaining, grace } = useLiveCountdown(timer);
  const paused = hostState.status === "PAUSED";
  const overtime = Boolean(timer?.isOvertimeGrace);

  useEffect(() => {
    if (hostState.giftGoal?.targetCoins) {
      setEditGoalCoins(hostState.giftGoal.targetCoins);
    }
  }, [hostState.giftGoal?.targetCoins]);

  useEffect(() => {
    if (timer?.secondsPerCoin !== undefined) {
      setEditSecondsPerCoin(timer.secondsPerCoin);
    }
  }, [timer?.secondsPerCoin]);

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(label);
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(errorMessage(err, "Aksi gagal."));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const toggle = useRef<() => void>(() => {});
  toggle.current = () => {
    if (busy || confirmEnd || overtime) return;
    void run(paused ? "resume" : "pause", () => (paused ? api.resumeSession(token) : api.pauseSession(token)));
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;
      if (event.key.toLowerCase() === "p") toggle.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const source = hostState.liveSource;
  const sourceProblem = source && (!source.running || /Menghubungkan|tidak/i.test(source.status));

  return (
    <Card tone={overtime ? "yellow" : "white"}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardTitle className="mb-0">Sesi LIVE</CardTitle>
        <span className="text-[11px] font-bold uppercase text-muted">Keyboard: P = jeda/lanjut</span>
      </div>

      {timer && (
        <div className="mb-3 rounded-nb-sm border-2 border-ink bg-white p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-muted">
                {overtime ? "Waktu habis — tenggang" : paused ? "Sisa waktu (dijeda)" : "Sisa waktu"}
              </div>
              <div className="font-mono text-2xl font-black leading-none">{formatDuration(overtime ? grace : remaining)}</div>
            </div>
            <div className="text-right text-[11px] font-bold">
              <div className="font-mono text-ink">{coinRuleLabel(timer.secondsPerCoin)}</div>
              {timer.secondsAddedByGifts > 0 && <div className="text-muted">+{Math.round(timer.secondsAddedByGifts / 60)} menit dari gift</div>}
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted">Waktu/koin:</span>
              <input
                type="number"
                min={0}
                max={3600}
                value={editSecondsPerCoin}
                onChange={(e) => setEditSecondsPerCoin(Math.max(0, Number(e.target.value) || 0))}
                className="nb-input h-7 w-16 px-1 py-0.5 text-center font-mono text-xs font-bold"
                aria-label="Detik per 1 koin gift"
              />
              <span className="text-[11px] font-bold text-muted">dtk</span>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy !== null || editSecondsPerCoin === timer.secondsPerCoin}
                onClick={() => void run("setRate", () => api.setLiveTimerRate(token, editSecondsPerCoin))}
                className="h-7 px-2 text-xs"
              >
                Set
              </Button>
            </div>
            <div className="flex items-center gap-1">
              {[0, 10, 15, 30, 60].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    setEditSecondsPerCoin(s);
                    void run("setRate", () => api.setLiveTimerRate(token, s));
                  }}
                  className={`rounded border border-ink px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                    timer.secondsPerCoin === s
                      ? "bg-yellow text-ink font-black scale-105"
                      : "bg-paper text-ink hover:bg-paper-deep"
                  }`}
                >
                  {s === 0 ? "Off" : `${s}s`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gift Goal Live Progress & Control */}
      {hostState.giftGoal && (
        <div className="mb-3 rounded-nb-sm border-2 border-ink bg-white p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase text-ink">🎯 Gift Goal (Boss Round)</span>
              <span className="rounded-full border border-ink bg-purple px-1.5 py-0.2 text-[9px] font-black text-white">
                Tier #{hostState.giftGoal.tier}
              </span>
            </div>
            <div className="font-mono text-xs font-black text-ink">
              {hostState.giftGoal.currentCoins} / {hostState.giftGoal.targetCoins} Koin
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-paper-deep">
            <div
              className="h-full bg-yellow transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((hostState.giftGoal.currentCoins / Math.max(1, hostState.giftGoal.targetCoins)) * 100))}%`,
              }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted">Target:</span>
              <input
                type="number"
                min={1}
                max={50000}
                value={editGoalCoins}
                onChange={(e) => setEditGoalCoins(Math.max(1, Number(e.target.value) || 1))}
                className="nb-input h-7 w-16 px-1 py-0.5 text-center font-mono text-xs font-bold"
                aria-label="Target koin gift goal live"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={busy !== null || editGoalCoins === hostState.giftGoal.targetCoins}
                onClick={() => void run("setGoal", () => api.setGiftGoalTarget(token, editGoalCoins))}
                className="h-7 px-2 text-xs"
              >
                Set
              </Button>
            </div>
            <div className="flex items-center gap-1">
              {[50, 100, 200, 500].map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    setEditGoalCoins(c);
                    void run("setGoal", () => api.setGiftGoalTarget(token, c));
                  }}
                  className={`rounded border border-ink px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                    hostState.giftGoal?.targetCoins === c
                      ? "bg-yellow text-ink font-black scale-105"
                      : "bg-paper text-ink hover:bg-paper-deep"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {overtime && (
        <p className="mb-3 rounded-nb-sm border-2 border-ink bg-yellow p-2 text-xs font-bold">
          ⏰ Waktu sesi habis. Tunggu gift penonton atau tambah waktu untuk lanjut — kalau tidak, sesi berakhir otomatis.
        </p>
      )}
      {sourceProblem && (
        <p className="mb-3 rounded-nb-sm border-2 border-ink bg-orange p-2 text-xs font-bold">
          📡 {source?.kind === "tiktok" ? source.status || "TikTok belum terhubung" : "Simulasi tidak berjalan"} — komentar & gift belum masuk.
        </p>
      )}
      {error && !confirmEnd && <ErrorNote message={error} className="mb-3" />}

      <div className="grid grid-cols-2 gap-3">
        {paused ? (
          <Button size="lg" variant="success" disabled={busy !== null || overtime} onClick={() => void run("resume", () => api.resumeSession(token))}>
            ▶ Lanjut <Kbd>P</Kbd>
          </Button>
        ) : (
          <Button size="lg" variant="secondary" disabled={busy !== null} onClick={() => void run("pause", () => api.pauseSession(token))}>
            ⏸ Jeda <Kbd>P</Kbd>
          </Button>
        )}
        <Button size="lg" variant="danger" disabled={busy !== null} onClick={() => setConfirmEnd(true)}>
          ⏹ Akhiri LIVE
        </Button>
      </div>

      {timer && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t-2 border-ink/20 pt-3">
          <span className="text-xs font-bold text-muted">Tambah waktu:</span>
          <div className="flex gap-2">
            {[5, 10, 30].map((m) => (
              <Button key={m} size="sm" variant="secondary" disabled={busy !== null} onClick={() => void run("add", () => api.addLiveTime(token, m * 60))}>
                +{m} mnt
              </Button>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={confirmEnd}
        title="Akhiri sesi LIVE?"
        tone="danger"
        confirmLabel={busy === "end" ? "Mengakhiri..." : "Ya, akhiri"}
        busy={busy === "end"}
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => void run("end", () => api.endSession(token)).then((ok) => ok && setConfirmEnd(false))}
      >
        <p>Leaderboard sesi ini disimpan sebagai ringkasan lalu direset untuk LIVE berikutnya. Aksi ini tidak bisa dibatalkan.</p>
        {error && <ErrorNote message={error} className="mt-3" />}
      </Modal>
    </Card>
  );
}
