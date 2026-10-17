import { OverlayScreen } from "@/components/overlay/OverlayScreen";
import { parseOverlayOptions } from "@/components/overlay/overlayOptions";

/**
 * OBS / TikTok LIVE Studio browser source (1080×1920). Query params:
 * `bg=paper|yellow|dark|transparent` (`transparent=1` is a legacy alias),
 * `sound=0`, `reducedMotion=1`, `ticker=0`, `howto=0`.
 */
export default function OverlayPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <OverlayScreen options={parseOverlayOptions(searchParams)} />;
}
