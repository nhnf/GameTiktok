import type { MathBattleGiftFeedItem, MathBattleStreakState } from "@tebak-kata/shared";

/**
 * Streak Notification Banner.
 */
export function StreakNotification({ streak }: { streak: MathBattleStreakState }) {
  if (streak.brokenTeam && streak.brokenCount >= 2) {
    const brokenTeamName = streak.brokenTeam === "BLUE" ? "TIM BIRU" : "TIM MERAH";
    const winnerTeamName = streak.team === "BLUE" ? "TIM BIRU" : "TIM MERAH";
    return (
      <div className="flex w-full items-center justify-center animate-pop-in">
        <div className="flex items-center gap-3 rounded-2xl border-4 border-ink bg-purple px-6 py-2 text-white shadow-nb-md">
          <span className="text-[26px]">⚡</span>
          <span className="font-display text-[22px] font-black uppercase">
            STREAK BROKEN! {winnerTeamName} menghentikan streak {brokenTeamName}!
          </span>
        </div>
      </div>
    );
  }

  if (streak.team && streak.count >= 2) {
    const isBlue = streak.team === "BLUE";
    return (
      <div className="flex w-full items-center justify-center animate-pop-in">
        <div
          className={`flex items-center gap-3 rounded-2xl border-4 border-ink px-6 py-2 text-white shadow-nb-md ${
            isBlue ? "bg-[#2563eb]" : "bg-[#dc2626]"
          }`}
        >
          <span className="text-[26px]">🔥</span>
          <span className="font-display text-[22px] font-black uppercase">
            {isBlue ? "BLUE" : "RED"} STREAK x{streak.count}! ({streak.count} Ronde Berturut-turut!)
          </span>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Live Gift Feed Notifications.
 */
export function GiftFeed({ gifts }: { gifts: MathBattleGiftFeedItem[] }) {
  const topGifts = gifts.slice(0, 3);
  return (
    <div className="flex w-full flex-col gap-2 px-2">
      {topGifts.map((g) => {
        const isBlue = g.team === "BLUE";
        return (
          <div
            key={g.id}
            className={`flex items-center justify-between rounded-xl border-3 border-ink px-4 py-2 text-white shadow-nb-sm animate-pop-in ${
              isBlue ? "bg-[#1d4ed8]" : "bg-[#b91c1c]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[20px]">{isBlue ? "🔵" : "🔴"}</span>
              <span className="font-bold">@{g.username}</span>
              <span className="text-white/80">mengirim {g.giftName}</span>
            </div>
            <div className="font-mono text-[18px] font-black text-yellow">
              +{g.power} POWER
            </div>
          </div>
        );
      })}
    </div>
  );
}
