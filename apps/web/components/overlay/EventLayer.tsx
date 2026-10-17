"use client";

import { useEffect, useRef, useState } from "react";
import type { GameStatePublic } from "@tebak-kata/shared";
import { playSfx } from "@/lib/sound";
import type { BannerSpec, OverlayEvent, OverlayGameModule } from "@/games/overlayTypes";
import { Confetti } from "./widgets/Confetti";

interface EventLayerProps {
  /** Latest event (used only when no lossless `subscribe` stream is given, e.g. the dev preview). */
  event: OverlayEvent | null;
  subscribe?: (listener: (event: OverlayEvent) => void) => () => void;
  state: GameStatePublic | null;
  game: OverlayGameModule;
  soundEnabled?: boolean;
  reducedMotion?: boolean;
}

type ShownBanner = BannerSpec & { id: number };

/**
 * Celebration layer above the stage. The active game module turns realtime
 * events into banners; queued banners (e.g. "puzzle completed" right after
 * "word found") wait for the current one instead of cutting it off.
 */
export function EventLayer({ event, subscribe, state, game, soundEnabled = true, reducedMotion = false }: EventLayerProps) {
  const [banner, setBanner] = useState<ShownBanner | null>(null);
  const queue = useRef<ShownBanner[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const showing = useRef(false);
  // Latest props for the event handler (it outlives renders).
  const latest = useRef({ game, state, soundEnabled });
  latest.current = { game, state, soundEnabled };

  const handler = useRef<(e: OverlayEvent) => void>(() => {});
  handler.current = (e: OverlayEvent) => {
    const { game: g, state: s, soundEnabled: sound } = latest.current;
    const show = (next: ShownBanner) => {
      clearTimeout(timer.current);
      showing.current = true;
      if (next.sound) playSfx(next.sound, sound);
      setBanner(next);
      timer.current = setTimeout(() => {
        const following = queue.current.shift();
        if (following) show(following);
        else {
          showing.current = false;
          setBanner(null);
        }
      }, next.durationMs);
    };

    if (e.type === "LETTER_REVEALED" || e.type === "TK_LETTER_REVEALED") {
      playSfx(e.payload.source === "HINT" ? "hint" : "letterReveal", sound);
      return;
    }
    if (e.type === "GAME_CHANGED" || e.type === "SESSION_ENDED") {
      // A new game/session must not inherit leftover banners.
      queue.current = [];
      clearTimeout(timer.current);
      showing.current = false;
      setBanner(null);
      return;
    }
    const spec = g.toBanner?.(e, s);
    if (!spec) return;
    const next = { ...spec, id: e.seq };
    if (spec.queue && showing.current) {
      queue.current.push(next);
      return;
    }
    queue.current = [];
    show(next);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  // Lossless stream: every event, even several in one burst.
  useEffect(() => {
    if (!subscribe) return;
    return subscribe((e) => handler.current(e));
  }, [subscribe]);

  // Fallback for callers without a stream (dev preview).
  useEffect(() => {
    if (subscribe || !event) return;
    handler.current(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.seq, subscribe]);

  if (!banner) return null;
  const motion = !reducedMotion;

  return (
    <div className={`pointer-events-none absolute inset-0 z-40 ${banner.dim ? "bg-ink/70" : ""}`}>
      {motion && banner.confetti && <Confetti key={banner.id} seed={banner.id} />}
      {banner.placement === "free" ? (
        <div key={banner.id}>{banner.render(motion)}</div>
      ) : (
        <div className="absolute inset-x-0 top-[400px] flex h-[860px] items-center justify-center">
          <div key={banner.id} className={motion ? "animate-shake" : ""}>
            {banner.render(motion)}
          </div>
        </div>
      )}
    </div>
  );
}
