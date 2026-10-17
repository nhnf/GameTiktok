import type { Metadata } from "next";
import { TekaKataCsvImport } from "@/games/tekaKata/admin/CsvImport";

export const metadata: Metadata = {
  title: "Susun Kata — Import CSV",
};

export default function TekaKataCsvImportPage() {
  return <TekaKataCsvImport />;
}
