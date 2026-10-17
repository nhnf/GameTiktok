import { BATTLE_ARENA } from "@tebak-kata/shared";
import { ARENA_BG_SRC, getImage } from "../battleAssets";
import { H, W, easeOut, hexToRgba, lerp, type Effect } from "./rendererTypes";
import { RendererUnits } from "./rendererUnits";


/**
 * Canvas renderer for the Auto Battle arena (PRD §22–26). The server sends
 * ~10 frames/sec; this draws at display rate, interpolating unit positions
 * between frames and turning each frame's `fx` list into short-lived
 * projectiles, damage numbers, area effects and particles.
 *
 * Plain class (no React) so the 60fps loop never touches React state.
 */
export class BattleRenderer extends RendererUnits {
  draw(now: number): void {
    const dt = this.lastDraw ? Math.min(64, now - this.lastDraw) : 16;
    this.lastDraw = now;
    const threeD = this.use3D;

    let sx = 0;
    let sy = 0;
    if (!this.reducedMotion && this.shake > 0.3) {
      sx = (Math.random() - 0.5) * this.shake;
      sy = (Math.random() - 0.5) * this.shake;
      this.shake *= Math.pow(0.86, dt / 16);
    } else this.shake = 0;

    const alpha = Math.min(1, (now - this.lastPushAt) / this.interval);
    for (const u of this.units.values()) {
      u.x = lerp(u.fromX, u.toX, alpha);
      u.y = lerp(u.fromY, u.toY, alpha);
    }
    const sorted = [...this.units.values()].sort((a, b) => a.y - b.y);

    // Bottom layer: arena, buildings, ground marks (and 2D heroes as fallback).
    this.ctx = this.bottom;
    this.bottom.save();
    this.bottom.clearRect(0, 0, W, H);
    this.bottom.translate(sx, sy);
    if (this.paintBackground) {
      this.bottom.fillStyle = "#0B1426";
      this.bottom.fillRect(-20, -20, W + 40, H + 40);
      const bg = getImage(ARENA_BG_SRC);
      if (bg) this.bottom.drawImage(bg, 0, BATTLE_ARENA.backgroundTop, W, BATTLE_ARENA.backgroundHeight);
    }
    for (const s of this.structures) this.drawStructure(s, now, dt);
    for (const u of sorted) this.drawUnitShadow(u, threeD, now);
    if (!threeD) for (const u of sorted) this.drawUnit(u, now);

    // Middle layer: 3D heroes.
    if (threeD) this.units3d!.render(sorted, now, dt, sx, sy);

    // Top layer: everything that must read over the heroes.
    if (this.top) {
      this.bottom.restore();
      this.ctx = this.top;
      this.top.save();
      this.top.clearRect(0, 0, W, H);
      this.top.translate(sx, sy);
    }
    if (threeD) for (const u of sorted) this.drawUnitStatus(u, now);
    for (const u of sorted) this.drawUnitHp(u);
    this.drawEffects(now);
    this.drawParticles(dt);
    for (const s of this.structures) this.drawStructureHp(s);
    this.ctx.restore();
    this.ctx = this.bottom;
  }


  protected drawEffects(now: number): void {
    const ctx = this.ctx;
    this.effects = this.effects.filter((e) => now < e.start + e.dur);
    for (const e of this.effects) {
      const t = (now - e.start) / e.dur;
      if (t < 0) continue;
      switch (e.k) {
        case "shot":
          this.drawShot(e, t);
          break;
        case "ring":
          ctx.strokeStyle = hexToRgba(e.color, 1 - t);
          ctx.lineWidth = 5 * (1 - t) + 1;
          ctx.beginPath();
          ctx.ellipse(e.x, e.y + 20, e.r * (0.4 + t), e.r * 0.4 * (0.4 + t), 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case "aoe":
          this.drawAoe(e, t);
          break;
        case "number": {
          const y = e.y - easeOut(t) * 46;
          ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
          ctx.font = `${e.size}px ${this.fonts.display}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 5;
          ctx.strokeStyle = "rgba(20,10,10,0.9)";
          ctx.strokeText(e.text, e.x, y);
          ctx.fillStyle = e.color;
          ctx.fillText(e.text, e.x, y);
          ctx.globalAlpha = 1;
          break;
        }
      }
    }
  }

  protected drawShot(e: Extract<Effect, { k: "shot" }>, t: number): void {
    const ctx = this.ctx;
    const [fx, fy] = e.from;
    const [tx, ty] = e.to;
    const x = lerp(fx, tx, t);
    let y = lerp(fy, ty, t) - 30;
    if (e.style === "bomb") y -= Math.sin(t * Math.PI) * 90;
    const angle = Math.atan2(ty - fy, tx - fx);
    const team = this.colors[e.team];

    switch (e.style) {
      case "arrow":
      case "spear": {
        const len = e.style === "arrow" ? 24 : 18;
        ctx.strokeStyle = e.style === "arrow" ? "#6B4424" : "#D8DDE6";
        ctx.lineWidth = e.style === "arrow" ? 3 : 4;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle) * len, y - Math.sin(angle) * len);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = "#EDEFF4";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "tower": {
        ctx.strokeStyle = "rgba(255,210,90,0.95)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle) * 26, y - Math.sin(angle) * 26);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      }
      case "magic":
      case "heal": {
        const color = e.style === "heal" ? "#6BFF8E" : team;
        const g = this.ctx.createRadialGradient(x, y, 1, x, y, 16);
        g.addColorStop(0, "#FFFFFF");
        g.addColorStop(0.35, color);
        g.addColorStop(1, hexToRgba(color.startsWith("#") ? color : "#FFFFFF", 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "bomb": {
        ctx.fillStyle = "#3B3632";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,150,40,0.9)";
        ctx.beginPath();
        ctx.arc(x + 4, y - 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }

  protected drawAoe(e: Extract<Effect, { k: "aoe" }>, t: number): void {
    const ctx = this.ctx;
    if (e.style === "meteor") {
      // Fireball falls for the first 35%, then impacts.
      const fall = 0.35;
      if (t < fall) {
        const k = t / fall;
        const x = lerp(e.x + 160, e.x, k);
        const y = lerp(e.y - 520, e.y, k);
        const g = ctx.createRadialGradient(x, y, 2, x, y, 36);
        g.addColorStop(0, "#FFF6C8");
        g.addColorStop(0.4, "#FF8A1E");
        g.addColorStop(1, "rgba(255,60,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 36, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      const k = (t - fall) / (1 - fall);
      if (!e.impacted) {
        e.impacted = true;
        this.burst(e.x, e.y, "#FF7A1A", 22, 0.12);
        this.shake = Math.max(this.shake, 8);
      }
      this.explosion(e.x, e.y, e.r, k, "255,120,30");
      return;
    }
    if (e.style === "holy") {
      ctx.strokeStyle = `rgba(255,225,120,${1 - t})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 10, e.r * easeOut(t), e.r * 0.45 * easeOut(t), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,240,170,${0.25 * (1 - t)})`;
      ctx.fill();
      return;
    }
    if (e.style === "smash") {
      ctx.strokeStyle = `rgba(140,105,60,${1 - t})`;
      ctx.lineWidth = 10 * (1 - t) + 2;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 20, e.r * easeOut(t), e.r * 0.5 * easeOut(t), 0, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    this.explosion(e.x, e.y, e.r, t, "255,150,40");
  }

  protected explosion(x: number, y: number, r: number, t: number, rgb: string): void {
    const ctx = this.ctx;
    const rr = r * (0.35 + 0.65 * easeOut(t));
    const g = ctx.createRadialGradient(x, y, 2, x, y, rr);
    g.addColorStop(0, `rgba(255,250,210,${0.9 * (1 - t)})`);
    g.addColorStop(0.45, `rgba(${rgb},${0.7 * (1 - t)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  protected drawParticles(dt: number): void {
    const ctx = this.ctx;
    const k = dt / 16;
    this.particles = this.particles.filter((p) => (p.life += dt) < p.max);
    for (const p of this.particles) {
      p.vy += p.gravity * k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.size = Math.max(0.5, p.size + p.grow * dt);
      ctx.globalAlpha = 1 - p.life / p.max;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

}
