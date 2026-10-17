import { normalizeGiftName } from "../../core/gift.js";
import { UNIT_TYPES } from "./constants.js";
import type { BattleGiftMapping } from "./types.js";

/**
 * PRD §15 "Find Gift Mapping". Matches by TikTok gift id first; falls back
 * to the gift name so a mapping still works when TikTok serves a different
 * numeric id for the same gift (regional variants). Returns disabled
 * mappings too so the caller can report "DISABLED" instead of "UNMAPPED".
 */
export function findGiftMapping(
  mappings: readonly BattleGiftMapping[],
  giftId: string | null | undefined,
  giftName?: string | null,
): BattleGiftMapping | null {
  const id = (giftId ?? "").trim();
  if (id) {
    const byId = mappings.find((m) => m.giftId !== null && m.giftId.trim() === id);
    if (byId) return byId;
  }
  const name = normalizeGiftName(giftName);
  if (name) {
    const byName = mappings.find((m) => normalizeGiftName(m.giftName) === name);
    if (byName) return byName;
  }
  return null;
}

export interface MappingValidationError {
  index: number;
  field: "giftId" | "giftName" | "team" | "unitType" | "quantity";
  message: string;
}

/** PRD §34 validation: gift not duplicated, unit valid, team valid, quantity > 0. */
export function validateGiftMappings(mappings: readonly Omit<BattleGiftMapping, "id">[]): MappingValidationError[] {
  const errors: MappingValidationError[] = [];
  const seenIds = new Map<string, number>();
  const seenNames = new Map<string, number>();

  mappings.forEach((m, index) => {
    const id = (m.giftId ?? "").trim();
    const name = normalizeGiftName(m.giftName);
    if (!name) errors.push({ index, field: "giftName", message: "Nama gift wajib diisi." });
    if (id) {
      const prev = seenIds.get(id);
      if (prev !== undefined) errors.push({ index, field: "giftId", message: `Gift ID ${id} sudah dipakai di baris ${prev + 1}.` });
      else seenIds.set(id, index);
    }
    if (name) {
      const prev = seenNames.get(name);
      if (prev !== undefined) errors.push({ index, field: "giftName", message: `Gift "${m.giftName}" sudah dipakai di baris ${prev + 1}.` });
      else seenNames.set(name, index);
    }
    if (m.team !== "A" && m.team !== "B") errors.push({ index, field: "team", message: "Team harus A atau B." });
    if (!UNIT_TYPES.includes(m.unitType)) errors.push({ index, field: "unitType", message: "Unit tidak valid." });
    if (!Number.isInteger(m.quantity) || m.quantity <= 0 || m.quantity > 50) {
      errors.push({ index, field: "quantity", message: "Jumlah harus bilangan bulat 1–50." });
    }
  });

  return errors;
}
