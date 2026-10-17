import type { NavItem } from "../types";

/** Admin pages owned by the Auto Battle module. */
export const autoBattleNav: NavItem[] = [
  { href: "/admin/battle/gifts", icon: "🎁", label: "Gift → Pasukan" },
  { href: "/admin/battle/settings", icon: "🛡️", label: "Tim & Unit" },
  { href: "/admin/battle/history", icon: "📜", label: "Riwayat Match" },
];
