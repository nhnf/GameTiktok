"use client";

import { useEffect, useRef, useState } from "react";
import { UNIT_TYPES, type TeamId, type UnitType } from "@tebak-kata/shared";
import { ARENA_BG_SRC } from "../overlay/battleAssets";
import { Units3D, type UnitRenderState } from "../overlay/three/Units3D";
import { HERO_SPECS, loadHeroLibrary, renderPortrait } from "../overlay/three/unitModels";

const COLORS: Record<TeamId, string> = { A: "#2F7BFF", B: "#FF3B3B" };

/**
 * Dev harness for the 3D heroes: all 8 units × 2 teams on the arena, cycling
 * idle → walk → attack → skill so models, weapons, team colours and
 * animations can be checked at overlay scale.
 */
export function Hero3DPreview() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [portraits, setPortraits] = useState<Record<string, string>>({});

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const big = new URLSearchParams(window.location.search).get("big") === "1";
    const w = window as unknown as { __bigHeroes?: boolean };
    if (big && !w.__bigHeroes) {
      w.__bigHeroes = true; // strict mode runs effects twice — scale once
      for (const spec of Object.values(HERO_SPECS)) spec.height *= 3;
    }
    const units3d = new Units3D(canvas, (t) => COLORS[t]);
    (window as unknown as { __units3d?: Units3D }).__units3d = units3d;
    const born = performance.now();
    const units: UnitRenderState[] = [];
    UNIT_TYPES.forEach((type, i) => {
      for (const team of ["A", "B"] as const) {
        units.push({
          id: units.length + 1,
          team,
          type,
          x: big ? 190 + (i % 4) * 240 : 330 + (i % 4) * 140,
          y: big ? (team === "A" ? 560 : 1360) + Math.floor(i / 4) * 330 : (team === "A" ? 620 : 1180) + Math.floor(i / 4) * 200,
          moving: false,
          state: "IDLE",
          facing: team === "A" ? 1 : -1,
          flags: 0,
          bornAt: born,
          diedAt: null,
        });
      }
    });
    let raf = 0;
    let last = performance.now();
    let phase = -1;
    void units3d.init().then(() => {
      const loop = (now: number) => {
        const t = (now - born) / 1000;
        const p = Math.floor(t / 2) % 4; // 0 idle, 1 walk, 2 attack, 3 skill
        for (const u of units) {
          u.moving = p === 1;
          u.state = p >= 2 ? "ATTACKING" : p === 1 ? "MOVING" : "IDLE";
        }
        if (p !== phase && (p === 2 || p === 3)) for (const u of units) units3d.trigger(u.id, p === 2 ? "atk" : "skill", now);
        phase = p;
        units3d.render(units, now, now - last, 0, 0);
        last = now;
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    if (new URLSearchParams(window.location.search).get("portraits") === "1") {
      void loadHeroLibrary().then((lib) => {
        const out: Record<string, string> = {};
        for (const type of UNIT_TYPES as UnitType[]) for (const team of ["A", "B"] as const) out[`${team}_${type}`] = renderPortrait(lib, type, team, COLORS[team]);
        (window as unknown as { __portraits: Record<string, string> }).__portraits = out;
        setPortraits(out);
      });
    }
    return () => {
      cancelAnimationFrame(raf);
      units3d.dispose();
    };
  }, []);

  return (
    <div className="flex gap-6 bg-[#0B1426] p-4">
      <div className="relative h-[1920px] w-[1080px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ARENA_BG_SRC} alt="" className="absolute left-0 top-[150px] h-[1617px] w-[1080px]" />
        <canvas ref={ref} width={1080} height={1920} className="absolute inset-0" />
      </div>
      {Object.keys(portraits).length > 0 && (
        <div className="grid h-fit grid-cols-4 gap-2" data-portraits-ready>
          {Object.entries(portraits).map(([k, url]) => (
            <div key={k} className="rounded-xl p-1 text-center text-xs text-white" style={{ background: k.startsWith("A") ? "#2F7BFF55" : "#FF3B3B55" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={k} width={96} height={96} />
              {k}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
