import Link from "next/link";
import { GAME_INFO, GAME_TYPES } from "@tebak-kata/shared";

/** Design System v2.0 — Screen Map as a poster: Overlay / Host Dashboard / Admin. */
const LINKS = [
  {
    href: "/overlay",
    icon: "📺",
    title: "TikTok Overlay",
    desc: "Browser source OBS / LIVE Studio — 1080×1920 untuk penonton.",
    tone: "bg-yellow",
    tilt: "-rotate-2",
  },
  {
    href: "/host",
    icon: "🎮",
    title: "Host Dashboard",
    desc: "Kendalikan game, pantau live chat dan leaderboard.",
    tone: "bg-pink",
    tilt: "rotate-1",
  },
  {
    href: "/admin/words",
    icon: "🛠️",
    title: "Admin / Setup",
    desc: "Kelola bank kata, gift, pengaturan tiap game dan timer LIVE.",
    tone: "bg-blue",
    tilt: "-rotate-1",
  },
];

export default function HomePage() {
  return (
    <main className="bg-dots flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-16">
      <div className="relative">
        <div className="-rotate-2 rounded-nb border-6 border-ink bg-yellow px-8 py-4 shadow-nb-xl sm:px-10 sm:py-5">
          <h1 className="font-display text-5xl uppercase leading-none text-ink sm:text-7xl">Tebak Kata</h1>
        </div>
        <span className="absolute -right-5 -top-5 rotate-6 rounded-full border-5 border-ink bg-red px-4 py-1 font-display text-xl text-ink shadow-nb-sm sm:text-2xl">
          LIVE
        </span>
      </div>

      <p className="max-w-lg text-center text-base font-bold text-ink sm:text-lg">
        Game interaktif untuk TikTok LIVE — penonton ikut bermain lewat komentar & gift.
      </p>

      <div className="flex max-w-3xl flex-wrap justify-center gap-2">
        {GAME_TYPES.map((game) => (
          <span key={game} className="rounded-full border-3 border-ink bg-white px-3 py-1 text-sm font-bold shadow-nb-sm">
            {GAME_INFO[game].emoji} {GAME_INFO[game].label}
          </span>
        ))}
      </div>

      <div className="grid w-full max-w-4xl gap-8 sm:grid-cols-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-nb border-5 border-ink p-6 text-ink shadow-nb-lg transition-transform duration-150 hover:-translate-y-1 hover:rotate-0 focus-visible:rotate-0 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-ink ${link.tone} ${link.tilt}`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-nb border-3 border-ink bg-white text-3xl" aria-hidden>
              {link.icon}
            </div>
            <div className="mb-2 font-display text-2xl uppercase leading-tight">{link.title}</div>
            <div className="text-sm font-medium">{link.desc}</div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border-3 border-ink bg-white px-3 py-1 text-xs font-bold uppercase">
              Buka ➜
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
