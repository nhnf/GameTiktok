import { UNIT_META, type BattleGiftMapping, type TeamId } from "@tebak-kata/shared";
import { portraitSrc } from "./battleAssets";

// ---------------------------------------------------------------------------
// Side columns: gift activity (left) + top contributors (right)
// ---------------------------------------------------------------------------

/** Gift → hero list for one team, stacked down the side of the arena. */
export function GiftColumn({ team, guide, teams }: { team: TeamId; guide: BattleGiftMapping[]; teams: Record<TeamId, { name: string; color: string }> }) {
  const items = guide.filter((m) => m.team === team).slice(0, 8);
  if (items.length === 0) return null;
  const color = teams[team].color;
  return (
    <div className={`absolute top-[196px] z-20 flex w-[236px] flex-col gap-[7px] ${team === "A" ? "left-2" : "right-2"}`}>
      <div className="rounded-xl px-2 py-1.5 text-center font-display text-[17px] uppercase leading-tight shadow-lg" style={{ background: color }}>
        {teams[team].name}
        <div className="font-ui text-[13px] font-bold normal-case opacity-90">Kirim gift ⬇ panggil hero</div>
      </div>
      {items.map((m) => (
        <div
          key={m.id}
          className="flex h-[150px] flex-col justify-center rounded-2xl border-2 bg-[#0B1426]/85 px-2 py-1.5 shadow-lg"
          style={{ borderColor: `${color}AA` }}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-xl bg-white/10">
              {m.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.imageUrl} alt="" className="h-[66px] w-[66px] object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-[44px]">🎁</span>
              )}
            </div>
            <span className="text-[26px] font-black text-[#F5C542]">➜</span>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portraitSrc(team, m.unitType)}
                alt=""
                className="h-[86px] w-[86px] rounded-full border-[3px] object-cover"
                style={{ borderColor: color, background: `radial-gradient(circle at 50% 35%, ${color}88, #0B1426)` }}
              />
              {m.quantity > 1 && (
                <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-[#0B1426] bg-[#F5C542] px-1.5 text-[15px] font-black text-[#0B1426]">
                  ×{m.quantity}
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1 text-[15px] font-bold leading-tight">
            <span className="min-w-0 truncate">{m.giftName}</span>
            <span className="shrink-0 font-display text-[14px] uppercase" style={{ color }}>
              {UNIT_META[m.unitType].label}
            </span>
          </div>
          {m.diamondCount ? (
            <div className="flex items-center gap-1 text-[12px] font-bold text-[#FFE08A]">
              <span className="inline-block h-3 w-3 rounded-full border border-[#B8860B] bg-gradient-to-br from-[#FFE08A] to-[#E3A21A]" aria-hidden />
              {m.diamondCount} koin
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
