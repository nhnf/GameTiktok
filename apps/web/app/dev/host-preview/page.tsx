import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HostPreview } from "@/components/host/dev/HostPreview";

export const metadata: Metadata = {
  title: "Host Preview — Tebak Kata Live",
};

/** Dev-only: host dashboard rendered with fake data — no server, token, or LIVE needed. */
export default function HostPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <HostPreview />;
}
