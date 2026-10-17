import type { Metadata } from "next";
import { MathHistoryManager } from "@/games/matematika/admin/HistoryManager";

export const metadata: Metadata = {
  title: "Matematika LIVE — Riwayat Soal",
};

export default function MathHistoryPage() {
  return <MathHistoryManager />;
}
