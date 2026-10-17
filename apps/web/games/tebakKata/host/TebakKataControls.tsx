"use client";

import { useEffect, useRef, useState } from "react";
import type { GameStateHost } from "@tebak-kata/shared";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { Kbd, isTypingTarget } from "@/components/ui/Kbd";
import { tebakKataApi } from "../api";

/** PRD §22.1, §23 — HINT / SKIP / NEW WORD, with keyboard shortcuts H · S · N. */
export function TebakKataControls({ token, hostState }: { token: string; hostState: GameStateHost }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const live = hostState.status === "ACTIVE";
  const puzzleActive = hostState.puzzle?.status === "ACTIVE";

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(label);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err, "Aksi gagal."));
    } finally {
      setBusy(null);
    }
  };

  const shortcut = useRef<(key: string) => void>(() => {});
  shortcut.current = (key) => {
    if (busy || !live) return;
    if (key === "h" && puzzleActive) void run("hint", () => tebakKataApi.hint(token));
    else if (key === "s" && puzzleActive) void run("skip", () => tebakKataApi.skip(token));
    else if (key === "n") void run("new", () => tebakKataApi.newWord(token));
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;
      shortcut.current(event.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-2">
        <CardTitle className="mb-0">Kontrol Tebak Kata</CardTitle>
        <span className="text-[11px] font-bold uppercase text-muted">Keyboard: H · S · N</span>
      </div>
      {!live && <p className="mb-3 text-xs font-bold text-muted">Kontrol aktif saat sesi LIVE berjalan.</p>}
      {error && <ErrorNote message={error} className="mb-3" />}
      <div className="grid grid-cols-3 gap-3">
        <Button size="lg" disabled={busy !== null || !live || !puzzleActive} onClick={() => void run("hint", () => tebakKataApi.hint(token))}>
          💡 Hint <Kbd>H</Kbd>
        </Button>
        <Button size="lg" variant="info" disabled={busy !== null || !live || !puzzleActive} onClick={() => void run("skip", () => tebakKataApi.skip(token))}>
          ⏭ Skip <Kbd>S</Kbd>
        </Button>
        <Button size="lg" variant="secondary" disabled={busy !== null || !live} onClick={() => void run("new", () => tebakKataApi.newWord(token))}>
          ✨ Baru <Kbd>N</Kbd>
        </Button>
      </div>
      <p className="mt-3 text-[11px] font-medium text-muted">Skip dihitung sebagai kata dilewati; &quot;Baru&quot; mengganti kata tanpa menghitung skip.</p>
    </Card>
  );
}
