# Tebak Kata Live

Full-stack scaffold for **Tebak Kata Live**, an interactive word-guessing game for TikTok LIVE. See
[`PRD_Tebak_Kata_Live_TikTok.md`](./PRD_Tebak_Kata_Live_TikTok.md) and
[`TEBAK_KATA_LIVE_Design_System_v1.0.md`](./TEBAK_KATA_LIVE_Design_System_v1.0.md) for the product spec and design
system this implements.

## What's here

A server-authoritative game engine, a real-time WebSocket layer, an OBS overlay, a Host Dashboard, and an
Admin/Setup surface — all wired together and runnable locally with **zero external services** (SQLite, no Docker).
Comment/gift traffic can come from either a `MockTikTokAdapter` (default — no TikTok account needed) or a real
`TikTokLiveAdapter` that joins an actual TikTok LIVE room, both feeding the identical game engine.

Every game is its own module — one folder per game in each package — so a game can be changed without touching
the others. Source files are kept at **≤ 300 lines**; when a file needs more, it is split into a new file.

```
TebakKata/
├── packages/shared/src/
│   ├── core/                 # Game types/registry (GAME_INFO), session types, WS event contract, gift helpers, tokens
│   └── games/<game>/         # Per-game types, constants and pure engine rules
├── apps/server/              # Express + ws + Prisma — the authoritative game engine
│   ├── prisma/schema.prisma  # DB structure (PRD §35); migrations in prisma/migrations
│   └── src/
│       ├── core/session/     # SessionManager (start/pause/resume/end/switch), live timer, players, settings
│       ├── core/live/        # LiveAdapter interface + mock generator + real TikTok LIVE connection
│       ├── core/realtime/    # Broadcaster + WebSocket server (overlay vs host audiences)
│       ├── core/routes/      # REST: config, state, session, mock, settings
│       └── games/<game>/     # Per-game adapter (GameAdapter), persistence and REST routes; games/registry.ts wires them
└── apps/web/                 # Next.js (App Router) — overlay, host dashboard, admin
    ├── app/                  # Routes: /overlay, /host, /admin/*, /dev/*
    ├── components/           # Shared shell, host, overlay and UI components
    └── games/<game>/         # Per-game api, host panels, overlay layout/banners, admin pages
                              # (registered in games/hostRegistry.ts, overlayRegistry.ts, nav.ts)
```

`<game>` is one of `tebakKata`, `tekaKata` (Susun Kata), `matematika`, `mathBattle` (Tarik Tambang) and
`autoBattle`. Adding a game means adding one folder per package plus one registry entry each.

## Auto Battle Arena (gift battle)

A fourth game, **⚔️ Auto Battle**, driven entirely by viewer gifts: each gift picks a team and summons units that
fight automatically (spec: `Auto Battle Arena/PRD_TikTok_LIVE_Auto_Battle_Arena.md`). Select it in the Host
Dashboard's game picker. Gift mapping, team/unit tuning and match history live under **Admin → Auto Battle**. The
gift pipeline, combo handling, setup checklist and balancing notes are in
[`Auto Battle Arena/PANDUAN_GIFT_AUTO_BATTLE.md`](./Auto%20Battle%20Arena/PANDUAN_GIFT_AUTO_BATTLE.md).

```bash
npm run test -w apps/server   # TikTok gift message parsing (combo deltas, msgId de-duplication)
```

## Prerequisites

- Node.js 20+
- Nothing else — SQLite ships as a file, no Docker/Postgres needed for local dev.

## Setup

```bash
npm install

# Server: generate Prisma client, create the SQLite DB, seed sample data
cp apps/server/.env.example apps/server/.env
npm run db:migrate
npm run db:seed

# Web: point at the local API
cp apps/web/.env.local.example apps/web/.env.local
```

## Running

Two terminals:

```bash
npm run dev:server   # http://localhost:4000  (REST + WebSocket)
npm run dev:web       # http://localhost:3000  (overlay / host / admin)
```

Open `http://localhost:3000`:

- **`/overlay`** — OBS Browser Source target (neo-brutalism design, see `PLAN_Redesign_Neo_Brutalism.md`). Query
  params: `?bg=paper|yellow|dark|transparent` (default `paper`; legacy `?transparent=1` still works), `?sound=0`
  (mute synthesized SFX, on by default), `?reducedMotion=1` (disable animation/confetti — Design System §44
  Accessibility), `?ticker=0` (hide the latest-guesses ribbon), `?howto=0` (hide the idle "how to play" cards).
- **`/dev/overlay-preview`** — development only: drive every overlay state and event (win, gift, boss, pause,
  session end, disconnect) with fake data, no server or LIVE needed.
- **`/host`** — Host Dashboard. Enter the `HOST_TOKEN` from `apps/server/.env` (default `dev-host-token`) once; it's
  kept in `localStorage`.
- **`/admin/words`** — Words / Categories / Gifts / Settings management (same token).

Click **▶ Mulai sesi LIVE** on the Host Dashboard (keyboard shortcuts while a session runs: `H` hint, `S` skip,
`N` new word, `P` pause/resume). With the default `LIVE_SOURCE=mock`, simulated viewers start
commenting/gifting immediately — no real TikTok connection needed to see the whole game loop play out.

### Connecting to a real TikTok LIVE

1. In `apps/server/.env`, set `LIVE_SOURCE="tiktok"` and `TIKTOK_SIGN_API_KEY` — from v2.4+ the connector signs
   WebSocket requests via [Euler Stream](https://www.eulerstream.com/), and the keyless free tier is paid-only, so
   create a free account there and paste the API key. Restart `npm run dev:server`.
2. Start actually broadcasting on TikTok LIVE first — the connection rejects offline rooms.
3. On the Host Dashboard's Start card, a **TikTok Username** field appears; enter the creator's `@handle` (no `@`)
   and click Start. (Or set `TIKTOK_USERNAME` in `.env` as a default so the field pre-fills.)
4. Real chat comments and gifts now drive the game exactly like the mock adapter did — same prefix matching, same
   scoring, same first-winner rule.

This uses [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector), an **unofficial**,
reverse-engineered client for TikTok's internal Webcast protocol (no official public API exists for this). Two
things to know before relying on it:

- **License:** the package is **AGPL-3.0-only**. If you deploy a modified version of this project as a network
  service, AGPL requires you to make that modified source available to its users. Review this with counsel before
  shipping a commercial/hosted product built on it.
- **Stability:** TikTok can change the protocol without notice, breaking the connector until it's updated upstream.
  It disconnects/reconnects automatically (`src/core/live/tiktokLiveAdapter.ts`, capped exponential backoff) but
  isn't a guaranteed-uptime API — the library's own README recommends TikTok's managed WebSocket API for
  production workloads that need one.

## Tests

```bash
npm run test:shared           # game-engine unit tests for every game (scoring, generators, battle simulation, ...)
npm run test -w apps/server   # session lifecycle, live timer, gift parsing and per-game integration tests
```

The shared test suite encodes PRD §52's acceptance criteria (Scenarios A–G) directly as assertions. Server tests
run against a separate `apps/server/prisma/test.db` (migrated and seeded automatically), never your `dev.db`.

After pulling schema changes, apply them with `npx prisma migrate deploy` in `apps/server` (safe on existing data).

## Key design decisions

- **Server-authoritative, in-memory + persisted.** `SessionManager` holds the live session/leaderboard and each
  game's `GameAdapter` holds its round state in memory for speed, broadcasting deltas over WebSocket; every
  meaningful event is also persisted via Prisma for analytics/history (PRD §35–40).
- **Winner atomicity without locks (PRD §43).** The block that decides a winner — read `puzzle.status`, then set it
  to `SOLVED` — never `await`s midway. Node runs synchronous code to completion before the next message, so two
  near-simultaneous correct guesses can't both win.
- **SQLite by default.** The PRD recommends PostgreSQL for production; the Prisma schema deliberately avoids any
  Postgres-only types so swapping `provider`/`DATABASE_URL` is a one-line change plus a fresh migration.
- **Adapter interface, not a special case.** `LiveAdapter` (`start()`/`stop()`/`configure()`) is implemented by
  both `MockTikTokAdapter` and `TikTokLiveAdapter`; `apps/server/src/index.ts` picks one based on `LIVE_SOURCE`.
  Neither the game engine, the REST API, nor the UI know or care which one is active.
- **Single shared bearer token for Host/Admin (PRD §49).** `HOST_TOKEN` on the server, entered once in the browser.
  Real login/roles are a follow-up, not needed to prove the product end-to-end.
- **Category/difficulty visible, never a hint (PRD §17).** The public `PuzzlePublicState` never carries the target
  word; only `PuzzleHostState` (sent solely to `role=host` WebSocket connections) does.

## Deferred (per PRD §41, §50, §53)

Achievements, permanent cross-LIVE leaderboards, team mode, and multiple game modes are explicitly out of V1
scope and not implemented here.

## Known gaps vs. the spec

Honest accounting against the PRD/Design System checklists — not implemented, and why:

- **Rate limiting on comment ingestion** (PRD §42). Partially moot now that real TikTok traffic is possible: the
  engine itself has no per-comment throttle (relies on Node processing events off the main thread's synchronous
  critical section fast enough — see "Winner atomicity" above), and `/api/mock/*` is authenticated, not a public
  high-volume surface.
- **Leaderboard reorder (FLIP) animation** (Design System §21, worded "dapat" — optional). Rank changes update
  instantly instead of sliding.
- **Full identity/roles for Host/Admin** (PRD §49 only requires "authenticated"). One shared `HOST_TOKEN` today;
  per-user accounts are a follow-up.
- **Achievements** — explicitly deferred by the PRD itself (§41), not built.
