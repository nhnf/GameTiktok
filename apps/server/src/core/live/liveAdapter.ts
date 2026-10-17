/**
 * Common shape for anything that feeds comment/gift traffic into the game
 * engine — the simulator (mockTikTokAdapter.ts) and the real TikTok LIVE
 * connection (tiktokLiveAdapter.ts) are interchangeable behind this
 * interface (PRD section 53: "game engine yang sama dan adapter berbeda
 * untuk sumber event").
 */
export interface LiveAdapter {
  readonly kind: "mock" | "tiktok";
  /**
   * Stay connected while the host pauses the session. The real TikTok
   * connection does (reconnecting is slow and gifts sent during a pause
   * still count); the simulator stops producing fake traffic.
   */
  readonly keepAliveOnPause: boolean;
  start(): Promise<void>;
  isRunning(): boolean;
  stop(): void;
  /** Adapter-specific runtime config (e.g. which TikTok username to join). */
  configure?(options: Record<string, unknown>): void;
  /** Short human-readable connection status for the host dashboard. */
  describe?(): string;
}
