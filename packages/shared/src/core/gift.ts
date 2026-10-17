/** Case/whitespace-insensitive gift name key ("Ice  cream cone" === "Ice Cream Cone"). */
export function normalizeGiftName(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Remembers the last `capacity` event ids (bounded memory for multi-hour
 * LIVEs). `markIfNew` returns false for an id it has already seen.
 */
export class EventIdDeduper {
  private readonly seen = new Set<string>();
  private readonly order: string[] = [];

  constructor(private readonly capacity = 20_000) {}

  markIfNew(eventId: string): boolean {
    if (this.seen.has(eventId)) return false;
    this.seen.add(eventId);
    this.order.push(eventId);
    if (this.order.length > this.capacity) {
      const evicted = this.order.splice(0, this.order.length - this.capacity);
      for (const id of evicted) this.seen.delete(id);
    }
    return true;
  }

  clear(): void {
    this.seen.clear();
    this.order.length = 0;
  }

  get size(): number {
    return this.seen.size;
  }
}

export interface ComboTick {
  userId: string;
  giftId: string;
  /** TikTok groupId — identifies one combo streak. */
  groupId?: string | null;
  /** Cumulative count within the streak (TikTok `repeatCount`). */
  repeatCount: number;
  /** True on the final message of a streak (TikTok `repeatEnd`). */
  repeatEnd: boolean;
  /** Streakable gifts (e.g. Rose) re-send cumulative counts while the combo runs. */
  streakable: boolean;
  now: number;
}

/**
 * Turns TikTok's cumulative combo messages into per-message deltas.
 *
 * A Rose combo ×10 arrives as several messages whose `repeatCount` grows
 * (1, 3, 7, 10…) and ends with `repeatEnd`. Counting every message would
 * over-spawn; counting only the final one would make viewers wait until
 * they stop tapping. Tracking the last count per streak lets the game
 * react *as the combo happens* while still totalling exactly 10. Repeated
 * or out-of-order messages yield a delta of 0.
 */
export class GiftComboTracker {
  private readonly streaks = new Map<string, { count: number; lastSeen: number; ended: boolean }>();

  constructor(private readonly staleAfterMs = 60_000) {}

  /** Returns how many gifts this message adds (0 = nothing new). */
  delta(tick: ComboTick): number {
    const repeat = Math.max(1, Math.floor(tick.repeatCount || 1));
    if (!tick.streakable) return repeat;

    this.sweep(tick.now);
    const key = `${tick.userId}:${tick.giftId}:${tick.groupId ?? ""}`;
    const entry = this.streaks.get(key);

    // A finished streak stays remembered so a re-sent final message adds
    // nothing; any other message on that key is a brand-new streak (TikTok
    // doesn't always send a groupId).
    if (entry?.ended && tick.repeatEnd && repeat === entry.count) return 0;
    const prev = entry && !entry.ended ? entry.count : 0;
    const added = Math.max(0, repeat - prev);

    this.streaks.set(key, { count: Math.max(prev, repeat), lastSeen: tick.now, ended: tick.repeatEnd });
    return added;
  }

  private sweep(now: number): void {
    for (const [key, streak] of this.streaks) {
      if (now - streak.lastSeen > this.staleAfterMs) this.streaks.delete(key);
    }
  }

  get openStreaks(): number {
    return this.streaks.size;
  }
}

/** Short random id (browser + Node safe, no dependency). */
export function randomId(prefix = ""): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
