import { DEFAULT_BATTLE_GIFT_MAPPINGS, type BattleGiftMapping, type TeamId, type UnitType } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";
import { getGiftCatalog, lookupCatalogGift } from "../../core/live/giftCatalog.js";

type Row = Awaited<ReturnType<typeof prisma.battleGiftMapping.findMany>>[number];

function toMapping(row: Row): BattleGiftMapping {
  return {
    id: row.id,
    giftId: row.giftId,
    giftName: row.giftName,
    team: row.team as TeamId,
    unitType: row.unitType as UnitType,
    quantity: row.quantity,
    enabled: row.enabled,
    diamondCount: row.diamondCount,
    imageUrl: row.imageUrl,
  };
}

/** Gift → team → unit table (PRD §13 / §34), seeded with the starter table on first run. */
export const battleMappings = {
  async seedIfEmpty(): Promise<void> {
    if ((await prisma.battleGiftMapping.count()) === 0) {
      await prisma.battleGiftMapping.createMany({ data: DEFAULT_BATTLE_GIFT_MAPPINGS.map((m) => ({ ...m })) });
    }
  },

  async load(): Promise<BattleGiftMapping[]> {
    const rows = await prisma.battleGiftMapping.findMany({ orderBy: [{ team: "asc" }, { createdAt: "asc" }] });
    return rows.map(toMapping);
  },

  async resetDefaults(): Promise<void> {
    await prisma.$transaction([
      prisma.battleGiftMapping.deleteMany({}),
      prisma.battleGiftMapping.createMany({ data: DEFAULT_BATTLE_GIFT_MAPPINGS.map((m) => ({ ...m })) }),
    ]);
  },

  /**
   * Completes mappings from TikTok's gift catalog: the real gift id when a
   * mapping was entered by name, the icon, the coin price and the official
   * name. Returns how many rows changed. Never throws.
   */
  async enrichFromCatalog(): Promise<number> {
    try {
      const catalog = await getGiftCatalog();
      if (catalog.length === 0) return 0;
      const rows = await prisma.battleGiftMapping.findMany();
      let changed = 0;
      for (const row of rows) {
        const hit = lookupCatalogGift(catalog, row.giftId, row.giftName);
        if (!hit) continue;
        const idTaken = !row.giftId && rows.some((o) => o.id !== row.id && o.giftId === hit.id);
        const data = {
          ...(row.giftId || idTaken ? {} : { giftId: hit.id }),
          ...(row.giftId === hit.id && row.giftName !== hit.name ? { giftName: hit.name } : {}),
          ...(hit.imageUrl && row.imageUrl !== hit.imageUrl ? { imageUrl: hit.imageUrl } : {}),
          ...(row.diamondCount !== hit.diamondCount ? { diamondCount: hit.diamondCount } : {}),
        };
        if (Object.keys(data).length === 0) continue;
        await prisma.battleGiftMapping.update({ where: { id: row.id }, data });
        changed++;
      }
      return changed;
    } catch (err) {
      console.error("[autoBattle] gift catalog enrichment failed:", err);
      return 0;
    }
  },
};
