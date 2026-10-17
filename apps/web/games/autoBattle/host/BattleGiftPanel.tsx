"use client";

import { useEffect, useState } from "react";
import { UNIT_META, type BattleGiftLogView, type BattleHostState } from "@tebak-kata/shared";
import { errorMessage } from "@/lib/errors";
import { Card } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { battleApi } from "../api";
import { REJECT_TEXT } from "./labels";

/** Test-gift buttons (same path as a real TikTok gift) + the live gift log. */
export function BattleGiftPanel({ token, battle, log }: { token: string; battle: BattleHostState | null; log: BattleGiftLogView[] }) {
  const [count, setCount] = useState(1);
  const [username, setUsername] = useState("tester");
  const [error, setError] = useState<string | null>(null);
  const [initialLog, setInitialLog] = useState<BattleGiftLogView[]>([]);
  const mappings = battle?.mappings ?? [];

  // Live entries arrive over the socket; fetch the server's recent log once so
  // a page reload doesn't start from an empty list.
  useEffect(() => {
    battleApi.giftLog(token).then(setInitialLog).catch(() => {});
  }, [token]);
  const liveIds = new Set(log.map((l) => l.id));
  const entries = [...log, ...initialLog.filter((l) => !liveIds.has(l.id))].slice(0, 40);

  const send = async (mappingId: string) => {
    setError(null);
    try {
      await battleApi.testGift(token, { mappingId, count, username: username.trim() || "tester" });
    } catch (err) {
      setError(errorMessage(err, "Gagal mengirim gift tes."));
    }
  };

  return (
    <Card padded={false} className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b-3 border-ink bg-ink px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-yellow">🎁 Gift battle</span>
        <span className="font-mono text-xs text-white/80">{entries.length} terakhir</span>
      </div>

      <div className="border-b-3 border-ink bg-paper p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-black uppercase">Tes gift</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="nb-input h-8 w-28 px-2 text-xs"
            aria-label="Nama penonton tes"
          />
          <span className="text-[11px] font-bold uppercase text-muted">×</span>
          {[1, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={`h-8 rounded-nb-sm border-2 border-ink px-2 font-mono text-xs font-bold ${count === n ? "bg-ink text-white" : "bg-white"}`}
            >
              {n}
            </button>
          ))}
        </div>
        {error && <ErrorNote message={error} className="mb-2" />}
        {(["A", "B"] as const).map((team) => (
          <div key={team} className="mb-1.5 grid grid-cols-4 gap-1.5">
            {mappings
              .filter((m) => m.team === team && m.enabled)
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  title={`${m.giftName} → ${UNIT_META[m.unitType].label} ×${m.quantity}`}
                  onClick={() => void send(m.id)}
                  className="flex min-w-0 items-center gap-1 rounded-nb-sm border-2 border-ink bg-white px-1.5 py-1 text-left text-[11px] font-bold transition-transform hover:-translate-y-px active:translate-y-px"
                  style={{ boxShadow: `3px 3px 0 0 ${battle?.config.teams[team].color ?? "#000"}` }}
                >
                  {m.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imageUrl} alt="" className="h-7 w-7 shrink-0 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="shrink-0">🎁</span>
                  )}
                  <span className="flex-1 text-center font-black text-muted">➜</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/battle/portraits/${team}_${m.unitType}.png`} alt="" className="h-7 w-7 shrink-0 rounded-full" />
                </button>
              ))}
          </div>
        ))}
        <p className="text-[10px] font-medium text-muted">Tes memakai jalur yang sama persis dengan gift TikTok asli.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 && <p className="p-4 text-sm font-medium text-muted">Belum ada gift masuk.</p>}
        {entries.map((entry, i) => (
          <div key={entry.id} className={`flex items-center gap-2 border-b-2 border-ink px-3 py-2 text-xs ${i % 2 ? "bg-paper" : "bg-white"}`}>
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full border border-ink ${entry.ok ? "bg-green" : "bg-red"}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">
                @{entry.viewerName} · {entry.giftName}
                {entry.count > 1 ? ` ×${entry.count}` : ""}
              </div>
              <div className="truncate text-[11px] text-muted">
                {entry.ok && entry.team && entry.unitType
                  ? `→ Team ${entry.team} · ${UNIT_META[entry.unitType].label} ×${entry.quantity}${entry.queued ? ` (${entry.queued} antre)` : ""}`
                  : `✕ ${entry.reason ? REJECT_TEXT[entry.reason] : "Ditolak"} · id ${entry.giftId}`}
              </div>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-muted">{new Date(entry.at).toLocaleTimeString("id-ID")}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
