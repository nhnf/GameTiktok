"use client";

import { useEffect, useState } from "react";
import type { GameStateHost, MathBattleConfig, MathBattleDifficulty, MathBattleTeamAssignmentMode, MathBattleTeamId } from "@tebak-kata/shared";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { Modal } from "@/components/ui/Modal";
import { mathBattleApi } from "../api";
import { RUNNING_STATUSES } from "../labels";

type Draft = Pick<MathBattleConfig, "totalRounds" | "roundDurationSeconds" | "difficulty" | "assignmentMode" | "winLineDistance">;

/** Match control (start / speed up / pause / end / reset) + match settings. */
export function MatchControls({ token, hostState }: { token: string; hostState: GameStateHost }) {
  const battle = hostState.mathBattle;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endWinner, setEndWinner] = useState<MathBattleTeamId | "DRAW" | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const live = hostState.status === "ACTIVE";
  const status = battle?.status ?? "LOBBY";
  const running = RUNNING_STATUSES.includes(status);

  useEffect(() => {
    if (battle && !draft) {
      const { totalRounds, roundDurationSeconds, difficulty, assignmentMode, winLineDistance } = battle.config;
      setDraft({ totalRounds, roundDurationSeconds, difficulty, assignmentMode, winLineDistance });
    }
  }, [battle, draft]);

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

  const select = (label: string, value: string | number, options: [string | number, string][], onChange: (v: string) => void) => (
    <label className="flex flex-col gap-1 font-bold">
      {label}
      <select className="nb-input h-9 py-1 text-xs" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Card>
      <CardTitle>Kontrol match</CardTitle>
      {!live && <p className="mb-3 text-xs font-bold text-muted">Kontrol match aktif saat sesi LIVE berjalan (tidak dijeda).</p>}
      {error && <ErrorNote message={error} className="mb-3" />}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="success" disabled={busy !== null || !live || running} onClick={() => void run("start", () => mathBattleApi.start(token))}>
          ▶ Mulai match
        </Button>
        <Button variant="info" disabled={busy !== null || !live || !running || status === "PAUSED"} onClick={() => void run("next", () => mathBattleApi.nextRound(token))}>
          ⏩ Percepat ronde
        </Button>
        {status === "PAUSED" ? (
          <Button variant="success" disabled={busy !== null || !live} onClick={() => void run("resume", () => mathBattleApi.resume(token))}>
            ▶ Lanjut match
          </Button>
        ) : (
          <Button variant="secondary" disabled={busy !== null || !live || !running} onClick={() => void run("pause", () => mathBattleApi.pause(token))}>
            ⏸ Jeda match
          </Button>
        )}
        <Button variant="secondary" disabled={busy !== null || !live} onClick={() => void run("reset", () => mathBattleApi.reset(token))}>
          ♻ Reset ke lobby
        </Button>
      </div>

      <div className="mt-3 border-t-2 border-ink/20 pt-3">
        <span className="text-[11px] font-bold uppercase text-muted">Akhiri match sekarang:</span>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {(["BLUE", "DRAW", "RED"] as const).map((w) => (
            <Button key={w} size="sm" variant={w === "BLUE" ? "info" : w === "RED" ? "danger" : "secondary"} disabled={busy !== null || !live || !running} onClick={() => setEndWinner(w)}>
              {w === "BLUE" ? "🔵 Biru" : w === "RED" ? "🔴 Merah" : "⚖ Imbang"}
            </Button>
          ))}
        </div>
      </div>

      {draft && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t-2 border-ink/20 pt-3 text-xs">
          {select("Jumlah ronde", draft.totalRounds, [5, 10, 15, 20].map((n) => [n, `${n} ronde`]), (v) => setDraft({ ...draft, totalRounds: Number(v) }))}
          {select("Waktu per ronde", draft.roundDurationSeconds, [5, 10, 15, 20, 30].map((n) => [n, `${n} detik`]), (v) => setDraft({ ...draft, roundDurationSeconds: Number(v) }))}
          {select("Kesulitan", draft.difficulty, [["easy", "Easy (10–50)"], ["normal", "Normal (25–99)"], ["hard", "Hard (100–599)"], ["extreme", "Extreme (300–999)"]], (v) => setDraft({ ...draft, difficulty: v as MathBattleDifficulty }))}
          {select("Pembagian tim", draft.assignmentMode, [["COMMENT", "Komentar + seimbang"], ["RANDOM", "Acak"], ["HOST", "Diatur host"]], (v) => setDraft({ ...draft, assignmentMode: v as MathBattleTeamAssignmentMode }))}
          {select("Garis menang", draft.winLineDistance, [50, 75, 100, 150].map((n) => [n, `±${n}`]), (v) => setDraft({ ...draft, winLineDistance: Number(v) }))}
          <div className="flex items-end">
            <Button size="sm" className="w-full" disabled={busy !== null} onClick={() => void run("config", () => mathBattleApi.updateConfig(token, draft))}>
              💾 Simpan
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={endWinner !== null}
        title="Akhiri match?"
        tone="danger"
        confirmLabel={busy === "end" ? "Memproses..." : "Ya, akhiri"}
        busy={busy === "end"}
        onCancel={() => setEndWinner(null)}
        onConfirm={() => void run("end", () => mathBattleApi.end(token, endWinner ?? undefined)).then((ok) => ok && setEndWinner(null))}
      >
        <p>
          Match diakhiri dengan hasil: <b>{endWinner === "BLUE" ? "Tim Biru menang" : endWinner === "RED" ? "Tim Merah menang" : "Imbang"}</b>.
        </p>
      </Modal>
    </Card>
  );
}
