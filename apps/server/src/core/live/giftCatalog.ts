import { normalizeGiftName } from "@tebak-kata/shared";
import { prisma } from "../db.js";

/** One gift from TikTok's public gift list (id, name, coin price, icon). */
export interface CatalogGift {
  id: string;
  name: string;
  diamondCount: number;
  imageUrl: string | null;
  combo: boolean;
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12_000;
/** Stored in battle_settings so the catalog survives restarts and offline starts. */
const STORE_ID = "gift-catalog";

let cache: { at: number; gifts: CatalogGift[] } | null = null;
let inflight: Promise<CatalogGift[]> | null = null;

function catalogUrl(): string {
  const region = (process.env.TIKTOK_REGION || "ID").toUpperCase();
  const params = new URLSearchParams({
    aid: "1988",
    app_name: "tiktok_web",
    app_language: "id-ID",
    browser_language: "id-ID",
    browser_platform: "Win32",
    device_platform: "web_pc",
    region,
    priority_region: region,
  });
  return `https://webcast.tiktok.com/webcast/gift/list/?${params}`;
}

interface RawGift {
  id?: number | string;
  name?: string;
  diamond_count?: number;
  combo?: boolean;
  image?: { url_list?: string[] };
  icon?: { url_list?: string[] };
}

async function fetchFromTikTok(): Promise<CatalogGift[]> {
  const res = await fetch(catalogUrl(), {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`TikTok gift list HTTP ${res.status}`);
  const body = (await res.json()) as { data?: { gifts?: RawGift[] } };
  const seen = new Set<string>();
  const gifts: CatalogGift[] = [];
  for (const g of body.data?.gifts ?? []) {
    const id = g.id !== undefined ? String(g.id) : "";
    if (!id || !g.name || seen.has(id)) continue;
    seen.add(id);
    gifts.push({
      id,
      name: g.name.trim(),
      diamondCount: g.diamond_count ?? 0,
      imageUrl: g.image?.url_list?.[0] ?? g.icon?.url_list?.[0] ?? null,
      combo: Boolean(g.combo),
    });
  }
  if (gifts.length === 0) throw new Error("TikTok gift list was empty");
  return gifts.sort((a, b) => a.diamondCount - b.diamondCount || a.name.localeCompare(b.name));
}

/**
 * TikTok's public gift catalog (the same data the gift panel shows), cached
 * in memory for 12h and persisted as a fallback. Never throws: if TikTok is
 * unreachable it returns the last stored copy (or an empty list).
 */
export async function getGiftCatalog(force = false): Promise<CatalogGift[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.gifts;
  inflight ??= (async () => {
    try {
      const gifts = await fetchFromTikTok();
      cache = { at: Date.now(), gifts };
      await prisma.battleSetting
        .upsert({ where: { id: STORE_ID }, create: { id: STORE_ID, configJson: JSON.stringify(gifts) }, update: { configJson: JSON.stringify(gifts) } })
        .catch((err: unknown) => console.error("[giftCatalog] failed to persist catalog:", err));
      console.log(`[giftCatalog] loaded ${gifts.length} gifts from TikTok`);
      return gifts;
    } catch (err) {
      console.warn("[giftCatalog] TikTok gift list unavailable, using stored copy:", (err as Error).message);
      const stored = await prisma.battleSetting.findUnique({ where: { id: STORE_ID } }).catch(() => null);
      let gifts: CatalogGift[] = [];
      try {
        gifts = stored ? (JSON.parse(stored.configJson) as CatalogGift[]) : [];
      } catch {
        gifts = [];
      }
      cache = { at: Date.now() - CACHE_TTL_MS + 5 * 60 * 1000, gifts }; // retry in ~5 min
      return gifts;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * The catalog without ever touching the network: memory cache, else the
 * stored copy. For hot paths (gift processing) that must not wait on TikTok.
 */
export async function getCachedGiftCatalog(): Promise<CatalogGift[]> {
  if (cache) return cache.gifts;
  const stored = await prisma.battleSetting.findUnique({ where: { id: STORE_ID } }).catch(() => null);
  if (!stored) return [];
  try {
    const gifts = JSON.parse(stored.configJson) as CatalogGift[];
    // Marked stale so the next getGiftCatalog() still refreshes from TikTok.
    cache = { at: 0, gifts };
    return gifts;
  } catch {
    return [];
  }
}

/** Catalog entry for a gift: exact id first, then the (normalized) name. */
export function lookupCatalogGift(gifts: CatalogGift[], giftId: string | null | undefined, giftName?: string | null): CatalogGift | null {
  if (giftId) {
    const byId = gifts.find((g) => g.id === giftId);
    if (byId) return byId;
  }
  const name = normalizeGiftName(giftName);
  return name ? (gifts.find((g) => normalizeGiftName(g.name) === name) ?? null) : null;
}
