"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_MATH_CONFIG, MATH_TIMER_PRESETS, type GameStateHost, type MathConfig, type MathOperationMode } from "@tebak-kata/shared";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { mathApi } from "../api";
import { RankPointsEditor } from "./RankPointsEditor";

const OPERATIONS: { value: MathOperationMode; label: string }[] = [
  { value: "mixed", label: "Campuran (+ − × ÷)" },
  { value: "add_sub", label: "Tambah & kurang" },
  { value: "mul_div", label: "Kali & bagi" },
  { value: "addition", label: "Penjumlahan saja" },
  { value: "subtraction", label: "Pengurangan saja" },
  { value: "multiplication", label: "Perkalian saja" },
  { value: "division", label: "Pembagian saja" },
];

/** Matematika settings (saved automatically, used from the next question) + question actions. */
export function MathControls({ token, hostState }: { token: string; hostState: GameStateHost }) {
  const [draft, setDraft] = useState<MathConfig>({ ...DEFAULT_MATH_CONFIG, ...hostState.settings.matematika });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const live = hostState.status === "ACTIVE";
  const question = hostState.mathQuestion;

  // Follow the server copy when nothing is waiting to be saved.
  const serverConfig = JSON.stringify(hostState.settings.matematika ?? {});
  useEffect(() => {
    if (saved) setDraft({ ...DEFAULT_MATH_CONFIG, ...hostState.settings.matematika });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverConfig]);
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const update = (patch: Partial<MathConfig>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      mathApi
        .updateConfig(token, next)
        .then(() => setSaved(true))
        .catch((err: unknown) => setError(errorMessage(err, "Gagal menyimpan pengaturan.")));
    }, 500);
  };

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

  const rangeInvalid = draft.minNumber > draft.maxNumber;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle className="mb-0">Kontrol Matematika</CardTitle>
        <span className={`text-[10px] font-bold uppercase ${saved ? "text-muted" : "text-orange"}`}>{saved ? "✓ Tersimpan" : "Menyimpan..."}</span>
      </div>
      {error && <ErrorNote message={error} className="mb-3" />}

      <div className="mb-4 flex flex-col gap-3 rounded-nb-sm border-2 border-ink bg-paper p-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 font-bold">
            Waktu jawab
            <select className="nb-input h-9 py-1 text-xs" value={draft.durationSeconds} onChange={(e) => update({ durationSeconds: Number(e.target.value) })}>
              {[...new Set([...MATH_TIMER_PRESETS, draft.durationSeconds])].sort((a, b) => a - b).map((s) => (
                <option key={s} value={s}>
                  {s} detik
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-bold">
            Operasi
            <select className="nb-input h-9 py-1 text-xs" value={draft.operationMode} onChange={(e) => update({ operationMode: e.target.value as MathOperationMode })}>
              {OPERATIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 font-bold">
            Rentang angka
            <div className="flex items-center gap-1">
              <input type="number" min={0} max={999} aria-label="Angka minimum" className="nb-input h-9 w-16 px-1 text-center text-xs" value={draft.minNumber} onChange={(e) => update({ minNumber: Number(e.target.value) })} />
              <span>s/d</span>
              <input type="number" min={1} max={999} aria-label="Angka maksimum" className="nb-input h-9 w-16 px-1 text-center text-xs" value={draft.maxNumber} onChange={(e) => update({ maxNumber: Number(e.target.value) })} />
            </div>
            {rangeInvalid && <span className="text-[10px] text-red">Minimum lebih besar dari maksimum — akan ditukar.</span>}
          </div>
          <div className="flex flex-col justify-end gap-1.5 font-bold">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-ink" checked={draft.autoNext} onChange={(e) => update({ autoNext: e.target.checked })} />
              Soal berikutnya otomatis
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-ink" checked={draft.allowNegative} onChange={(e) => update({ allowNegative: e.target.checked })} />
              Boleh hasil negatif
            </label>
          </div>
        </div>
        <RankPointsEditor
          rankPoints={draft.rankPoints ?? DEFAULT_MATH_CONFIG.rankPoints ?? []}
          rank10Plus={draft.rank10PlusPoints ?? 1}
          onChange={(rankPoints, rank10PlusPoints) => update({ rankPoints, rank10PlusPoints })}
        />
      </div>

      {!live && <p className="mb-3 text-xs font-bold text-muted">Aksi soal aktif saat sesi LIVE berjalan.</p>}
      <div className="grid grid-cols-2 gap-2">
        {question?.status === "READY" ? (
          <Button variant="success" disabled={busy !== null || !live} onClick={() => void run("start", () => mathApi.start(token))}>
            ▶ Mulai soal
          </Button>
        ) : (
          <Button variant="primary" disabled={busy !== null || !live} onClick={() => void run("next", () => mathApi.skip(token))}>
            ⏭ Soal baru
          </Button>
        )}
        <Button variant="secondary" disabled={busy !== null || !live || question?.status !== "ACTIVE"} onClick={() => void run("reveal", () => mathApi.reveal(token))}>
          👁 Buka jawaban
        </Button>
      </div>
    </Card>
  );
}
