import type { LeaderboardEntry } from "@tebak-kata/shared";
import { Card } from "@/components/ui/Card";

export function LeaderboardCard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Card padded={false} className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b-3 border-ink bg-ink px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-yellow">🏆 Leaderboard</span>
        <span className="font-mono text-xs text-white/80">{entries.length} pemain</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 && <p className="p-4 text-sm font-medium text-muted">Belum ada pemain.</p>}
        {entries.map((entry, index) => (
          <div
            key={entry.userId}
            className={`flex h-12 items-center gap-3 border-b-2 border-ink px-3 ${index === 0 ? "bg-yellow" : index % 2 === 1 ? "bg-paper" : "bg-white"}`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-nb-sm border-2 border-ink bg-ink font-mono text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{entry.username}</span>
            <span className="shrink-0 text-[11px] font-bold uppercase text-muted">{entry.wins} menang</span>
            <span className="w-12 shrink-0 text-right font-mono text-sm font-bold">{entry.points}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
