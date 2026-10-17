import type { ServerEvent } from "@tebak-kata/shared";
import { PlayerPoints, StampTitle } from "@/components/overlay/widgets/BannerParts";
import type { BannerSpec } from "../../overlayTypes";

/** Matematika celebrations (PRD §57–59 events). */
export function matematikaBanner(event: ServerEvent): BannerSpec | null {
  switch (event.type) {
    case "MATH_ANSWER_CORRECT": {
      const { player, points, rank, isBoss, streak, streakBonus } = event.payload;
      // Only the podium or boss/streak answers get a big banner
      if (rank > 3 && !isBoss && (!streak || streak < 3)) return null;
      return {
        durationMs: isBoss ? 2200 : 1600,
        sound: isBoss ? "boss" : "winner",
        placement: "center",
        render: (motion) => (
          <div className="flex flex-col items-center gap-8">
            <StampTitle size={84} tone={isBoss ? "bg-purple text-white" : "bg-green"} tilt="-rotate-[4deg]" motion={motion}>
              {isBoss ? `👑 BENAR! BOSS #${rank}` : `Benar! #${rank}`}
            </StampTitle>
            <PlayerPoints username={player.username} points={points} size={210} />
            {streak && streak >= 3 && (
              <div className="rounded-full border-3 border-ink bg-yellow px-6 py-2 font-display text-[26px] font-black uppercase text-ink shadow-nb-sm">
                🔥 {streak}x Combo ({streakBonus ? `+${streakBonus} Bonus` : ""})
              </div>
            )}
          </div>
        ),
      };
    }
    case "GIFT_GOAL_ACHIEVED": {
      return {
        durationMs: 3200,
        sound: "boss",
        dim: true,
        confetti: true,
        queue: true,
        placement: "center",
        render: (motion) => (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className={`-rotate-2 rounded-nb border-6 border-ink bg-purple px-14 py-8 text-white shadow-nb-xl ${motion ? "animate-stamp" : ""}`}>
              <div className="font-display text-[72px] uppercase leading-none text-yellow">
                🎯 TARGET TERCAPAI!
              </div>
              <div className="mt-4 font-display text-[48px] uppercase leading-tight text-white">
                👑 SOAL BERIKUTNYA:<br />
                <span className="text-yellow underline">BOSS ROUND (3× POIN)</span>
              </div>
            </div>
          </div>
        ),
      };
    }
    case "STREAK_MILESTONE": {
      const { player, streak, bonusPoints } = event.payload;
      return {
        durationMs: 2200,
        sound: "winner",
        placement: "center",
        queue: true,
        render: (motion) => (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className={`rotate-2 rounded-nb border-6 border-ink bg-orange px-12 py-6 text-ink shadow-nb-xl ${motion ? "animate-pop-in" : ""}`}>
              <div className="font-display text-[64px] font-black uppercase leading-none text-white">
                🔥 {streak}X COMBO STREAK!
              </div>
              <div className="mt-2 font-display text-[40px] uppercase text-ink">
                @{player.username}
              </div>
              <div className="mt-1 font-display text-[30px] font-black text-yellow">
                +{bonusPoints} BONUS POIN!
              </div>
            </div>
          </div>
        ),
      };
    }
    case "MATH_TIME_UP": {
      const { answer, totalCorrect } = event.payload;
      return {
        durationMs: 2400,
        sound: "winner",
        dim: true,
        confetti: totalCorrect > 0,
        queue: true,
        placement: "center",
        render: (motion) => (
          <div className="flex flex-col items-center gap-10 text-center">
            <div className={`-rotate-2 rounded-nb border-6 border-ink bg-yellow px-14 py-8 shadow-nb-xl ${motion ? "animate-stamp" : ""}`}>
              <div className="font-display text-[88px] uppercase leading-none text-ink">⏱ Waktu habis!</div>
              <div className="mt-4 font-display text-[64px] uppercase leading-none text-ink">
                Jawaban: <span className="underline">{answer}</span>
              </div>
            </div>
            <div className="rounded-full border-4 border-ink bg-white px-8 py-3 font-display text-[32px] uppercase tracking-wider text-ink shadow-nb-md">
              {totalCorrect > 0 ? `${totalCorrect} penonton menjawab benar` : "Belum ada yang benar — coba lagi!"}
            </div>
          </div>
        ),
      };
    }
    default:
      return null;
  }
}
