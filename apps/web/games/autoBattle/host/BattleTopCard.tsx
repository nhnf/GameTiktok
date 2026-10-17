import type { ContributionEntry } from "@tebak-kata/shared";
import { Card } from "@/components/ui/Card";

/** Top contributors of the current match. */
export function BattleTopCard({ entries }: { entries: ContributionEntry[] }) {
  return (
    <Card padded={false} className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b-3 border-ink bg-ink px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-yellow">🏆 Kontributor match</span>
        <span className="font-mono text-xs text-white/80">skor</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 && <p className="p-4 text-sm font-medium text-muted">Belum ada kontributor di match ini.</p>}
        {entries.map((c, i) => (
          <div key={c.viewerId} className={`border-b-2 border-ink px-3 py-2 ${i === 0 ? "bg-yellow" : i % 2 ? "bg-paper" : "bg-white"}`}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-nb-sm border-2 border-ink bg-ink font-mono text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold">@{c.viewerName}</span>
              <span className="font-mono text-sm font-bold">{c.score}</span>
            </div>
            <div className="mt-1 pl-8 text-[10px] font-bold uppercase text-muted">
              {c.unitsSpawned} unit (🔵{c.teamAUnits} 🔴{c.teamBUnits}) · dmg {c.damage.toLocaleString("id-ID")}
              {c.healing > 0 ? ` · heal ${c.healing.toLocaleString("id-ID")}` : ""}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
