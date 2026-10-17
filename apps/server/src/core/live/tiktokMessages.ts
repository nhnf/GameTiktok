import type { User, WebcastGiftMessage } from "tiktok-live-connector";
import type { GiftComboTracker, IncomingGift } from "@tebak-kata/shared";

/** Gift type TikTok uses for streakable/combo gifts (e.g. Rose). */
const STREAKABLE_GIFT_TYPE = 1;

export interface PlayerIdentity {
  platformUserId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Maps a raw proto v3 `User` into the identity shape the session manager
 * expects. Returns null when TikTok sent no usable user id.
 */
export function toPlayerIdentity(user: User | undefined): PlayerIdentity | null {
  const platformUserId = user?.id ? String(user.id) : "";
  if (!platformUserId) return null;
  return {
    platformUserId,
    username: user?.displayId || platformUserId,
    displayName: user?.nickname || undefined,
    avatarUrl: user?.avatarThumb?.urlList?.[0] ?? user?.avatarLarge?.urlList?.[0],
  };
}

/**
 * Translates one raw TikTok gift message into the engine's `IncomingGift`.
 *
 * Streakable gifts (e.g. Rose) refire per tick with a cumulative
 * `repeatCount` while the sender holds the combo; `combos` turns that into
 * per-message deltas so a ×10 combo adds exactly 10. `eventId` is TikTok's
 * message id, which the battle engine uses to drop re-delivered messages.
 * Returns null when TikTok sent no usable user/gift id.
 */
export function giftMessageToIncoming(
  data: Pick<WebcastGiftMessage, "user" | "giftId" | "gift" | "repeatCount" | "repeatEnd" | "groupId" | "common">,
  combos: GiftComboTracker,
  now: number,
): { gift: IncomingGift; repeatCount: number } | null {
  const identity = toPlayerIdentity(data.user);
  const giftId = String(data.giftId || data.gift?.id || "");
  if (!identity || !giftId || giftId === "0") return null;

  const streakable = data.gift?.type === STREAKABLE_GIFT_TYPE || data.gift?.combo === true;
  const comboEnded = !streakable || Boolean(data.repeatEnd);
  const count = combos.delta({
    userId: identity.platformUserId,
    giftId,
    groupId: data.groupId,
    repeatCount: data.repeatCount,
    repeatEnd: comboEnded,
    streakable,
    now,
  });
  const msgId = data.common?.msgId;
  const eventId =
    msgId && msgId !== "0"
      ? `tt:${msgId}`
      : `tt:${identity.platformUserId}:${giftId}:${data.groupId}:${data.repeatCount}:${comboEnded ? "end" : "tick"}`;

  const rawGift = data.gift as Record<string, unknown> | undefined;
  const rawData = data as unknown as Record<string, unknown>;
  const diamondCount =
    (typeof rawGift?.diamondCount === "number" && rawGift.diamondCount > 0 ? rawGift.diamondCount : 0) ||
    (typeof rawGift?.diamond_count === "number" && rawGift.diamond_count > 0 ? (rawGift.diamond_count as number) : 0) ||
    (typeof rawData?.diamondCount === "number" && rawData.diamondCount > 0 ? (rawData.diamondCount as number) : 0) ||
    0;

  return {
    repeatCount: data.repeatCount,
    gift: {
      ...identity,
      giftId,
      giftName: data.gift?.name || undefined,
      diamondCount,
      count,
      comboEnded,
      eventId,
    },
  };
}
