import * as THREE from "three";
import { BATTLE_ARENA, UNIT_FLAG_SHIELD, UNIT_FLAG_STUN, UNIT_META, type TeamId, type UnitState, type UnitType } from "@tebak-kata/shared";
import { CATAPULT_REST, CATAPULT_THROWN, createHero, HERO_SPECS, loadHeroLibrary, type HeroInstance, type HeroLibrary } from "./unitModels";

/**
 * Real-time 3D heroes drawn on a transparent WebGL canvas that sits on top of
 * the painted arena. The camera is orthographic and tilted
 * `CAMERA_ELEVATION` above the horizon; a ground point at world
 * (x, 0, y / sin(elevation)) lands exactly on overlay pixel (x, y), so the
 * simulation's 2D coordinates, the painted castles and the 2D effect layers
 * all stay aligned without any extra mapping.
 */

export const CAMERA_ELEVATION = THREE.MathUtils.degToRad(36);
const SIN = Math.sin(CAMERA_ELEVATION);
const COS = Math.cos(CAMERA_ELEVATION);
const W = BATTLE_ARENA.width;
const H = BATTLE_ARENA.height;
const FADE = 0.18;
const DEATH_SINK_AFTER_MS = 1300;

export interface UnitRenderState {
  id: number;
  team: TeamId;
  type: UnitType;
  x: number;
  y: number;
  moving: boolean;
  state: UnitState;
  facing: 1 | -1;
  flags: number;
  bornAt: number;
  diedAt: number | null;
}

interface HeroRuntime extends HeroInstance {
  current: string | null;
  oneShotUntil: number;
  yaw: number;
  lastX: number;
  lastY: number;
  scale: number;
  armSwingAt: number;
}

/** On-screen hero height in px (used for HP bars / effects placement). */
export function heroHeightPx(type: UnitType): number {
  // PRD §7 relative sizes, softened so the Golem doesn't dwarf the arena.
  return HERO_SPECS[type].height * (1 + (UNIT_META[type].size - 1) * 0.6);
}

function easeOutBack(t: number): number {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

export class Units3D {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.OrthographicCamera;
  private readonly cameraBase: THREE.Vector3;
  private lib: HeroLibrary | null = null;
  private readonly heroes = new Map<number, HeroRuntime>();
  private disposed = false;
  private readonly tmp = new THREE.Vector3();

  constructor(
    canvas: HTMLCanvasElement,
    private readonly teamColor: (team: TeamId) => string,
  ) {
    // No MSAA: at 1080×1920 it costs integrated GPUs (e.g. Intel HD) ~40% of the frame.
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(W, H, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 1, 20000);
    const target = new THREE.Vector3(W / 2, 0, H / 2 / SIN);
    const back = new THREE.Vector3(0, SIN, COS).multiplyScalar(5000);
    this.cameraBase = target.clone().add(back);
    this.camera.position.copy(this.cameraBase);
    this.camera.lookAt(target);

    this.scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a5a2a, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-600, 1400, 1800);
    sun.target.position.set(W / 2, 0, H / SIN / 2);
    this.scene.add(sun, sun.target);
  }

  /** Resolves once models are loaded; rejects if they can't be (caller falls back to 2D sprites). */
  async init(): Promise<void> {
    this.lib = await loadHeroLibrary();
  }

  get ready(): boolean {
    return this.lib !== null && !this.disposed;
  }

  /** An attack or ability happened for unit `id` this frame (from the server's fx list). */
  trigger(id: number, kind: "atk" | "skill", now: number): void {
    const hero = this.heroes.get(id);
    if (!hero) return;
    const { spec } = hero;
    if (hero.arm && kind === "atk") hero.armSwingAt = now;
    const name = kind === "skill" && spec.skill ? spec.skill : spec.attacks[Math.floor(Math.random() * spec.attacks.length)];
    const action = hero.actions.get(name);
    if (!action) return;
    const clip = action.getClip();
    // Keep swings snappy so they fit inside the unit's attack interval.
    const timeScale = Math.max(1, clip.duration / 0.85);
    this.play(hero, name, { once: true, timeScale });
    hero.oneShotUntil = now + (clip.duration / timeScale) * 1000 - FADE * 1000;
  }

  private play(hero: HeroRuntime, name: string, opts: { once?: boolean; timeScale?: number } = {}): void {
    const next = hero.actions.get(name);
    if (!next) return;
    const prev = hero.current ? hero.actions.get(hero.current) : null;
    if (hero.current === name && !opts.once) return;
    next.reset();
    next.setLoop(opts.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = Boolean(opts.once);
    next.timeScale = opts.timeScale ?? 1;
    next.enabled = true;
    next.setEffectiveWeight(1);
    if (prev && prev !== next) next.crossFadeFrom(prev, FADE, false);
    next.play();
    hero.current = name;
  }

  render(units: Iterable<UnitRenderState>, now: number, dtMs: number, shakeX: number, shakeY: number): void {
    if (!this.lib || this.disposed) return;
    const dt = dtMs / 1000;
    const seen = new Set<number>();

    for (const u of units) {
      seen.add(u.id);
      let hero = this.heroes.get(u.id);
      if (!hero) {
        const inst = createHero(this.lib, u.type, u.team, this.teamColor(u.team));
        const scale = heroHeightPx(u.type) / (this.lib.modelHeight * COS);
        inst.root.scale.setScalar(scale);
        hero = { ...inst, current: null, oneShotUntil: 0, yaw: u.facing === 1 ? 0 : Math.PI, lastX: u.x, lastY: u.y, scale, armSwingAt: -1e9 };
        this.scene.add(hero.root);
        this.heroes.set(u.id, hero);
      }
      this.updateHero(hero, u, now, dt);
    }

    for (const [id, hero] of this.heroes) {
      if (seen.has(id)) continue;
      hero.mixer.stopAllAction();
      this.scene.remove(hero.root);
      this.heroes.delete(id);
    }

    // Screen shake: slide the camera along the screen's right/up axes.
    this.camera.position.set(this.cameraBase.x - shakeX, this.cameraBase.y + shakeY * COS, this.cameraBase.z - shakeY * SIN);
    this.renderer.render(this.scene, this.camera);
  }

  private updateHero(hero: HeroRuntime, u: UnitRenderState, now: number, dt: number): void {
    const { spec } = hero;
    const z = u.y / SIN;
    const dx = u.x - hero.lastX;
    const dz = (u.y - hero.lastY) / SIN;
    hero.lastX = u.x;
    hero.lastY = u.y;

    // Spawn pop, then death sink.
    const age = now - u.bornAt;
    let pop = age < 420 ? Math.max(0.05, easeOutBack(Math.min(1, age / 420))) : 1;
    let sink = 0;
    if (u.diedAt !== null) {
      const t = now - u.diedAt - DEATH_SINK_AFTER_MS;
      if (t > 0) sink = Math.min(1, t / 700);
      pop = 1;
    }
    hero.root.scale.setScalar(hero.scale * pop);
    hero.root.position.set(u.x, -sink * 1.2 * hero.scale, z);

    // Facing: travel direction while moving, else toward the enemy side.
    let targetYaw = hero.yaw;
    if (Math.hypot(dx, dz) > 0.2) targetYaw = Math.atan2(dx, dz);
    else if (u.state === "ATTACKING") targetYaw = u.facing === 1 ? 0 : Math.PI;
    let diff = targetYaw - hero.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    hero.yaw += diff * Math.min(1, dt * 10);
    hero.root.rotation.y = hero.yaw;

    // Animation state.
    if (u.diedAt !== null) {
      if (hero.current !== "Death_A") this.play(hero, "Death_A", { once: true, timeScale: 1.2 });
    } else if (now >= hero.oneShotUntil) {
      const stunned = (u.flags & UNIT_FLAG_STUN) !== 0;
      const guarding = spec.guard && (u.flags & UNIT_FLAG_SHIELD) !== 0;
      const loop = stunned ? spec.idle : guarding ? spec.guard! : u.moving ? spec.move : spec.idle;
      if (hero.current !== loop) this.play(hero, loop);
    }

    // Catapult: arm throw + rolling wheels.
    if (hero.arm) {
      const t = (now - hero.armSwingAt) / 1400;
      // Fast fling (first 25%), then a slow reload back to rest.
      const k = t < 0 || t >= 1 ? 0 : t < 0.25 ? Math.sin((t / 0.25) * Math.PI * 0.5) : 1 - (t - 0.25) / 0.75;
      hero.arm.rotation.x = CATAPULT_REST + (CATAPULT_THROWN - CATAPULT_REST) * k;
      if (u.moving && hero.wheels) for (const w of hero.wheels) w.rotation.x += dt * 4;
    }

    hero.mixer.update(dt);

    if (hero.spear && hero.hand) {
      hero.hand.getWorldPosition(this.tmp);
      hero.root.worldToLocal(this.tmp);
      hero.spear.position.copy(this.tmp);
      // Tilt forward while stabbing, upright otherwise.
      hero.spear.rotation.set(now < hero.oneShotUntil ? 1.2 : 0.25, 0, 0);
    }
  }

  dispose(): void {
    this.disposed = true;
    for (const hero of this.heroes.values()) hero.mixer.stopAllAction();
    this.heroes.clear();
    this.renderer.dispose();
  }
}
