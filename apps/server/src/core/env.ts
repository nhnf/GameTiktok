import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  hostToken: process.env.HOST_TOKEN ?? "dev-host-token",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  mockTikTokEnabled: (process.env.MOCK_TIKTOK_ENABLED ?? "true").toLowerCase() === "true",
  /** "mock" (default) drives the demo generator; "tiktok" connects to a real LIVE room. */
  liveSource: (process.env.LIVE_SOURCE === "tiktok" ? "tiktok" : "mock") as "mock" | "tiktok",
  /** Default TikTok @username to join when liveSource is "tiktok"; overridable per-session via the Start Session form. */
  tiktokUsername: process.env.TIKTOK_USERNAME || undefined,
  /** tiktok-live-connector >=2.x signs requests via Euler Stream; a key is required since the keyless free tier became paid-only. */
  tiktokSignApiKey: process.env.TIKTOK_SIGN_API_KEY || undefined,
  /**
   * Optional TikTok login session (browser cookies `sessionid` + `tt-target-idc`).
   * When both are set the LIVE WebSocket connects as that account, which TikTok
   * may require before it pushes chat comments. NOTE: the session is forwarded to
   * the Euler Stream sign server — use a secondary account, never your main one.
   */
  tiktokSessionId: process.env.TIKTOK_SESSION_ID || undefined,
  tiktokTargetIdc: process.env.TIKTOK_TT_TARGET_IDC || undefined,
};
