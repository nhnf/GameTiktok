"use client";

import { useCallback, useEffect, useState } from "react";
import { mathBattleApi } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

interface MatchItem {
  id: string;
  matchNumber: number;
  winner: string | null;
  winningReason: string | null;
  totalRounds: number;
  completedRounds: number;
  finalRopePosition: number;
  blueTotalPower: number;
  redTotalPower: number;
  startedAt: string;
  rounds?: any[];
}

export function MathBattleHistoryManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [items, setItems] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await mathBattleApi.history(token);
      setItems((res.items as MatchItem[]) ?? []);
    } catch (err) {
      toast(errorMessage(err, "Gagal memuat riwayat."), "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Riwayat Match Tarik Tambang"
        description="Daftar pertandingan Matematika Tarik Tambang LIVE yang telah selesai."
      />

      <Card tone="white">
        <CardTitle>Riwayat Pertandingan ({items.length})</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-xs font-black uppercase text-muted">
                <th className="py-2">Waktu</th>
                <th className="py-2">Pemenang</th>
                <th className="py-2">Alasan Kemenangan</th>
                <th className="py-2">Ronde</th>
                <th className="py-2">Posisi Tali</th>
                <th className="py-2">Power Biru vs Merah</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-muted">
                    Memuat riwayat...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-muted">
                    Belum ada riwayat pertandingan.
                  </td>
                </tr>
              ) : (
                items.map((m) => {
                  const isBlue = m.winner === "BLUE";
                  const isRed = m.winner === "RED";
                  return (
                    <tr key={m.id} className="border-b border-ink/20">
                      <td className="py-3 text-xs text-muted">
                        {new Date(m.startedAt).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-black ${
                            isBlue
                              ? "bg-[#dbeafe] text-[#1d4ed8]"
                              : isRed
                                ? "bg-[#fee2e2] text-[#b91c1c]"
                                : "bg-paper text-ink"
                          }`}
                        >
                          {isBlue ? "🔵 TIM BIRU" : isRed ? "🔴 TIM MERAH" : "⚖ IMBANG"}
                        </span>
                      </td>
                      <td className="py-3 font-medium">
                        {m.winningReason === "WIN_LINE"
                          ? "Garis Kemenangan"
                          : m.winningReason === "FULL_ROUNDS"
                            ? "Semua Ronde Selesai"
                            : "Host"}
                      </td>
                      <td className="py-3 font-mono font-bold">
                        {m.completedRounds} / {m.totalRounds}
                      </td>
                      <td className="py-3 font-mono font-bold">{m.finalRopePosition}</td>
                      <td className="py-3 font-mono font-bold">
                        <span className="text-[#1d4ed8]">{m.blueTotalPower}</span>
                        {" vs "}
                        <span className="text-[#b91c1c]">{m.redTotalPower}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
