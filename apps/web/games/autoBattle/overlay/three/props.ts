import * as THREE from "three";

/** Hand-built props (Siege catapult, Spearman spear) added to the KayKit heroes. */

/** Catapult arm angles (radians about X): loaded at the back → thrown to the front. */
export const CATAPULT_REST = -0.45;
export const CATAPULT_THROWN = 1.9;

function woodMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
}

/** Simple wooden catapult (the Siege unit) with a team-coloured banner. */
export function buildCatapult(teamColor: THREE.ColorRepresentation): { group: THREE.Group; arm: THREE.Object3D; wheels: THREE.Object3D[] } {
  const group = new THREE.Group();
  const wood = woodMaterial(0x8a5a33);
  const dark = woodMaterial(0x4e3320);
  const iron = new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.5, metalness: 0.6 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, 2.0), wood);
  base.position.y = 0.55;
  group.add(base);
  const wheels: THREE.Object3D[] = [];
  for (const [x, z] of [[-0.72, 0.65], [0.72, 0.65], [-0.72, -0.65], [0.72, -0.65]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 14), dark);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.42, z);
    group.add(w);
    wheels.push(w);
  }
  for (const x of [-0.45, 0.45]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), wood);
    post.position.set(x, 1.1, 0.1);
    group.add(post);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), wood);
    brace.position.set(x, 1.0, 0.5);
    brace.rotation.x = -0.55;
    group.add(brace);
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.05, 8), iron);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(0, 1.5, 0.1);
  group.add(axle);

  // Throwing arm: at rest the loaded cup sits low at the back; a throw swings
  // it up and over to the front (see Units3D catapult animation).
  const arm = new THREE.Group();
  arm.position.set(0, 1.5, 0.1);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.8), dark);
  beam.position.z = -0.6;
  arm.add(beam);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.18, 12), wood);
  cup.position.set(0, 0.1, -1.45);
  arm.add(cup);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 1 }));
  rock.position.set(0, 0.3, -1.45);
  arm.add(rock);
  arm.rotation.x = CATAPULT_REST;
  group.add(arm);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), dark);
  pole.position.set(0.55, 1.3, -0.9);
  group.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.36), new THREE.MeshStandardMaterial({ color: teamColor, side: THREE.DoubleSide }));
  flag.position.set(0.83, 1.8, -0.9);
  group.add(flag);
  return { group, arm, wheels };
}

export function buildSpear(): THREE.Group {
  const spear = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.1, 6), woodMaterial(0x7a5230));
  spear.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 8), new THREE.MeshStandardMaterial({ color: 0xd9dde3, metalness: 0.8, roughness: 0.3 }));
  tip.position.y = 1.2;
  spear.add(tip);
  return spear;
}
