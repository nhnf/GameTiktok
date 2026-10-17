import type { BattleFx, BattleSnapshot, TeamId } from "@tebak-kata/shared";
import type { Units3D } from "../three/Units3D";
import {
  DEFAULT_COLORS,
  MAX_NUMBERS,
  MAX_PARTICLES,
  SHOT_DURATION,
  hexToRgba,
  lerp,
  makeCracks,
  type Effect,
  type Particle,
  type StructVis,
  type UnitVis,
} from "./rendererTypes";

/**
 * Renderer state: frame intake (interpolation targets), effect spawning and
 * particles. Drawing lives in the subclasses (rendererUnits.ts, BattleRenderer.ts).
 */
export abstract class RendererState {
  protected matchId = "";
  protected units = new Map<number, UnitVis>();
  protected structures: StructVis[] = [];
  protected effects: Effect[] = [];
  protected particles: Particle[] = [];
  protected lastPushAt = 0;
  protected interval = 100;
  protected lastDraw = 0;
  protected shake = 0;
  protected colors: Record<TeamId, string> = { ...DEFAULT_COLORS };
  protected frame: BattleSnapshot | null = null;
  protected readonly fonts: { display: string; mono: string };
  /** Canvas currently being drawn (switches between the bottom and top layers). */
  protected ctx: CanvasRenderingContext2D;
  protected units3d: Units3D | null = null;
  /**
   * Repainting the 1080×1617 arena image every frame is the single most
   * expensive 2D call; the overlay shows it as a static <img> underneath
   * instead and turns this off.
   */
  paintBackground = true;

  /**
   * `bottom` holds the arena, buildings and ground marks; `top` (above the 3D
   * heroes) holds projectiles, damage numbers, HP bars and particles. Without
   * a `top` canvas everything, including 2D sprite heroes, goes on `bottom`.
   */
  constructor(
    protected readonly bottom: CanvasRenderingContext2D,
    protected readonly top: CanvasRenderingContext2D | null,
    protected readonly reducedMotion: boolean,
  ) {
    this.ctx = bottom;
    // Canvas can't resolve CSS variables; read the next/font family names once.
    const css = getComputedStyle(document.body);
    this.fonts = {
      display: css.getPropertyValue("--font-display").trim() || "sans-serif",
      mono: css.getPropertyValue("--font-mono").trim() || "monospace",
    };
  }

  teamColor(team: TeamId): string {
    return this.colors[team];
  }

  /** Draw heroes in 3D from now on (sprites are used until it's ready). */
  attach3D(units3d: Units3D): void {
    this.units3d = units3d;
  }

  protected get use3D(): boolean {
    return this.units3d?.ready === true && this.top !== null;
  }

  // -------------------------------------------------------------------------
  // Frame intake
  // -------------------------------------------------------------------------

  push(frame: BattleSnapshot, now: number): void {
    if (frame.matchId !== this.matchId) {
      this.matchId = frame.matchId;
      this.units.clear();
      this.effects = [];
      this.particles = [];
    }
    if (this.lastPushAt > 0) this.interval = Math.min(250, Math.max(50, lerp(this.interval, now - this.lastPushAt, 0.3)));
    this.lastPushAt = now;
    this.frame = frame;
    this.colors = { A: frame.teams.A.color || DEFAULT_COLORS.A, B: frame.teams.B.color || DEFAULT_COLORS.B };

    const seen = new Set<number>();
    for (const [id, team, type, x, y, hp, state, facing, flags] of frame.units) {
      seen.add(id);
      let u = this.units.get(id);
      if (!u) {
        u = { id, team, type, fromX: x, fromY: y, toX: x, toY: y, x, y, hp, state, facing, flags, bornAt: now, diedAt: null, flashUntil: 0, moving: false };
        this.units.set(id, u);
      }
      u.fromX = u.x;
      u.fromY = u.y;
      u.toX = x;
      u.toY = y;
      u.moving = Math.hypot(x - u.fromX, y - u.fromY) > 0.8;
      if (hp < u.hp) u.flashUntil = now + 130;
      if (state === "DEATH" && u.diedAt === null) u.diedAt = now;
      u.hp = hp;
      u.state = state;
      u.facing = facing;
      u.flags = flags;
    }
    for (const [id, u] of this.units) {
      if (seen.has(id)) continue;
      // Keep fallen 3D heroes around long enough to play their death animation.
      if (u.diedAt !== null && now - u.diedAt < 2200 && this.use3D) {
        u.fromX = u.toX = u.x;
        u.fromY = u.toY = u.y;
        u.moving = false;
        continue;
      }
      this.units.delete(id);
    }

    const prev = new Map(this.structures.map((s) => [s.id, s]));
    this.structures = frame.structures.map((s) => {
      const old = prev.get(s.id);
      return {
        ...s,
        flashUntil: old && s.hp < old.hp ? now + 120 : (old?.flashUntil ?? 0),
        cracks: old?.cracks ?? makeCracks(s.id, s.radius),
      };
    });

    for (const fx of frame.fx) this.addFx(fx, now);
  }

  protected addFx(fx: BattleFx, now: number): void {
    switch (fx.k) {
      case "shot":
        this.effects.push({ k: "shot", start: now, dur: SHOT_DURATION[fx.style] ?? 250, from: fx.from, to: fx.to, team: fx.team, style: fx.style });
        break;
      case "hit": {
        // Merge with a recent number nearby instead of stacking unreadable
        // digits on top of each other (PRD §26 aggregation).
        const color = fx.heal ? "#5BFF7A" : "#FFFFFF";
        const near = this.effects.find(
          (e): e is Extract<Effect, { k: "number" }> =>
            e.k === "number" && e.heal === Boolean(fx.heal) && now - e.start < 350 && Math.abs(e.x - fx.x) < 60 && Math.abs(e.y - (fx.y - 36)) < 50,
        );
        if (near) {
          near.amount += fx.amount;
          near.text = `${fx.heal ? "+" : "-"}${near.amount}`;
          near.start = now;
          if (!fx.heal && near.amount >= 250) {
            near.color = "#FFC928";
            near.size = 34;
          }
          break;
        }
        const numbers = this.effects.filter((e) => e.k === "number");
        if (numbers.length >= MAX_NUMBERS) this.effects.splice(this.effects.indexOf(numbers[0]), 1);
        const big = !fx.heal && fx.amount >= 250;
        this.effects.push({
          k: "number",
          start: now,
          dur: 850,
          x: fx.x + (Math.random() - 0.5) * 18,
          y: fx.y - 36,
          amount: fx.amount,
          heal: Boolean(fx.heal),
          text: `${fx.heal ? "+" : "-"}${fx.amount}`,
          color: big ? "#FFC928" : color,
          size: big ? 34 : 26,
        });
        break;
      }
      case "aoe":
        this.effects.push({ k: "aoe", start: now, dur: fx.style === "meteor" ? 800 : fx.style === "holy" ? 650 : 500, x: fx.x, y: fx.y, r: fx.r, style: fx.style });
        if (fx.style !== "meteor") this.burst(fx.x, fx.y, fx.style === "holy" ? "#FFE680" : fx.style === "smash" ? "#9B7A4E" : "#FF9A2E", 16, fx.style === "holy" ? -0.05 : 0.12);
        break;
      case "spawn":
        this.effects.push({ k: "ring", start: now, dur: 450, x: fx.x, y: fx.y, r: 42, color: this.colors[fx.team] });
        this.burst(fx.x, fx.y, hexToRgba(this.colors[fx.team], 0.9), 10, -0.04);
        break;
      case "death":
        this.smoke(fx.x, fx.y, 8, "rgba(210,210,210,0.8)");
        break;
      case "destroy":
        this.effects.push({ k: "aoe", start: now, dur: 900, x: fx.x, y: fx.y, r: fx.kind === "BASE" ? 190 : 110, style: "bomb" });
        this.burst(fx.x, fx.y, "#FFB23E", 40, 0.1);
        this.burst(fx.x, fx.y, "#6B5A4A", 30, 0.18);
        this.smoke(fx.x, fx.y, 26, "rgba(60,60,60,0.8)");
        this.shake = Math.max(this.shake, fx.kind === "BASE" ? 18 : 10);
        break;
      case "shake":
        this.shake = Math.max(this.shake, fx.power);
        break;
      case "atk":
      case "skill":
        this.units3d?.trigger(fx.id, fx.k, now);
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Particles
  // -------------------------------------------------------------------------

  protected addParticle(p: Particle): void {
    if (this.reducedMotion) return;
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
    this.particles.push(p);
  }

  protected burst(x: number, y: number, color: string, n: number, gravity: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 4.5;
      this.addParticle({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 0, max: 400 + Math.random() * 400, size: 3 + Math.random() * 4, color, gravity, grow: -0.004 });
    }
  }

  protected smoke(x: number, y: number, n: number, color: string): void {
    for (let i = 0; i < n; i++) {
      this.addParticle({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.6 - Math.random() * 0.9,
        life: 0,
        max: 700 + Math.random() * 700,
        size: 8 + Math.random() * 10,
        color,
        gravity: 0,
        grow: 0.03,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------


  protected star(x: number, y: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      else ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  }

  protected roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
}
