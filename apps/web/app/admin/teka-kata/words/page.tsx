import type { Metadata } from "next";
import { TekaKataWordsManager } from "@/games/tekaKata/admin/WordsManager";

export const metadata: Metadata = {
  title: "Susun Kata — Word Bank",
};

export default function TekaKataWordsPage() {
  return <TekaKataWordsManager />;
}
