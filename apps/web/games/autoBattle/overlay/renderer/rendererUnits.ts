import { UNIT_FLAG_ABILITY, UNIT_FLAG_RAGE, UNIT_FLAG_SHIELD, UNIT_FLAG_STUN, UNIT_META } from "@tebak-kata/shared";
import { getImage, spriteSrc } from "../battleAssets";
import { heroHeightPx } from "../three/Units3D";
import { SPRITE_HEIGHT, easeOut, hexToRgba, type StructVis, type UnitVis } from "./rendererTypes";
import { RendererState } from "./rendererState";

/** Draws buildings and units (sprites or 3D shadows/status), with HP bars. */
export abstract class RendererUnits extends RendererState {
  protected drawStructure(s: StructVis, now: number, dt: number): void {
    const ctx = this.ctx;
    const ratio = s.hp / s.maxHp;
    const r = s.radius;

    if (ratio <= 0) {
      // Destroyed: scorched rubble + slow smoke (PRD §4 destruction state).
      ctx.fillStyle = "rgba(28,22,18,0.72)";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + r * 0.1, r * 1.05, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(110,100,92,0.9)";
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + s.x;
        ctx.beginPath();
        ctx.arc(s.x + Math.cos(a) * r * 0.55, s.y + Math.sin(a) * r * 0.4, 6 + (i % 3) * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (Math.random() < dt / 90) this.smoke(s.x, s.y - r * 0.2, 1, "rgba(50,50,50,0.55)");
      return;
    }

    if (now < s.flashUntil) {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (ratio < 0.75) {
      ctx.strokeStyle = "rgba(25,18,14,0.75)";
      ctx.lineWidth = 3;
      const shown = ratio < 0.5 ? s.cracks.length : 2;
      for (const line of s.cracks.slice(0, shown)) {
        ctx.beginPath();
        line.forEach(([dx, dy], i) => (i === 0 ? ctx.moveTo(s.x + dx, s.y + dy - r * 0.3) : ctx.lineTo(s.x + dx, s.y + dy - r * 0.3)));
        ctx.stroke();
      }
      if (Math.random() < dt / (ratio < 0.25 ? 60 : ratio < 0.5 ? 140 : 320)) {
        this.smoke(s.x + (Math.random() - 0.5) * r, s.y - r * 0.4, 1, "rgba(70,70,70,0.6)");
      }
    }
    if (ratio < 0.5) {
      const fires = ratio < 0.25 ? 4 : 2;
      for (let i = 0; i < fires; i++) {
        const fx = s.x + Math.cos(i * 2.1 + s.y) * r * 0.5;
        const fy = s.y - r * 0.2 + Math.sin(i * 1.7) * r * 0.25;
        const flick = 0.75 + Math.sin(now / 70 + i * 3) * 0.25;
        const g = ctx.createRadialGradient(fx, fy, 2, fx, fy, (ratio < 0.25 ? 30 : 20) * flick);
        g.addColorStop(0, "rgba(255,240,150,0.95)");
        g.addColorStop(0.45, "rgba(255,130,30,0.75)");
        g.addColorStop(1, "rgba(255,60,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fx, fy, 34, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (ratio < 0.25 && s.kind === "BASE") {
      const pulse = 0.35 + Math.sin(now / 160) * 0.25;
      ctx.strokeStyle = `rgba(255,40,40,${pulse})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, r * 1.15, r * 0.95, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Winner glow on the victory screen (PRD §23).
    const result = this.frame?.result;
    if (result && s.kind === "BASE" && result.winner === s.team) {
      const pulse = 0.35 + Math.sin(now / 220) * 0.2;
      const g = ctx.createRadialGradient(s.x, s.y, r * 0.3, s.x, s.y, r * 1.6);
      g.addColorStop(0, `rgba(255,215,90,${pulse})`);
      g.addColorStop(1, "rgba(255,215,90,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      if (Math.random() < dt / 40) this.burst(s.x + (Math.random() - 0.5) * r * 2, s.y - r * 0.5, "#FFD95A", 2, -0.03);
    }
  }

  protected drawStructureHp(s: StructVis): void {
    if (s.hp <= 0) return;
    const ctx = this.ctx;
    const w = s.kind === "BASE" ? 190 : 96;
    const h = s.kind === "BASE" ? 16 : 11;
    const x = s.x - w / 2;
    const y = s.team === "A" ? s.y + s.radius * (s.kind === "BASE" ? 0.95 : 1.05) : s.y - s.radius * 1.25 - h;
    const ratio = s.hp / s.maxHp;
    ctx.fillStyle = "rgba(10,14,28,0.85)";
    this.roundRect(x - 3, y - 3, w + 6, h + 6, 6);
    ctx.fill();
    ctx.fillStyle = ratio < 0.25 ? "#FF4B3A" : this.colors[s.team];
    this.roundRect(x, y, Math.max(0, w * ratio), h, 4);
    ctx.fill();
    if (s.kind === "BASE") {
      ctx.font = `bold 13px ${this.fonts.mono}`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(s.hp).toLocaleString("id-ID")}`, s.x, y + h / 2 + 1);
    }
  }

  protected spriteSize(u: UnitVis): number {
    return SPRITE_HEIGHT * UNIT_META[u.type].size;
  }

  /** On-screen hero height for the active renderer. */
  protected unitHeight(u: UnitVis): number {
    return this.use3D ? heroHeightPx(u.type) : this.spriteSize(u);
  }

  protected drawUnitShadow(u: UnitVis, threeD: boolean, now: number): void {
    const ctx = this.ctx;
    if (!threeD) {
      const size = this.spriteSize(u);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(u.x, u.y + size * 0.32, size * 0.34, size * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    // 3D heroes stand exactly on (x, y): blob shadow + team-coloured ring.
    const r = 16 + UNIT_META[u.type].size * 12;
    const fade = u.diedAt !== null ? Math.max(0, 1 - (now - u.diedAt) / 1500) : 1;
    ctx.fillStyle = `rgba(0,0,0,${0.32 * fade})`;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    if (u.diedAt === null) {
      ctx.strokeStyle = hexToRgba(this.colors[u.team], 0.9);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(u.x, u.y, r * 0.95, r * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (u.flags & UNIT_FLAG_RAGE) {
      const g = ctx.createRadialGradient(u.x, u.y, 4, u.x, u.y, r * 2);
      g.addColorStop(0, "rgba(255,90,20,0.55)");
      g.addColorStop(1, "rgba(255,90,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(u.x, u.y, r * 2, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Shield bubble / stun stars / ability flash drawn over a 3D hero. */
  protected drawUnitStatus(u: UnitVis, now: number): void {
    if (u.diedAt !== null) return;
    const ctx = this.ctx;
    const h = heroHeightPx(u.type);
    if (u.flags & UNIT_FLAG_SHIELD) {
      ctx.strokeStyle = "rgba(120,200,255,0.85)";
      ctx.fillStyle = "rgba(120,200,255,0.14)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(u.x, u.y - h * 0.45, h * 0.45, h * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (u.flags & UNIT_FLAG_STUN) {
      ctx.fillStyle = "#FFE14D";
      for (let i = 0; i < 3; i++) {
        const a = now / 200 + (i * Math.PI * 2) / 3;
        this.star(u.x + Math.cos(a) * 16, u.y - h - 4 + Math.sin(a) * 5, 5);
      }
    }
    if (u.flags & UNIT_FLAG_ABILITY) {
      ctx.strokeStyle = "rgba(255,220,90,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(u.x, u.y, h * 0.5, h * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  protected drawUnit(u: UnitVis, now: number): void {
    const ctx = this.ctx;
    const view = u.facing === 1 ? "front" : "back";
    const img = getImage(spriteSrc(u.team, u.type, view));
    const h = this.spriteSize(u);
    let scale = 1;
    let alpha = 1;
    let bob = 0;
    let tilt = 0;

    const age = now - u.bornAt;
    if (u.state === "SPAWNING" || age < 420) scale = 0.35 + 0.65 * easeOut(Math.min(1, age / 420));
    if (u.diedAt !== null) {
      const t = Math.min(1, (now - u.diedAt) / 600);
      alpha = 1 - t;
      scale *= 1 - t * 0.25;
    }
    if (!this.reducedMotion) {
      if (u.moving && u.state !== "DEATH") {
        bob = -Math.abs(Math.sin(now / 95 + u.id)) * 5;
        tilt = Math.sin(now / 95 + u.id) * 0.05;
      } else if (u.state === "ATTACKING") {
        tilt = Math.sin(now / 70 + u.id) * 0.08;
      }
    }

    // Rage aura (Berserker) behind the sprite.
    if (u.flags & UNIT_FLAG_RAGE) {
      const g = ctx.createRadialGradient(u.x, u.y, 4, u.x, u.y, h * 0.55);
      g.addColorStop(0, "rgba(255,90,20,0.55)");
      g.addColorStop(1, "rgba(255,90,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(u.x, u.y, h * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(u.x, u.y + h * 0.32 + bob);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);
    if (u.diedAt !== null) ctx.filter = "grayscale(1) brightness(0.8)";
    else if (now < u.flashUntil) ctx.filter = "brightness(1.9) saturate(0.6)";
    if (img) {
      const w = (img.naturalWidth / img.naturalHeight) * h;
      ctx.drawImage(img, -w / 2, -h, w, h);
    } else {
      ctx.fillStyle = this.colors[u.team];
      ctx.beginPath();
      ctx.arc(0, -h / 2, h * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (u.diedAt !== null) return;
    if (u.flags & UNIT_FLAG_SHIELD) {
      ctx.strokeStyle = "rgba(120,200,255,0.85)";
      ctx.fillStyle = "rgba(120,200,255,0.16)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(u.x, u.y - h * 0.1, h * 0.46, h * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (u.flags & UNIT_FLAG_STUN) {
      ctx.fillStyle = "#FFE14D";
      for (let i = 0; i < 3; i++) {
        const a = now / 200 + (i * Math.PI * 2) / 3;
        this.star(u.x + Math.cos(a) * 16, u.y - h * 0.72 + Math.sin(a) * 5, 5);
      }
    }
    if (u.flags & UNIT_FLAG_ABILITY) {
      ctx.strokeStyle = "rgba(255,220,90,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(u.x, u.y + h * 0.3, h * 0.45, h * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  protected drawUnitHp(u: UnitVis): void {
    if (u.diedAt !== null || u.hp >= 1000 || u.state === "SPAWNING") return;
    const ctx = this.ctx;
    const h = this.unitHeight(u);
    const w = Math.max(34, h * 0.5);
    const x = u.x - w / 2;
    const y = this.use3D ? u.y - h - 10 : u.y - h * 0.72 - 8;
    ctx.fillStyle = "rgba(8,10,20,0.85)";
    ctx.fillRect(x - 1.5, y - 1.5, w + 3, 8);
    ctx.fillStyle = this.colors[u.team];
    ctx.fillRect(x, y, (w * u.hp) / 1000, 5);
  }

}
