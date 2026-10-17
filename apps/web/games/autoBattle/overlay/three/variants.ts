import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { UnitType } from "@tebak-kata/shared";
import { HERO_SPECS, MODEL_PROPS, type HeroLibrary } from "./heroSpecs";

/**
 * Builds (once per unit type) a copy of the model whose visible parts are
 * merged into ONE skinned mesh on ONE skeleton.
 *
 * KayKit skins the body parts but attaches weapons, helmets and capes as
 * rigid meshes parented to bones, and GLTFLoader gives every skinned part
 * its own Skeleton — ~11 draw calls and ~6 bone-texture uploads per hero,
 * which held an Intel HD 620 to ~25 FPS with 33 heroes. Rigid parts are
 * converted to skinned geometry weighted 100% to their parent bone, so the
 * merged result deforms exactly like the original.
 */
const variantCache = new Map<UnitType, THREE.Object3D>();

function toSkinAttributes(geo: THREE.BufferGeometry, boneIndex: number | null): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", geo.getAttribute("position").clone());
  out.setAttribute("normal", geo.getAttribute("normal").clone());
  out.setAttribute("uv", geo.getAttribute("uv").clone());
  const count = geo.getAttribute("position").count;
  const index = new Uint16Array(count * 4);
  const weight = new Float32Array(count * 4);
  if (boneIndex === null) {
    const si = geo.getAttribute("skinIndex");
    const sw = geo.getAttribute("skinWeight");
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 4; k++) {
        index[i * 4 + k] = si.getComponent(i, k);
        weight[i * 4 + k] = sw.getComponent(i, k);
      }
    }
  } else {
    for (let i = 0; i < count; i++) {
      index[i * 4] = boneIndex;
      weight[i * 4] = 1;
    }
  }
  out.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(index, 4));
  out.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weight, 4));
  const idx = geo.getIndex();
  out.setIndex(idx ? idx.clone() : Array.from({ length: count }, (_, i) => i));
  return out;
}

export function buildVariant(lib: HeroLibrary, type: UnitType): THREE.Object3D {
  const cached = variantCache.get(type);
  if (cached) return cached;
  const spec = HERO_SPECS[type];
  const root = cloneSkinned(lib.prototypes[spec.model]);
  root.updateMatrixWorld(true);
  const shown = new Set(spec.props);
  const hidden = new Set([...MODEL_PROPS[spec.model].filter((p) => !shown.has(p)), ...(spec.hide ?? [])]);

  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  const skinned = meshes.filter((m) => (m as THREE.SkinnedMesh).isSkinnedMesh) as THREE.SkinnedMesh[];
  const skeleton = skinned[0].skeleton;
  const boneIndex = new Map(skeleton.bones.map((b, i) => [b, i]));

  const parts: THREE.BufferGeometry[] = [];
  for (const mesh of meshes) {
    const visible = !hidden.has(mesh.name) && !(mesh.parent && hidden.has(mesh.parent.name));
    if (visible) {
      if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
        const geo = toSkinAttributes(mesh.geometry, null);
        geo.applyMatrix4((mesh as THREE.SkinnedMesh).bindMatrix);
        parts.push(geo);
      } else {
        // Rigid attachment: find the bone it hangs from and bake it into bind space.
        let bone: THREE.Object3D | null = mesh.parent;
        while (bone && !boneIndex.has(bone as THREE.Bone)) bone = bone.parent;
        if (bone) {
          const bi = boneIndex.get(bone as THREE.Bone)!;
          const local = new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(mesh.matrixWorld);
          const toBind = new THREE.Matrix4().copy(skeleton.boneInverses[bi]).invert().multiply(local);
          const geo = toSkinAttributes(mesh.geometry, bi);
          geo.applyMatrix4(toBind);
          parts.push(geo);
        }
      }
    }
    mesh.removeFromParent();
  }

  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error(`Could not merge hero geometry for ${type}`);
  const hero = new THREE.SkinnedMesh(merged, new THREE.MeshStandardMaterial());
  hero.name = "HeroMesh";
  hero.frustumCulled = false; // skinned bounds don't follow the animation
  root.add(hero);
  hero.bind(skeleton, new THREE.Matrix4());
  variantCache.set(type, root);
  return root;
}
