"use client";

/**
 * Visual Tug of War Rope Component.
 * Dynamic rope marker positioned between -100 (Blue Win) and +100 (Red Win).
 */
export function TugOfWarRope({
  ropePosition,
  winLineDistance,
  delta,
  animating,
}: {
  ropePosition: number;
  winLineDistance: number;
  delta: number;
  animating: boolean;
}) {
  // ±winLineDistance sits exactly on the win lines drawn at 10% / 90% of the track.
  const ratio = Math.max(-1, Math.min(1, ropePosition / Math.max(1, winLineDistance)));
  const percentage = 50 + ratio * 40;

  return (
    <div className="flex w-full flex-col gap-2 rounded-3xl border-5 border-ink bg-white p-5 shadow-nb-lg">
      <div className="flex items-center justify-between px-2 font-display text-[16px] font-black uppercase tracking-wider">
        <span className="text-[#2563eb]">🔵 GARIS MENANG BIRU</span>
        <span className="text-ink/60">TENGAH</span>
        <span className="text-[#dc2626]">GARIS MENANG MERAH 🔴</span>
      </div>

      {/* Arena Track */}
      <div className="relative flex h-[72px] w-full items-center rounded-2xl border-4 border-ink bg-paper-deep px-3">
        {/* Blue Win Line (Left) */}
        <div className="absolute left-[10%] top-0 h-full w-[4px] bg-[#3b82f6]" />
        {/* Center Marker Line */}
        <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-ink/30 border-dashed" />
        {/* Red Win Line (Right) */}
        <div className="absolute right-[10%] top-0 h-full w-[4px] bg-[#ef4444]" />

        {/* The Thick Rope Bar */}
        <div className="relative h-[18px] w-full rounded-full border-3 border-ink bg-[#d97706] shadow-inner">
          {/* Blue segment accent */}
          <div
            className="absolute left-0 top-0 h-full bg-[#3b82f6] opacity-40"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Rope Knot / Flag Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
          style={{
            left: `calc(${percentage}% - 30px)`,
          }}
        >
          <div
            className={`flex h-[60px] w-[60px] items-center justify-center rounded-full border-4 border-ink shadow-nb-md ${
              ropePosition < 0 ? "bg-[#3b82f6] text-white" : ropePosition > 0 ? "bg-[#ef4444] text-white" : "bg-yellow text-ink"
            } ${animating ? "animate-bounce" : ""}`}
          >
            <span className="text-[28px]">💪</span>
          </div>
        </div>
      </div>

      {/* Movement Delta Indicator */}
      <div className="flex items-center justify-between px-2 text-[14px] font-bold text-ink/70">
        <span>Posisi: {ropePosition}</span>
        {delta !== 0 && (
          <span className={`font-black ${delta < 0 ? "text-[#2563eb]" : "text-[#dc2626]"}`}>
            {delta < 0 ? `⬅ TARIKAN BIRU (${Math.abs(delta)})` : `TARIKAN MERAH (${delta}) ➡`}
          </span>
        )}
        <span>Target: ±{winLineDistance}</span>
      </div>
    </div>
  );
}
