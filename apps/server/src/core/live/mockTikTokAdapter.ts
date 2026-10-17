import { prisma } from "../db.js";
import type { GameSessionManager } from "../session/sessionManager.js";
import type { LiveAdapter } from "./liveAdapter.js";

const FAKE_VIEWERS = ["andi", "budi", "siti", "rian", "dewi", "fajar", "nina", "agus", "rina", "wati", "eko", "yuni"];

const NOISE_COMMENTS = ["HALO", "MANTAP", "GASS", "SEMANGAT", "KEREN", "WKWK", "HAI KAK", "COBA AH", "ASIK NIH", "GG"];

function randomFrom<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Simulates TikTok LIVE comment/gift traffic against the real game engine
 * so the overlay/host dashboard are demonstrable without a live TikTok
 * connection. Each game module supplies plausible comments through its
 * `mockComment()` hook, so the simulator never needs game-specific code.
 */
export class MockTikTokAdapter implements LiveAdapter {
  readonly kind = "mock" as const;
  readonly keepAliveOnPause = false;
  private timer: NodeJS.Timeout | null = null;
  private wordGiftIds: string[] = [];
  private running = false;

  constructor(private readonly manager: GameSessionManager) {}

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    const gifts = await prisma.giftConfig.findMany({ where: { enabled: true } }).catch(() => []);
    this.wordGiftIds = gifts.map((g) => g.giftId);
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  isRunning(): boolean {
    return this.running;
  }

  describe(): string {
    return this.running ? "Simulasi berjalan" : "Simulasi berhenti";
  }

  private scheduleNext(): void {
    if (!this.running) return;
    const delayMs = 700 + Math.random() * 1800;
    this.timer = setTimeout(() => {
      this.tick()
        .catch((err: unknown) => console.error("[mock] simulated event failed:", err))
        .finally(() => this.scheduleNext());
    }, delayMs);
  }

  private async tick(): Promise<void> {
    const username = randomFrom(FAKE_VIEWERS);
    const platformUserId = `mock-${username}`;
    const game = this.manager.getActiveGame();

    // Gift-driven games get a steady stream of mapped gifts (some combos).
    if (game === "AUTO_BATTLE" || (game === "MATEMATIKA_BATTLE" && Math.random() < 0.25)) {
      const mappings =
        game === "AUTO_BATTLE"
          ? this.manager.getAutoBattleAdapter().getMappings()
          : this.manager.getMathBattleAdapter().getMappings().filter((m) => m.team !== "NEUTRAL");
      const enabled = mappings.filter((m) => m.enabled);
      if (enabled.length > 0) {
        const m = randomFrom(enabled);
        await this.manager.applyGift({
          platformUserId,
          username,
          giftId: m.giftId ?? `name:${m.giftName}`,
          giftName: m.giftName,
          diamondCount: 1, // keep the simulated LIVE timer sane
          count: Math.random() < 0.25 ? 2 + Math.floor(Math.random() * 4) : 1,
          comboEnded: true,
          eventId: `mock:${Date.now()}:${Math.random().toString(36).slice(2)}`,
        });
        return;
      }
    }

    // Word games: occasionally a letter-reveal gift.
    if ((game === "TEBAK_KATA" || game === "TEKA_KATA") && this.wordGiftIds.length > 0 && Math.random() < 0.06) {
      await this.manager.applyGift({ platformUserId, username, giftId: randomFrom(this.wordGiftIds), diamondCount: 1 });
      return;
    }

    const comment = this.manager.getCurrentAdapter().mockComment(platformUserId) ?? randomFrom(NOISE_COMMENTS);
    await this.manager.handleComment({ platformUserId, username, rawComment: comment });
  }
}
