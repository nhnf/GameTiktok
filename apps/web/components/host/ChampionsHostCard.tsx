"use client";

import { useRef, useState } from "react";
import type { ChampionEntry } from "@tebak-kata/shared";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";

interface ChampionsHostCardProps {
  token: string;
  champions?: ChampionEntry[] | null;
  disabled?: boolean;
}

export function ChampionsHostCard({
  token,
  champions = [],
  disabled = false,
}: ChampionsHostCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const list = champions ?? [];

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await api.exportChampionsData(token);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `data-juara-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("Data juara & sesi berhasil diekspor.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(errorMessage(err, "Gagal mengekspor data juara."));
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setError(null);
    setSuccess(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload || !Array.isArray(payload.sessions)) {
        throw new Error("File JSON tidak valid. Pastikan memilih file hasil ekspor data juara.");
      }
      const res = await api.importMergeChampionsData(token, payload);
      const added = res.mergeResult?.addedSessions ?? 0;
      setSuccess(`Berhasil menggabungkan ${added} sesi baru dari file! Data juara telah diperbarui.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(errorMessage(err, "Gagal mengimpor dan menggabungkan data juara."));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (champ: ChampionEntry) => {
    if (!window.confirm(`Hapus @${champ.username} dari daftar juara bertahan?`)) {
      return;
    }
    setBusyId(champ.userId);
    setError(null);
    setSuccess(null);
    try {
      await api.deleteChampion(token, champ.userId);
      setSuccess(`@${champ.username} berhasil dihapus dari daftar juara.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(errorMessage(err, "Gagal menghapus juara bertahan."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <CardTitle className="mb-0 text-base">👑 Juara Bertahan</CardTitle>
        <span className="text-[11px] font-bold text-muted">Sepanjang Waktu</span>
      </div>

      {error && <ErrorNote message={error} className="mb-2" />}
      {success && (
        <div className="mb-2 rounded-nb-sm border-2 border-ink bg-green px-2.5 py-1 text-xs font-bold text-ink">
          ✓ {success}
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-xs font-bold text-muted text-center py-3">
          Belum ada rekor juara bertahan.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((champ, idx) => (
            <div
              key={`${champ.userId}-${idx}`}
              className="flex items-center justify-between gap-2 rounded-nb-sm border-2 border-ink bg-paper p-2 text-xs font-bold"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink bg-yellow text-[11px] font-black">
                  {idx === 0 ? "👑" : idx + 1}
                </span>
                {champ.avatarUrl ? (
                  <img
                    src={champ.avatarUrl}
                    alt={champ.username}
                    className="h-6 w-6 shrink-0 rounded-full border border-ink object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink bg-blue text-[10px] font-bold">
                    {champ.username[0]?.toUpperCase() || "?"}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate font-bold text-ink">@{champ.username}</div>
                  <span className="text-[10px] font-black text-ink/70">
                    {champ.championCount}× Juara
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="danger"
                className="h-7 px-2 text-[11px] shrink-0"
                disabled={disabled || busyId !== null}
                onClick={() => void handleDelete(champ)}
                title="Hapus dari daftar juara"
              >
                {busyId === champ.userId ? "..." : "Hapus"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t-2 border-ink/20 pt-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => void handleFileSelect(e)}
        />
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 text-xs"
          disabled={disabled || isExporting || isImporting}
          onClick={() => void handleExport()}
          title="Ekspor seluruh riwayat sesi dan juara ke file JSON"
        >
          {isExporting ? "Mengekspor..." : "📥 Ekspor Data"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 text-xs"
          disabled={disabled || isExporting || isImporting}
          onClick={() => fileInputRef.current?.click()}
          title="Pilih file JSON dari laptop lain untuk digabungkan"
        >
          {isImporting ? "Menggabungkan..." : "📤 Impor & Gabung"}
        </Button>
      </div>
    </Card>
  );
}
