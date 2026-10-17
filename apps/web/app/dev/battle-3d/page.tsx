import { notFound } from "next/navigation";
import { Hero3DPreview } from "@/games/autoBattle/dev/Hero3DPreview";

/** Dev-only: every 3D hero side by side (+ `?portraits=1` bakes the portrait PNGs). */
export default function Battle3DPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Hero3DPreview />;
}
