import type { Metadata } from "next";
import { TekaKataHistoryManager } from "@/games/tekaKata/admin/HistoryManager";

export const metadata: Metadata = {
  title: "Susun Kata — Riwayat Puzzle",
};

export default function TekaKataHistoryPage() {
  return <TekaKataHistoryManager />;
}
