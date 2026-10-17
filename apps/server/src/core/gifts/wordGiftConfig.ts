import { normalizeGiftName, type IncomingGift } from "@tebak-kata/shared";
import { prisma } from "../db.js";

/**
 * Finds the word-game gift config for an incoming gift: exact gift id
 * first, then the gift name (so a config created as "rose"/"Rose" still
 * matches TikTok's numeric id 5655 when the event carries the name).
 */
export async function findWordGiftConfig(gift: IncomingGift) {
  const byId = await prisma.giftConfig.findUnique({ where: { giftId: gift.giftId } });
  if (byId) return byId;
  const name = normalizeGiftName(gift.giftName);
  if (!name) return null;
  const all = await prisma.giftConfig.findMany();
  return all.find((g) => normalizeGiftName(g.giftName) === name || normalizeGiftName(g.giftId) === name) ?? null;
}
