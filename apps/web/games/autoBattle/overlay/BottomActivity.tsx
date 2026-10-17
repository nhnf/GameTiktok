import { UNIT_META, type BattleFeedItem, type ContributionEntry, type TeamId } from "@tebak-kata/shared";
import { portraitSrc } from "./battleAssets";

/** Bottom strip: latest gift activity (left) + top contributors (right) — PRD §22 "Gift Activity". */
export function BottomActivity({
  feed,
  top,
  teams,
}: {
  feed: BattleFeedItem[];
  top: ContributionEntry[];
  teams: Record<TeamId, { color: string }>;
}) {
  const items = [...feed].reverse().slice(0, 3);
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex h-[152px] gap-3 bg-gradient-to-t from-[#07101F] via-[#0B1730]/95 to-[#0B1730]/70 px-3 pb-3 pt-2">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        {items.length === 0 ? (
          <div className="text-[20px] font-bold text-white/70">🎁 Kirim gift untuk memanggil hero!</div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.id}-${item.count ?? 1}`}
              className="flex animate-pop-in items-center gap-2 rounded-xl border-l-[6px] bg-white/5 px-2 py-1 text-[17px] font-bold"
              style={{ borderColor: item.team ? teams[item.team].color : "#F5C542" }}
            >
              {item.kind === "SPAWN" && item.unitType && item.team ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={portraitSrc(item.team, item.unitType)} alt="" className="h-9 w-9 shrink-0 rounded-full" />
                  <span className="min-w-0 truncate">
                    <span className="text-[#FFE08A]">@{item.viewerName}</span>{" "}
                    {(item.count ?? 1) > 1 ? `×${item.count} ` : ""}
                    <span style={{ color: teams[item.team].color }}>{UNIT_META[item.unitType].label.toUpperCase()}</span>
                  </span>
                </>
              ) : (
                <span className="min-w-0 truncate">{item.text}</span>
              )}
            </div>
          ))
        )}
      </div>
      {top.length > 0 && (
        <div className="flex w-[330px] shrink-0 flex-col justify-center rounded-2xl border-2 border-[#F5C542]/70 bg-[#0B1426]/80 px-3 py-1.5">
          <div className="text-center font-display text-[15px] uppercase tracking-wider text-[#F5C542]">🏆 Top Kontributor</div>
          {top.slice(0, 3).map((c, i) => (
            <div key={c.viewerId} className="flex items-center gap-2 text-[17px] font-bold">
              <span className="w-5 text-center font-mono text-[#F5C542]">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">@{c.viewerName}</span>
              <span className="font-mono text-[15px] text-white/80">{c.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
