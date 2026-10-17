import { z } from "zod";
import { UNIT_TYPES, validateGiftMappings, type BattleGiftMapping, type UnitType } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";

export const teamSchema = z.enum(["A", "B"]);
export const unitSchema = z.enum(UNIT_TYPES as [UnitType, ...UnitType[]]);

export const mappingInput = z.object({
  giftId: z
    .string()
    .trim()
    .max(40)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  giftName: z.string().trim().min(1).max(60),
  team: teamSchema,
  unitType: unitSchema,
  quantity: z.number().int().min(1).max(50),
  enabled: z.boolean().optional().default(true),
  diamondCount: z.number().int().min(0).nullable().optional(),
  imageUrl: z.string().url().max(500).nullable().optional(),
});

const unitStatsInput = z
  .object({
    hp: z.number().min(1).max(100_000),
    damage: z.number().min(0).max(10_000),
    attackSpeed: z.number().min(0.1).max(20),
    range: z.number().min(1).max(20),
    moveSpeed: z.number().min(0.1).max(5),
    abilityCooldown: z.number().min(0).max(120),
    abilityPower: z.number().min(0).max(10),
    buildingDamage: z.number().min(0).max(10),
    targetPriority: z.enum(["NEAREST_ENEMY", "DEFENSE_THEN_BASE", "LARGEST_CLUSTER", "BASE_THEN_DEFENSE_THEN_UNIT", "LOWEST_HP_ALLY"]),
  })
  .partial();

const teamInput = z
  .object({
    name: z.string().trim().min(1).max(24),
    emblem: z.string().trim().min(1).max(8),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })
  .partial();

export const configInput = z
  .object({
    matchDuration: z.number().int().min(30).max(3600),
    baseHp: z.number().int().min(100).max(1_000_000),
    towerHp: z.number().int().min(100).max(1_000_000),
    towerDamage: z.number().min(0).max(10_000),
    towerRange: z.number().min(1).max(20),
    towerAttackSpeed: z.number().min(0.2).max(20),
    baseDamage: z.number().min(0).max(10_000),
    baseRange: z.number().min(1).max(20),
    baseAttackSpeed: z.number().min(0.2).max(20),
    maxUnitsPerTeam: z.number().int().min(1).max(60),
    suddenDeath: z.boolean(),
    damageMultiplier: z.number().min(0.1).max(10),
    countdownSeconds: z.number().int().min(0).max(10),
    resultSeconds: z.number().int().min(2).max(60),
    autoNextMatch: z.boolean(),
    lobbySeconds: z.number().int().min(3).max(600),
    spawnStaggerMs: z.number().int().min(0).max(2000),
    teams: z.object({ A: teamInput, B: teamInput }).partial(),
    units: z.record(unitSchema, unitStatsInput),
    spawnScore: z.record(unitSchema, z.number().int().min(0).max(10_000)),
  })
  .partial();

export const testGiftInput = z.object({
  mappingId: z.string().optional(),
  giftId: z.string().optional(),
  giftName: z.string().optional(),
  username: z.string().trim().min(1).max(40).default("tester"),
  count: z.number().int().min(1).max(500).default(1),
});

export type MappingInput = z.infer<typeof mappingInput>;

/** Rejects a mapping that would collide with another row (PRD §34 validation). */
export async function checkMappingConflicts(candidate: MappingInput, excludeId?: string): Promise<string | null> {
  const others = await prisma.battleGiftMapping.findMany({ where: excludeId ? { id: { not: excludeId } } : undefined });
  const rows: Omit<BattleGiftMapping, "id">[] = [
    ...others.map((o) => ({ ...o, team: o.team as "A" | "B", unitType: o.unitType as UnitType })),
    { ...candidate, enabled: candidate.enabled ?? true, diamondCount: candidate.diamondCount ?? null },
  ];
  // The candidate is last, so any duplicate is reported against its index.
  return validateGiftMappings(rows).find((e) => e.index === rows.length - 1)?.message ?? null;
}
