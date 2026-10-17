import type { NavItem } from "../types";

/** Admin pages owned by the Susun Kata module. */
export const tekaKataNav: NavItem[] = [
  { href: "/admin/teka-kata/words", icon: "🧩", label: "Bank Kata" },
  { href: "/admin/teka-kata/categories", icon: "📑", label: "Kategori" },
  { href: "/admin/teka-kata/import", icon: "📥", label: "Import CSV" },
  { href: "/admin/teka-kata/history", icon: "📜", label: "Riwayat Puzzle" },
];
