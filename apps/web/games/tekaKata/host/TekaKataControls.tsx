"use client";

import { useEffect, useState } from "react";
import { DEFAULT_TEKA_KATA_CONFIG, type GameStateHost, type TekaKataCategory, type TekaKataConfig } from "@tebak-kata/shared";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { tekaKataApi } from "../api";

const DIFFICULTIES: { value: TekaKataConfig["difficulty"]; label: string }[] = [
  { value: "random", label: "🎲 Acak" },
  { value: "easy", label: "Easy (3–6 huruf)" },
  { value: "medium", label: "Medium (4–8)" },
  { value: "hard", label: "Hard (5–10)" },
  { value: "boss", label: "Boss (6–12)" },
];

/** Susun Kata settings (saved immediately, used by the next puzzle) + puzzle actions. */
export function TekaKataControls({ token, hostState }: { token: string; hostState: GameStateHost }) {
  const saved = { ...DEFAULT_TEKA_KATA_CONFIG, ...hostState.settings.tekaKata };
  const [categories, setCategories] = useState<TekaKataCategory[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const live = hostState.status === "ACTIVE";
  const puzzle = hostState.tekaKataPuzzle;

  useEffect(() => {
    tekaKataApi.categories
      .list(token)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [token]);

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

  const save = (patch: Partial<TekaKataConfig>) => void run("config", () => tekaKataApi.updateConfig(token, patch));

  return (
    <Card>
      <CardTitle>Kontrol Susun Kata</CardTitle>
      {error && <ErrorNote message={error} className="mb-3" />}

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-nb-sm border-2 border-ink bg-paper p-3 text-xs">
        <label className="flex flex-col gap-1 font-bold">
          Tingkat kesulitan
          <select className="nb-input h-9 py-1 text-xs" value={saved.difficulty} onChange={(e) => save({ difficulty: e.target.value as TekaKataConfig["difficulty"] })}>
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-bold">
          Kategori
          <select className="nb-input h-9 py-1 text-xs" value={saved.categoryId ?? ""} onChange={(e) => save({ categoryId: e.target.value || null })}>
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" className="h-4 w-4 accent-ink" checked={saved.autoGenerateNext} onChange={(e) => save({ autoGenerateNext: e.target.checked })} />
          Puzzle berikutnya otomatis
        </label>
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" className="h-4 w-4 accent-ink" checked={saved.allowGiftReveal} onChange={(e) => save({ allowGiftReveal: e.target.checked })} />
          Gift membuka 1 huruf
        </label>
        <p className="col-span-2 text-[11px] font-medium text-muted">Tersimpan otomatis · berlaku untuk puzzle berikutnya.</p>
      </div>

      {!live && <p className="mb-3 text-xs font-bold text-muted">Aksi puzzle aktif saat sesi LIVE berjalan.</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" disabled={busy !== null || !live} onClick={() => void run("generate", () => tekaKataApi.generate(token))}>
          🔄 Generate puzzle
        </Button>
        {puzzle?.status === "READY" ? (
          <Button variant="success" disabled={busy !== null || !live} onClick={() => void run("start", () => tekaKataApi.start(token))}>
            ▶ Mulai puzzle
          </Button>
        ) : (
          <Button variant="secondary" disabled={busy !== null || !live} onClick={() => void run("skip", () => tekaKataApi.skip(token))}>
            ⏭ Skip puzzle
          </Button>
        )}
        <Button variant="secondary" disabled={busy !== null || !live || puzzle?.status !== "ACTIVE"} onClick={() => void run("letter", () => tekaKataApi.revealLetter(token))}>
          💡 Buka 1 huruf
        </Button>
        <Button variant="secondary" disabled={busy !== null || !live || puzzle?.status !== "ACTIVE"} onClick={() => void run("word", () => tekaKataApi.revealWord(token))}>
          📖 Buka 1 kata
        </Button>
      </div>
    </Card>
  );
}
