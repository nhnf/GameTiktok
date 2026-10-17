import { GAME_INFO, type GameType } from "@tebak-kata/shared";
import type { NavItem } from "./types";
import { tebakKataNav } from "./tebakKata/meta";
import { tekaKataNav } from "./tekaKata/meta";
import { matematikaNav } from "./matematika/meta";
import { mathBattleNav } from "./mathBattle/meta";
import { autoBattleNav } from "./autoBattle/meta";

export interface NavSection {
  title: string;
  items: NavItem[];
}

const GAME_NAV: [GameType, NavItem[]][] = [
  ["TEBAK_KATA", tebakKataNav],
  ["TEKA_KATA", tekaKataNav],
  ["MATEMATIKA", matematikaNav],
  ["MATEMATIKA_BATTLE", mathBattleNav],
  ["AUTO_BATTLE", autoBattleNav],
];

/** Sidebar navigation: host dashboard, one section per game module, then platform pages. */
export const NAV_SECTIONS: NavSection[] = [
  { title: "LIVE Control", items: [{ href: "/host", icon: "🎮", label: "Host Dashboard" }] },
  ...GAME_NAV.map(([game, items]) => ({ title: GAME_INFO[game].label, items })),
  {
    title: "Platform",
    items: [
      { href: "/admin/gifts", icon: "🎁", label: "Gift LIVE" },
      { href: "/admin/settings", icon: "⚙️", label: "Pengaturan" },
    ],
  },
];
