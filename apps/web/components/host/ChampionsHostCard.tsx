"use client";

import { useState } from "react";
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const list = champions ?? [];

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
    </Card>
  );
}
