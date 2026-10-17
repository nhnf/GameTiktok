"use client";

import { useEffect, useState } from "react";
import { battleApi, type BattleMatchDTO } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

const REASON: Record<string, string> = {
  BASE_DESTROYED: "Base hancur",
  TIMER_HP: "Waktu habis (HP)",
  SUDDEN_DEATH: "Sudden Death",
  HOST: "Diakhiri host",
};

function duration(s: number | null): string {
  if (s === null) return "-";
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}d`;
}

/** PRD §36 — Match History. */
export function BattleHistoryManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [matches, setMatches] = useState<BattleMatchDTO[] | null>(null);

  useEffect(() => {
    battleApi
      .history(token, 50)
      .then(setMatches)
      .catch((err: unknown) => toast(errorMessage(err, "Gagal memuat riwayat."), "error"));
  }, [token, toast]);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader title="Riwayat Match" description="Hasil setiap match Auto Battle beserta kontributor teratas." count={matches?.length} />
      {matches === null ? (
        <p className="text-sm font-medium text-muted">Memuat...</p>
      ) : matches.length === 0 ? (
        <Card>
          <p className="text-sm font-medium text-muted">Belum ada match yang selesai.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const winnerName = m.winner === "A" ? m.teamAName : m.winner === "B" ? m.teamBName : "-";
            return (
              <Card key={m.id} className="!p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-nb-sm border-2 border-ink bg-ink px-2 py-0.5 font-mono text-xs font-bold text-white">#{m.matchNumber}</span>
                  <span className="text-base font-black">
                    🏆 {winnerName} <span className="text-sm font-bold text-muted">({m.reason ? (REASON[m.reason] ?? m.reason) : "-"})</span>
                  </span>
                  <span className="ml-auto font-mono text-xs text-muted">{new Date(m.startedAt).toLocaleString("id-ID")}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center md:grid-cols-6">
                  {(
                    [
                      ["Durasi", duration(m.duration)],
                      ["Total gift", m.totalGifts],
                      [`Gift ${m.teamAName}`, m.teamAGifts],
                      [`Gift ${m.teamBName}`, m.teamBGifts],
                      ["Unit", m.unitsSpawned],
                      ["HP base A / B", `${m.teamABaseHp ?? "-"} / ${m.teamBBaseHp ?? "-"}`],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-nb-sm border-2 border-ink bg-paper px-2 py-1.5">
                      <div className="truncate text-[10px] font-bold uppercase text-muted">{label}</div>
                      <div className="font-mono text-sm font-bold">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</div>
                    </div>
                  ))}
                </div>
                {m.contributions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.contributions.map((c, i) => (
                      <span key={c.viewerId} className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold">
                        {i + 1}. @{c.viewerName} · {c.score} skor · {c.unitsSpawned} unit
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
