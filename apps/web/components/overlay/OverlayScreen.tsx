"use client";

import { useEffect } from "react";
import { useGameSocket } from "@/lib/useGameSocket";
import { OverlayView } from "./OverlayView";
import { ScaledStage } from "./ScaledStage";
import { OVERLAY_HEIGHT, OVERLAY_WIDTH, type OverlayOptions } from "./overlayOptions";

/**
 * OBS / TikTok LIVE Studio browser source. Connects to the public overlay
 * socket and renders `OverlayView`; all visuals live in the view so the dev
 * preview (`/dev/overlay-preview`) can drive the exact same component.
 */
export function OverlayScreen({ options }: { options: OverlayOptions }) {
  const { status, publicState, lastEvent, chatLog, battleFrame, subscribeBattle, subscribeEvents } = useGameSocket("overlay");
  useTransparentDocument(options.background === "transparent");

  return (
    <div className={`h-screen w-screen overflow-hidden ${options.background === "dark" ? "bg-ink" : ""}`}>
      <ScaledStage width={OVERLAY_WIDTH} height={OVERLAY_HEIGHT}>
        <OverlayView
          connection={status}
          state={publicState}
          lastEvent={lastEvent}
          chatLog={chatLog}
          options={options}
          battleFrame={battleFrame}
          subscribeBattle={subscribeBattle}
          subscribeEvents={subscribeEvents}
        />
      </ScaledStage>
    </div>
  );
}

/** The root layout paints html/body paper; a transparent browser source needs both cleared. */
function useTransparentDocument(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const { documentElement: html, body } = document;
    const previous = [html.style.background, body.style.background];
    html.style.background = "transparent";
    body.style.background = "transparent";
    return () => {
      html.style.background = previous[0];
      body.style.background = previous[1];
    };
  }, [enabled]);
}
