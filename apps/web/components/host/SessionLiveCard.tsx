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
  const timer = hostState.timer;
  const { remaining, grace } = useLiveCountdown(timer);
  const paused = hostState.status === "PAUSED";
  const overtime = Boolean(timer?.isOvertimeGrace);

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
        <div className="mb-3 flex items-center justify-between rounded-nb-sm border-2 border-ink bg-white px-3 py-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-muted">
              {overtime ? "Waktu habis — tenggang" : paused ? "Sisa waktu (dijeda)" : "Sisa waktu"}
            </div>
            <div className="font-mono text-2xl font-black leading-none">{formatDuration(overtime ? grace : remaining)}</div>
          </div>
          <div className="text-right text-[11px] font-bold">
            <div className="text-muted">{coinRuleLabel(timer.secondsPerCoin)}</div>
            {timer.secondsAddedByGifts > 0 && <div className="text-ink">+{Math.round(timer.secondsAddedByGifts / 60)} menit dari gift</div>}
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
