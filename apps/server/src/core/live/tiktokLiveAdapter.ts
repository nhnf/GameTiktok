import {
  ControlEvent,
  TikTokLiveConnection,
  WebcastEvent,
  type ClientEventMap,
  type TikTokLiveConstructorConnectionOptions,
  type WebcastChatMessage,
  type WebcastGiftMessage,
} from "tiktok-live-connector";
import type { GameSessionManager } from "../session/sessionManager.js";
import { GiftComboTracker } from "@tebak-kata/shared";
import type { LiveAdapter } from "./liveAdapter.js";
import { recordSeenGift } from "./giftDiscovery.js";
import { giftMessageToIncoming, toPlayerIdentity } from "./tiktokMessages.js";

export { giftMessageToIncoming } from "./tiktokMessages.js";

const RECONNECT_DELAYS_MS = [5_000, 10_000, 20_000, 30_000];

/**
 * `TikTokLiveConnection` extends an EventEmitter typed via `typed-emitter`,
 * whose CommonJS-style `export default` doesn't resolve under this
 * project's `NodeNext` module resolution — so TS loses `.on` etc. Re-state
 * the emitter surface we use, keyed by the library's own `ClientEventMap`.
 */
type LiveConnection = TikTokLiveConnection & {
  on<E extends keyof ClientEventMap>(event: E, listener: ClientEventMap[E]): LiveConnection;
  removeAllListeners(event?: keyof ClientEventMap): LiveConnection;
};

/**
 * Real TikTok LIVE ingestion — connects to a creator's live room via
 * `tiktok-live-connector` (unofficial; reverse-engineered TikTok Webcast
 * protocol, AGPL-3.0-licensed — see README "Known gaps" for the
 * implications) and feeds real comments/gifts into the exact same
 * `GameSessionManager.handleComment` / `.applyGift` path the
 * MockTikTokAdapter uses. No game-engine or API changes were needed to
 * add this — that's the point of the `LiveAdapter` interface.
 *
 * Uses the modern `TikTokLiveConnection` API, which emits raw proto v3
 * messages. The `tiktok-live-connector/legacy` wrapper is NOT used: its
 * data converter still reads proto v1 field names (e.g. `ranksList`) and
 * crashes the process on every viewer-count update.
 *
 * Requires the target account to actually be broadcasting; `connect()`
 * rejects for offline rooms.
 */
export class TikTokLiveAdapter implements LiveAdapter {
  readonly kind = "tiktok" as const;
  readonly keepAliveOnPause = true;
  private connection: LiveConnection | null = null;
  private connected = false;
  private reconnectTimer: NodeJS.Timeout | undefined;
  private reconnectAttempt = 0;
  private running = false;
  private readonly combos = new GiftComboTracker();

  constructor(
    private readonly manager: GameSessionManager,
    private username: string,
    private readonly signApiKey?: string,
    /** Optional logged-in TikTok session; TikTok may withhold chat from anonymous sockets. */
    private readonly session?: { sessionId: string; ttTargetIdc: string },
  ) {}

  configure(options: Record<string, unknown>): void {
    if (typeof options.username === "string" && options.username.trim()) {
      this.username = options.username.trim().replace(/^@/, "");
    }
  }

  async start(): Promise<void> {
    if (this.running) return; // already connected/connecting (e.g. resume after a pause)
    if (!this.username) {
      throw new Error("TikTok username not configured. Set TIKTOK_USERNAME or pass tiktokUsername when starting the session.");
    }
    this.running = true;
    this.reconnectAttempt = 0;
    await this.connect();
  }

  stop(): void {
    this.running = false;
    clearTimeout(this.reconnectTimer);
    this.teardownConnection();
  }

  isRunning(): boolean {
    return this.running;
  }

  describe(): string {
    if (!this.running) return "TikTok tidak terhubung";
    return this.connected ? `Terhubung ke @${this.username}` : `Menghubungkan ke @${this.username}...`;
  }

  private teardownConnection(): void {
    const connection = this.connection;
    this.connection = null;
    this.connected = false;
    if (!connection) return;
    connection.removeAllListeners();
    // Swallow errors: disconnect is best-effort and the listeners are gone.
    connection.on(ControlEvent.ERROR, () => {});
    connection.disconnect().catch(() => {});
  }

  private async connect(): Promise<void> {
    if (!this.running) return;
    this.teardownConnection();

    // NOTE: do NOT set enableExtendedGiftInfo — it makes the connector call
    // Euler's fetch-room-gifts HTTP route, which is Business-plan-only and
    // aborts connect() with SignatureMissingTokensError on free API keys.
    // Gift matching only needs the numeric giftId from the WS event (mapped
    // against our own Gift settings), never the extended catalog.
    // processInitialData: false — the initial sign response replays a batch
    // of recent room messages. Those are stale comments (would be scored as
    // fresh guesses) and can include an old stream-ended control message
    // that makes the connector disconnect right after connecting.
    const baseOptions = {
      processInitialData: false,
      ...(this.signApiKey ? { signApiKey: this.signApiKey } : {}),
    };
    const options: TikTokLiveConstructorConnectionOptions = this.session
      ? {
          ...baseOptions,
          authenticateWs: true,
          session: {
            cookie: {
              type: "cookie",
              value: { sessionId: this.session.sessionId, ttTargetIdc: this.session.ttTargetIdc },
            },
          },
        }
      : baseOptions;
    const connection = new TikTokLiveConnection(this.username, options) as LiveConnection;
    this.connection = connection;
    console.log(
      `[tiktokLiveAdapter] connecting to @${this.username} (${this.session ? "authenticated session" : "anonymous"})`,
    );

    connection.on(WebcastEvent.CHAT, (data: WebcastChatMessage) => {
      const identity = toPlayerIdentity(data.user);
      if (!identity || typeof data.content !== "string") {
        console.warn("[tiktokLiveAdapter] chat without user/content, skipped");
        return;
      }
      console.log(`[tiktokLiveAdapter] chat @${identity.username}: ${data.content}`);
      this.manager
        .handleComment({ ...identity, rawComment: data.content })
        .catch((err: unknown) => console.error("[tiktokLiveAdapter] failed to handle comment:", err));
    });

    connection.on(WebcastEvent.GIFT, (data: WebcastGiftMessage) => {
      const parsed = giftMessageToIncoming(data, this.combos, Date.now());
      if (!parsed) {
        console.warn("[tiktokLiveAdapter] gift without user/giftId, skipped");
        return;
      }
      const { gift, repeatCount } = parsed;
      recordSeenGift({
        giftId: gift.giftId,
        giftName: gift.giftName,
        diamondCount: gift.diamondCount,
        imageUrl: data.gift?.image?.urlList?.[0],
        sender: gift.username,
      });
      console.log(
        `[tiktokLiveAdapter] gift @${gift.username}: ${gift.giftName ?? "?"} (id ${gift.giftId}, ${gift.diamondCount} koin) repeat=${repeatCount} end=${gift.comboEnded} +${gift.count}`,
      );
      // A count of 0 still matters when the combo just ended (one-per-combo games).
      if (gift.count === 0 && !gift.comboEnded) return;
      this.manager
        .applyGift(gift)
        .catch((err: unknown) => console.error("[tiktokLiveAdapter] failed to apply gift:", err));
    });

    connection.on(WebcastEvent.STREAM_END, ({ action }) => {
      console.log(`[tiktokLiveAdapter] @${this.username}'s LIVE ended (control action ${action}).`);
    });

    connection.on(ControlEvent.DISCONNECTED, () => {
      if (this.connection === connection) {
        this.connected = false;
        this.manager.broadcastFullState();
      }
      if (!this.running || this.connection !== connection) return;
      this.scheduleReconnect();
    });

    connection.on(ControlEvent.ERROR, (err: unknown) => {
      console.error("[tiktokLiveAdapter] connection error:", err);
    });

    try {
      const state = await connection.connect();
      if (this.connection !== connection) return; // stopped/replaced while connecting
      this.connected = true;
      this.reconnectAttempt = 0;
      this.manager.broadcastFullState();
      console.log(`[tiktokLiveAdapter] connected to @${this.username} (roomId ${state.roomId})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Business plan") && !this.signApiKey) {
        console.error(
          "[tiktokLiveAdapter] Euler Stream now requires an API key for request signing — set TIKTOK_SIGN_API_KEY in apps/server/.env (get a free key at https://www.eulerstream.com).",
        );
      }
      console.error(`[tiktokLiveAdapter] failed to connect to @${this.username}:`, err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.running) return;
    clearTimeout(this.reconnectTimer);
    const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
    this.reconnectAttempt++;
    console.warn(`[tiktokLiveAdapter] retrying @${this.username} in ${delay / 1000}s...`);
    this.reconnectTimer = setTimeout(() => void this.connect(), delay);
  }
}
