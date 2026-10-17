import type { Metadata } from "next";
import { TekaKataCategoriesManager } from "@/games/tekaKata/admin/CategoriesManager";

export const metadata: Metadata = {
  title: "Susun Kata — Kategori",
};

export default function TekaKataCategoriesPage() {
  return <TekaKataCategoriesManager />;
}
