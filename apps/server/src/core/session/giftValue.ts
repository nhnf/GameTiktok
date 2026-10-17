import type { IncomingGift } from "@tebak-kata/shared";
import { prisma } from "../db.js";
import { getCachedGiftCatalog, lookupCatalogGift } from "../live/giftCatalog.js";

/**
 * Coin value of one gift: the price TikTok sent with the event, else the
 * price we saw before (seen_gifts), else the public gift catalog, else 1.
 */
export async function giftCoinValue(gift: IncomingGift): Promise<number> {
  if (typeof gift.diamondCount === "number" && gift.diamondCount > 0) return gift.diamondCount;
  if (gift.giftId) {
    const seen = await prisma.seenGift.findUnique({ where: { giftId: gift.giftId } }).catch(() => null);
    if (seen && seen.diamondCount > 0) return seen.diamondCount;
  }
  const catalog = await getCachedGiftCatalog();
  const hit = lookupCatalogGift(catalog, gift.giftId, gift.giftName);
  return hit && hit.diamondCount > 0 ? hit.diamondCount : 1;
}
