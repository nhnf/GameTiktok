import type { EngagementStats } from "@tebak-kata/shared";
import type { StatItem } from "@/games/hostTypes";

/** Design System §23 — bottom SESSION STATS bar: shared engagement numbers + the active game's counters. */
export function SessionStatsBar({ stats, items }: { stats: EngagementStats; items: StatItem[] }) {
  const all: StatItem[] = [
    { label: "Pemain", value: stats.totalPlayers, tone: "bg-blue" },
    { label: "Komentar", value: stats.totalComments, tone: "bg-white" },
    { label: "Tebakan/jawaban", value: stats.totalValidGuesses, tone: "bg-yellow" },
    ...items,
    { label: "Gift", value: stats.totalGifts, tone: "bg-pink" },
  ];

  return (
    <div className="flex h-[72px] shrink-0 items-center gap-3 overflow-x-auto border-t-3 border-ink bg-paper px-5">
      {all.map((item) => (
        <div key={item.label} className={`flex shrink-0 items-baseline gap-2 rounded-nb-sm border-2 border-ink px-3 py-1.5 shadow-nb-sm ${item.tone}`}>
          <span className="font-mono text-lg font-bold leading-none">{item.value.toLocaleString("id-ID")}</span>
          <span className="text-[11px] font-bold uppercase tracking-wide">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
