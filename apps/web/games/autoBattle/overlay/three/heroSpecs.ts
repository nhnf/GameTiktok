import type * as THREE from "three";
import type { UnitType } from "@tebak-kata/shared";

export type ModelName = "Knight" | "Barbarian" | "Mage" | "Rogue" | "Rogue_Hooded";
export type TextureName = "knight" | "barbarian" | "golem" | "mage" | "priest" | "rogue";

export interface HeroSpec {
  model: ModelName;
  texture: TextureName;
  /** Weapon/prop meshes to show; every other prop of the model is hidden. */
  props: string[];
  /** Body meshes to hide (e.g. the Mage hat for the Priest). */
  hide?: string[];
  /** On-screen height in overlay px (before the unit's PRD relative size). */
  height: number;
  idle: string;
  move: string;
  attacks: string[];
  skill?: string;
  /** Loop played while the shield/ability flag is on (Tank Shield Wall). */
  guard?: string;
  extra?: "spear" | "catapult";
}

export const HERO_SPECS: Record<UnitType, HeroSpec> = {
  TANK: { model: "Knight", texture: "knight", props: ["1H_Sword", "Badge_Shield"], height: 96, idle: "Idle", move: "Walking_A", attacks: ["1H_Melee_Attack_Chop", "1H_Melee_Attack_Slice_Diagonal"], guard: "Block" },
  ARCHER: { model: "Rogue_Hooded", texture: "rogue", props: ["2H_Crossbow"], height: 86, idle: "Idle", move: "Walking_A", attacks: ["2H_Ranged_Shoot"] },
  BERSERKER: { model: "Barbarian", texture: "barbarian", props: ["1H_Axe", "1H_Axe_Offhand"], height: 92, idle: "Idle", move: "Running_A", attacks: ["Dualwield_Melee_Attack_Chop"], skill: "Cheer" },
  HEAVY: { model: "Barbarian", texture: "golem", props: ["2H_Axe"], hide: ["Barbarian_Hat"], height: 108, idle: "2H_Melee_Idle", move: "Walking_A", attacks: ["2H_Melee_Attack_Chop"], skill: "2H_Melee_Attack_Spin" },
  MAGE: { model: "Mage", texture: "mage", props: ["2H_Staff"], height: 90, idle: "Idle", move: "Walking_A", attacks: ["Spellcast_Shoot"], skill: "Spellcast_Raise" },
  SPEARMAN: { model: "Rogue", texture: "rogue", props: [], height: 84, idle: "Idle", move: "Running_A", attacks: ["1H_Melee_Attack_Stab"], extra: "spear" },
  SUPPORT: { model: "Mage", texture: "priest", props: ["1H_Wand", "Spellbook_open"], hide: ["Mage_Hat"], height: 88, idle: "Idle", move: "Walking_A", attacks: ["Spellcast_Shoot"], skill: "Spellcast_Raise" },
  SIEGE: { model: "Rogue", texture: "rogue", props: [], height: 70, idle: "Idle", move: "Walking_A", attacks: ["Throw"], extra: "catapult" },
};

/** Every prop mesh per model (shown only when listed in a spec's `props`). */
export const MODEL_PROPS: Record<ModelName, string[]> = {
  Knight: ["1H_Sword_Offhand", "Badge_Shield", "Rectangle_Shield", "Round_Shield", "Spike_Shield", "1H_Sword", "2H_Sword"],
  Barbarian: ["1H_Axe_Offhand", "Barbarian_Round_Shield", "1H_Axe", "2H_Axe", "Mug"],
  Mage: ["Spellbook", "Spellbook_open", "1H_Wand", "2H_Staff"],
  Rogue: ["Knife_Offhand", "1H_Crossbow", "2H_Crossbow", "Knife", "Throwable"],
  Rogue_Hooded: ["Knife_Offhand", "1H_Crossbow", "2H_Crossbow", "Knife", "Throwable"],
};

export interface HeroLibrary {
  prototypes: Record<ModelName, THREE.Object3D>;
  /** Model height in its own units (used to scale to `height`). */
  modelHeight: number;
  clips: Map<string, THREE.AnimationClip>;
  materials: Map<string, THREE.Material>;
}
