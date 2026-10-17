import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OverlayPreview } from "@/components/overlay/dev/OverlayPreview";

export const metadata: Metadata = {
  title: "Overlay Preview — Tebak Kata Live",
};

/**
 * PLAN_Redesign_Neo_Brutalism.md §11.3 — drive every overlay state and event
 * with fake data, no server or LIVE needed. Development builds only.
 */
export default function OverlayPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <OverlayPreview />;
}
