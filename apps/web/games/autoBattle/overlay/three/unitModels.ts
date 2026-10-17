import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { TeamId, UnitType } from "@tebak-kata/shared";
import { buildCatapult, buildSpear } from "./props";
import { HERO_SPECS, type HeroLibrary, type HeroSpec, type ModelName, type TextureName } from "./heroSpecs";
import { buildVariant } from "./variants";

export { HERO_SPECS, type HeroLibrary, type HeroSpec, type ModelName } from "./heroSpecs";

export { CATAPULT_REST, CATAPULT_THROWN } from "./props";

/**
 * 3D hero definitions. Characters are the CC0 "KayKit Adventurers" pack
 * (public/battle/models, see LICENSE-KayKit.txt): five rigged models that
 * share one skeleton, so one animation library drives all of them. Weapons
 * ship inside each model as toggleable meshes; team colours come from
 * recoloured palette textures (public/battle/models/textures).
 */

const MODEL_BASE = "/battle/models";


let libraryPromise: Promise<HeroLibrary> | null = null;

/** Loads models, the shared animation library and team textures once per page. */
export function loadHeroLibrary(): Promise<HeroLibrary> {
  libraryPromise ??= (async () => {
    const loader = new GLTFLoader();
    const names: ModelName[] = ["Knight", "Barbarian", "Mage", "Rogue", "Rogue_Hooded"];
    const [anims, ...models] = await Promise.all([
      loader.loadAsync(`${MODEL_BASE}/animations.glb`),
      ...names.map((n) => loader.loadAsync(`${MODEL_BASE}/${n}.glb`)),
    ]);
    const prototypes = Object.fromEntries(names.map((n, i) => [n, models[i].scene])) as unknown as Record<ModelName, THREE.Object3D>;
    const box = new THREE.Box3().setFromObject(prototypes.Knight);
    const modelHeight = box.max.y - box.min.y || 2.4;

    const clips = new Map(anims.animations.map((c) => [c.name, c]));

    const texLoader = new THREE.TextureLoader();
    const materials = new Map<string, THREE.Material>();
    const textureNames: TextureName[] = ["knight", "barbarian", "golem", "mage", "priest", "rogue"];
    await Promise.all(
      textureNames.flatMap((t) =>
        (["A", "B"] as const).map(async (team) => {
          const tex = await texLoader.loadAsync(`${MODEL_BASE}/textures/${t}_${team}.png`);
          tex.flipY = false; // glTF UV convention
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.magFilter = THREE.NearestFilter;
          materials.set(`${t}_${team}`, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, metalness: 0.05 }));
        }),
      ),
    );
    return { prototypes, modelHeight, clips, materials };
  })();
  return libraryPromise;
}

export interface HeroInstance {
  root: THREE.Group;
  /** The animated character inside `root` (rotated/scaled separately). */
  body: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  spec: HeroSpec;
  /** Catapult throwing arm, if any. */
  arm?: THREE.Object3D;
  wheels?: THREE.Object3D[];
  spear?: THREE.Object3D;
  hand?: THREE.Object3D;
}

/** Instantiates one hero for a team (own skeleton + mixer, one draw call). */
export function createHero(lib: HeroLibrary, type: UnitType, team: TeamId, teamColor: string): HeroInstance {
  const spec = HERO_SPECS[type];
  const body = cloneSkinned(buildVariant(lib, type));
  const material = lib.materials.get(`${spec.texture}_${team}`)!;
  const mesh = body.getObjectByName("HeroMesh") as THREE.SkinnedMesh;
  mesh.material = material;

  const root = new THREE.Group();
  root.add(body);
  const hero: HeroInstance = { root, body, mixer: new THREE.AnimationMixer(body), actions: new Map(), spec };

  if (spec.extra === "spear") {
    // Parented to our own root (not the hand bone) with a fixed upright angle;
    // Units3D moves it to the hand every frame so it follows the stab.
    hero.spear = buildSpear();
    // GLTFLoader strips "." from node names: "handslot.r" becomes "handslotr".
    hero.hand = body.getObjectByName("handslotr") ?? body.getObjectByName("handslot.r") ?? undefined;
    root.add(hero.spear);
  }
  if (spec.extra === "catapult") {
    const { group, arm, wheels } = buildCatapult(teamColor);
    group.scale.setScalar(1.15);
    root.add(group);
    // The operator walks alongside and "throws" when the arm fires.
    body.scale.setScalar(0.85);
    body.position.set(1.05, 0, -0.4);
    hero.arm = arm;
    hero.wheels = wheels;
  }

  for (const name of [spec.idle, spec.move, ...spec.attacks, spec.skill, spec.guard, "Hit_A", "Death_A", "Cheer"]) {
    if (!name || hero.actions.has(name)) continue;
    const clip = lib.clips.get(name);
    if (clip) hero.actions.set(name, hero.mixer.clipAction(clip));
  }
  return hero;
}


/**
 * Renders a head-and-shoulders portrait of a hero (transparent PNG data URL).
 * Used by the dev page that bakes public/battle/portraits/*.png.
 */
export function renderPortrait(lib: HeroLibrary, type: UnitType, team: TeamId, teamColor: string, size = 256): string {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(1.5, 2.5, 3);
  scene.add(key);

  const hero = createHero(lib, type, team, teamColor);
  const machine = hero.spec.extra === "catapult";
  if (machine) hero.root.rotation.y = -0.6; // three-quarter view of the catapult
  scene.add(hero.root);
  const idle = hero.actions.get(hero.spec.idle === "Sit_Chair_Idle" ? "Idle" : hero.spec.idle) ?? hero.actions.values().next().value;
  idle?.play();
  hero.mixer.update(0.4);
  hero.root.updateMatrixWorld(true);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const focus = new THREE.Vector3();
  if (machine) {
    // Siege shares the Rogue model with the Spearman — show the whole machine instead.
    focus.set(0.2, 1.3, 0);
    camera.position.set(focus.x + 2.2, focus.y + 2.2, focus.z + 6.2);
  } else {
    const head = hero.body.getObjectByName("head") ?? hero.body;
    head.getWorldPosition(focus);
    focus.y += 0.35;
    camera.position.set(focus.x + 0.35, focus.y + 0.25, focus.z + 2.6);
  }
  camera.lookAt(focus);
  renderer.render(scene, camera);
  const url = canvas.toDataURL("image/png");
  hero.mixer.stopAllAction();
  renderer.dispose();
  return url;
}
