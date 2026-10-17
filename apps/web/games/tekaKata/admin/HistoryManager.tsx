"use client";

import { useEffect, useState } from "react";
import { tekaKataApi } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Card } from "@/components/ui/Card";
import { Badge, DifficultyBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

interface HistoryPuzzle {
  id: string;
  difficulty: string;
  status: string;
  totalWords: number;
  foundWords: number;
  isBoss: boolean;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  category?: { name: string } | null;
  words?: Array<{
    id: string;
    word: string;
    points: number;
    isFound: boolean;
    isRevealed: boolean;
    foundBy?: { username: string } | null;
  }>;
}

export function TekaKataHistoryManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [history, setHistory] = useState<HistoryPuzzle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tekaKataApi
      .history(token, 30)
      .then((data) => setHistory(data as HistoryPuzzle[]))
      .catch((err) => toast(errorMessage(err, "Gagal memuat riwayat puzzle."), "error"))
      .finally(() => setLoading(false));
  }, [token, toast]);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        title="Riwayat Puzzle — Susun Kata"
        description="Daftar riwayat puzzle Susun Kata yang telah dimainkan pada sesi LIVE."
        count={history.length}
      />

      <Card padded={false} className="overflow-x-auto">
        {loading ? (
          <p className="p-5 text-sm font-medium text-muted">Memuat...</p>
        ) : history.length === 0 ? (
          <p className="p-5 text-sm font-medium text-muted">Belum ada riwayat puzzle Susun Kata.</p>
        ) : (
          <div className="divide-y-2 divide-ink">
            {history.map((puzzle) => (
              <div key={puzzle.id} className="p-4 bg-white hover:bg-paper/40 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted">#{puzzle.id.slice(-6)}</span>
                    <Badge tone="yellow">{puzzle.category?.name ?? "Umum"}</Badge>
                    <DifficultyBadge difficulty={puzzle.difficulty as "easy"} />
                    {puzzle.isBoss && <Badge tone="purple">👑 BOSS</Badge>}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border-2 border-ink px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        puzzle.status === "COMPLETED"
                          ? "bg-green text-ink"
                          : puzzle.status === "SKIPPED"
                            ? "bg-paper text-muted"
                            : "bg-yellow text-ink"
                      }`}
                    >
                      {puzzle.status}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(puzzle.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold">
                    Kata Terbuka: <span className="font-mono text-ink">{puzzle.foundWords} / {puzzle.totalWords}</span>
                  </div>
                </div>

                {puzzle.words && puzzle.words.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {puzzle.words.map((w) => (
                      <span
                        key={w.id}
                        className={`inline-flex items-center gap-1 rounded border border-ink px-2 py-0.5 text-xs ${
                          w.isFound
                            ? "bg-green/30 font-bold"
                            : w.isRevealed
                              ? "bg-yellow/30 font-semibold"
                              : "bg-ink/5 text-muted"
                        }`}
                        title={w.foundBy ? `Ditemukan oleh @${w.foundBy.username}` : undefined}
                      >
                        {w.word}
                        {w.foundBy && <span className="text-[10px] text-ink font-bold">(@{w.foundBy.username})</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
