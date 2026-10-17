"use client";

import { useState } from "react";
import type { MatchStatus, SessionStatus } from "@tebak-kata/shared";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { Modal } from "@/components/ui/Modal";
import { battleApi } from "../api";

/** PRD §32 — match control: start / pause / end (winner by base HP) / reset. */
export function BattleControls({ token, status, matchStatus }: { token: string; status: SessionStatus; matchStatus: MatchStatus }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const live = status === "ACTIVE";
  const paused = matchStatus === "PAUSED";
  const fighting = matchStatus === "BATTLE" || matchStatus === "SUDDEN_DEATH";

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

  return (
    <Card>
      <CardTitle>Kontrol match</CardTitle>
      {!live && <p className="mb-3 text-xs font-bold text-muted">Kontrol match aktif saat sesi LIVE berjalan (tidak dijeda).</p>}
      {error && <ErrorNote message={error} className="mb-3" />}
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          variant="success"
          disabled={busy !== null || !live || !(matchStatus === "WAITING" || matchStatus === "ENDED")}
          onClick={() => void run("start", () => battleApi.match(token, "start"))}
        >
          ▶ Mulai battle
        </Button>
        {paused ? (
          <Button size="lg" disabled={busy !== null || !live} onClick={() => void run("resume", () => battleApi.match(token, "resume"))}>
            ▶ Lanjut
          </Button>
        ) : (
          <Button size="lg" variant="secondary" disabled={busy !== null || !live} onClick={() => void run("pause", () => battleApi.match(token, "pause"))}>
            ⏸ Jeda match
          </Button>
        )}
        <Button size="lg" variant="info" disabled={busy !== null || !live || !fighting} onClick={() => void run("end", () => battleApi.match(token, "end"))}>
          🏁 Akhiri match
        </Button>
        <Button size="lg" variant="secondary" disabled={busy !== null || !live} onClick={() => setConfirmReset(true)}>
          ♻ Reset match
        </Button>
      </div>
      <p className="mt-3 text-xs font-medium text-muted">
        Akhiri match: pemenang ditentukan dari HP base saat ini. Reset: match baru di lobby & antrean pasukan dikosongkan.
      </p>

      <Modal
        open={confirmReset}
        title="Reset match?"
        tone="danger"
        confirmLabel={busy === "reset" ? "Memproses..." : "Ya, reset"}
        busy={busy === "reset"}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => void run("reset", () => battleApi.match(token, "reset")).then((ok) => ok && setConfirmReset(false))}
      >
        <p>Semua unit di arena dan antrean pasukan akan dihapus, lalu match baru dimulai di lobby.</p>
      </Modal>
    </Card>
  );
}
