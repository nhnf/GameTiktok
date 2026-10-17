import { prisma } from "../db.js";

/**
 * Remembers every gift that actually reaches the server from TikTok, so the
 * host can see the real numeric gift ids / names / coin values their LIVE
 * receives (Admin → Gift Battle → "Gift terdeteksi") and map them without
 * guessing. Fire-and-forget: a DB hiccup must never block gift processing.
 */
export function recordSeenGift(gift: {
  giftId: string;
  giftName?: string;
  diamondCount?: number;
  imageUrl?: string;
  sender?: string;
}): void {
  const now = new Date();
  prisma.seenGift
    .upsert({
      where: { giftId: gift.giftId },
      create: {
        giftId: gift.giftId,
        giftName: gift.giftName ?? `Gift ${gift.giftId}`,
        diamondCount: gift.diamondCount ?? 0,
        imageUrl: gift.imageUrl,
        timesSeen: 1,
        lastSender: gift.sender,
      },
      update: {
        ...(gift.giftName ? { giftName: gift.giftName } : {}),
        ...(gift.diamondCount ? { diamondCount: gift.diamondCount } : {}),
        ...(gift.imageUrl ? { imageUrl: gift.imageUrl } : {}),
        timesSeen: { increment: 1 },
        lastSender: gift.sender,
        lastSeenAt: now,
      },
    })
    .catch((err: unknown) => console.error("[giftDiscovery] failed to record gift:", err));
}
