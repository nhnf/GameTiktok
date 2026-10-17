"use client";

import { useEffect, useRef } from "react";
import { BATTLE_ARENA, type BattlePublicState, type BattleSnapshot } from "@tebak-kata/shared";
import { BattleRenderer } from "./renderer/BattleRenderer";
import { ARENA_BG_SRC, preloadBattleAssets } from "./battleAssets";
import { Units3D } from "./three/Units3D";
import { FALLBACK_TEAM } from "./battleFormat";
import { ArmyCounts, TopHud } from "./hud";
import { GiftColumn } from "./GiftColumn";
import { BottomActivity } from "./BottomActivity";
import { BattleStartFlash, CountdownCard, LobbyCard, SuddenDeathBadge } from "./PhaseCards";
import { VictoryCard } from "./VictoryCard";

export interface BattleOverlayProps {
  /** Render heroes as 3D models (default) or as 2D sprites for weak PCs (`?hero3d=0`). */
  hero3d?: boolean;
  /** Throttled latest frame (HUD). */
  frame: BattleSnapshot | null;
  /** Every frame, for the canvas. */
  subscribe: (listener: (frame: BattleSnapshot) => void) => () => void;
  /** Low-frequency state from SESSION_STATE (gift guide, bootstrap). */
  state: BattlePublicState | null;
  reducedMotion: boolean;
}

/**
 * Auto Battle Arena overlay, 1080×1920 portrait (PRD §22): canvas arena with
 * a DOM HUD on top — team HP + timer, gift activity, top contributors, the
 * gift → unit legend, and lobby / countdown / victory screens.
 */
export function BattleOverlay({ frame, subscribe, state, reducedMotion, hero3d = true }: BattleOverlayProps) {
  const teams = frame?.teams ?? null;
  const status = frame?.status ?? state?.status ?? "WAITING";
  const phase = status === "PAUSED" ? (frame?.pausedFrom ?? "BATTLE") : status;
  const result = frame?.result ?? state?.result ?? null;
  const guide = state?.giftGuide ?? [];
  const teamInfo = teams ?? state?.config.teams ?? FALLBACK_TEAM;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0B1426] font-ui text-white">
      <ArenaCanvas subscribe={subscribe} reducedMotion={reducedMotion} hero3d={hero3d} />

      <TopHud frame={frame} state={state} />

      {teams && (phase === "BATTLE" || phase === "SUDDEN_DEATH") && <ArmyCounts frame={frame!} />}
      <GiftColumn team="A" guide={guide} teams={teamInfo} />
      <GiftColumn team="B" guide={guide} teams={teamInfo} />
      <BottomActivity feed={frame?.feed ?? []} top={frame?.top ?? []} teams={teamInfo} />

      {phase === "WAITING" && <LobbyCard frame={frame} state={state} />}
      {phase === "COUNTDOWN" && <CountdownCard seconds={frame?.phaseTimeLeft ?? 3} />}
      <BattleStartFlash status={phase} />
      {phase === "SUDDEN_DEATH" && <SuddenDeathBadge />}
      {phase === "ENDED" && result && <VictoryCard result={result} teams={teamInfo} nextIn={frame?.phaseTimeLeft ?? null} />}
      {status === "PAUSED" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45">
          <div className="rounded-3xl border-4 border-[#F5C542] bg-[#101B33]/95 px-14 py-8 text-center shadow-2xl">
            <div className="font-display text-[84px] uppercase leading-none text-[#F5C542]">⏸ Jeda</div>
            <div className="mt-3 text-[28px] font-bold">Gift tetap diterima & masuk antrean</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Three stacked canvases: painted arena + buildings (2D) → 3D heroes (WebGL)
 * → projectiles, numbers and HP bars (2D). If WebGL or the models fail to
 * load, heroes fall back to the 2D character sprites.
 */
function ArenaCanvas({ subscribe, reducedMotion, hero3d }: Pick<BattleOverlayProps, "subscribe" | "reducedMotion" | "hero3d">) {
  const bottomRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const bottom = bottomRef.current?.getContext("2d");
    const top = topRef.current?.getContext("2d");
    const gl = glRef.current;
    if (!bottom || !top || !gl) return;
    preloadBattleAssets();
    const renderer = new BattleRenderer(bottom, top, reducedMotion);
    renderer.paintBackground = false;
    let units3d: Units3D | null = null;
    let cancelled = false;
    if (hero3d) try {
      units3d = new Units3D(gl, (team) => renderer.teamColor(team));
      units3d
        .init()
        .then(() => {
          if (!cancelled && units3d) renderer.attach3D(units3d);
        })
        .catch((err: unknown) => console.warn("[battle] 3D heroes unavailable, using sprites:", err));
    } catch (err) {
      console.warn("[battle] WebGL unavailable, using sprites:", err);
    }
    const unsubscribe = subscribe((f) => renderer.push(f, performance.now()));
    let raf = 0;
    const loop = (t: number) => {
      renderer.draw(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      unsubscribe();
      cancelAnimationFrame(raf);
      units3d?.dispose();
    };
  }, [subscribe, reducedMotion, hero3d]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ARENA_BG_SRC}
        alt=""
        className="absolute left-0 w-[1080px]"
        style={{ top: BATTLE_ARENA.backgroundTop, height: BATTLE_ARENA.backgroundHeight }}
      />
      <canvas ref={bottomRef} width={1080} height={1920} className="absolute inset-0" />
      <canvas ref={glRef} width={1080} height={1920} className="absolute inset-0" />
      <canvas ref={topRef} width={1080} height={1920} className="absolute inset-0" />
    </>
  );
}
