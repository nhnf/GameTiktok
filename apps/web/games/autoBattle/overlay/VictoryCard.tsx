import type { ContributionEntry, MatchResult, TeamId } from "@tebak-kata/shared";
import { REASON_TEXT, formatClock, formatNumber } from "./battleFormat";

export function VictoryCard({
  result,
  teams,
  nextIn,
}: {
  result: MatchResult;
  teams: Record<TeamId, { name: string; color: string }>;
  nextIn: number | null;
}) {
  const winner = teams[result.winner];
  const damage = result.teams.A.damageDealt + result.teams.B.damageDealt;
  const building = result.teams.A.buildingDamage + result.teams.B.buildingDamage;
  const mvps: Array<[string, ContributionEntry | null, (c: ContributionEntry) => string]> = [
    ["Unit terbanyak", result.mvp.mostUnits, (c) => `${c.unitsSpawned} unit`],
    ["Damage terbesar", result.mvp.mostDamage, (c) => formatNumber(c.damage)],
    ["Perusak bangunan", result.mvp.mostBuildingDamage, (c) => formatNumber(c.buildingDamage)],
    ["Healer terbaik", result.mvp.mostHealing, (c) => `+${formatNumber(c.healing)}`],
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 px-10">
      <div className="w-full animate-drop-in rounded-[32px] border-4 border-[#F5C542] bg-[#0B1426]/95 p-8 text-center shadow-2xl">
        <div className="text-[90px] leading-none">🏆</div>
        <div className="mt-2 font-display text-[72px] uppercase leading-none drop-shadow-[0_5px_0_rgba(0,0,0,0.6)]" style={{ color: winner.color }}>
          {winner.name}
        </div>
        <div className="font-display text-[56px] uppercase leading-tight text-[#FFE08A]">Menang!</div>
        <div className="mt-1 text-[24px] font-bold text-white/80">{REASON_TEXT[result.reason]}</div>

        <div className="mt-6 grid grid-cols-4 gap-3">
          {(
            [
              ["Durasi", formatClock(result.durationSeconds)],
              ["Gift", formatNumber(result.totalGifts)],
              ["Damage", formatNumber(damage)],
              ["Bangunan", formatNumber(building)],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-2xl border-2 border-white/15 bg-white/5 py-3">
              <div className="text-[16px] font-bold uppercase tracking-wider text-white/60">{label}</div>
              <div className="font-mono text-[30px] font-bold">{value}</div>
            </div>
          ))}
        </div>

        {result.topContributors.length > 0 && (
          <div className="mt-6 text-left">
            <div className="mb-2 text-center font-display text-[24px] uppercase tracking-wider text-[#F5C542]">Top Kontributor</div>
            <div className="flex flex-col gap-1.5">
              {result.topContributors.slice(0, 5).map((c, i) => (
                <div key={c.viewerId} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2 text-[24px] font-bold">
                  <span className="w-8 font-mono text-[#F5C542]">#{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">@{c.viewerName}</span>
                  <span className="text-[18px] text-white/60">{c.unitsSpawned} unit</span>
                  <span className="w-20 text-right font-mono">{c.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          {mvps
            .filter(([, entry]) => entry)
            .map(([label, entry, value]) => (
              <div key={label} className="rounded-xl border border-white/15 px-3 py-2 text-left">
                <div className="text-[15px] font-bold uppercase text-white/60">{label}</div>
                <div className="flex items-center justify-between gap-2 text-[20px] font-bold">
                  <span className="min-w-0 truncate">@{entry!.viewerName}</span>
                  <span className="font-mono text-[#FFE08A]">{value(entry!)}</span>
                </div>
              </div>
            ))}
        </div>

        {nextIn !== null && <div className="mt-5 text-[22px] font-bold text-white/70">Kembali ke lobby dalam {nextIn} dtk…</div>}
      </div>
    </div>
  );
}
