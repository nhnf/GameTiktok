import type { TeamId, UnitType } from "@tebak-kata/shared";
import type { BattleMappingInput } from "../api";

export const TEAM_LABEL: Record<TeamId, string> = { A: "Team A · Biru", B: "Team B · Merah" };
export const TEAM_TONE: Record<TeamId, string> = { A: "#2F7BFF", B: "#FF3B3B" };

export const EMPTY_FORM: BattleMappingInput = { giftId: "", giftName: "", team: "A", unitType: "SPEARMAN", quantity: 1, enabled: true, diamondCount: null, imageUrl: null };

/** Hero face rendered from the 3D model. */
export function UnitIcon({ team, unit, size = 28 }: { team: TeamId; unit: UnitType; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/battle/portraits/${team}_${unit}.png`}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full border-2"
      style={{ borderColor: TEAM_TONE[team], background: `${TEAM_TONE[team]}33` }}
    />
  );
}

export function GiftIcon({ url, size = 28 }: { url?: string | null; size?: number }) {
  if (!url) return <span style={{ fontSize: size * 0.8 }}>🎁</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" width={size} height={size} className="shrink-0 object-contain" referrerPolicy="no-referrer" />;
}
