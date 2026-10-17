"use client";

import { useEffect, useState } from "react";
import { mathApi } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

interface MathQuestionHistoryItem {
  id: string;
  expression: string;
  answer: number;
  durationSeconds: number;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  answers?: Array<{
    id: string;
    submittedAnswer: number;
    rank: number;
    points: number;
    isCorrect: boolean;
    player?: { username: string } | null;
  }>;
}

export function MathHistoryManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [history, setHistory] = useState<MathQuestionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mathApi
      .history(token, 30)
      .then((data) => setHistory(data as MathQuestionHistoryItem[]))
      .catch((err) => toast(errorMessage(err, "Gagal memuat riwayat soal matematika."), "error"))
      .finally(() => setLoading(false));
  }, [token, toast]);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        title="Riwayat Soal — Matematika LIVE"
        description="Daftar riwayat soal aritmetika yang telah dimainkan pada sesi LIVE."
        count={history.length}
      />

      <Card padded={false} className="overflow-x-auto">
        {loading ? (
          <p className="p-5 text-sm font-medium text-muted">Memuat...</p>
        ) : history.length === 0 ? (
          <p className="p-5 text-sm font-medium text-muted">Belum ada riwayat soal Matematika LIVE.</p>
        ) : (
          <div className="divide-y-2 divide-ink">
            {history.map((q) => (
              <div key={q.id} className="p-4 bg-white hover:bg-paper/40 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted">#{q.id.slice(-6)}</span>
                    <Badge tone="yellow">🔢 ARITMETIKA</Badge>
                    <Badge tone="blue">{q.durationSeconds}s</Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border-2 border-ink px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        q.status === "COMPLETED" || q.status === "TIME_UP"
                          ? "bg-green text-ink"
                          : q.status === "SKIPPED"
                            ? "bg-paper text-muted"
                            : "bg-yellow text-ink"
                      }`}
                    >
                      {q.status}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(q.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl font-black tracking-wide text-ink">
                      {q.expression} = {q.answer}
                    </span>
                  </div>
                  <div className="text-xs font-bold">
                    Pemenang Benar:{" "}
                    <span className="font-mono text-ink">
                      {q.answers?.filter((a) => a.isCorrect).length ?? 0} pemain
                    </span>
                  </div>
                </div>

                {q.answers && q.answers.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {q.answers
                      .filter((a) => a.isCorrect)
                      .map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-1.5 rounded border border-ink bg-green/30 px-2 py-0.5 text-xs font-bold text-ink"
                        >
                          <span className="rounded bg-ink px-1 text-[10px] text-yellow">
                            #{a.rank}
                          </span>
                          <span>@{a.player?.username ?? "user"}</span>
                          <span className="text-[10px] text-muted">+{a.points} pts</span>
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
