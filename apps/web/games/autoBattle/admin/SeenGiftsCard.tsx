"use client";

import { UNIT_META, findGiftMapping, type BattleGiftMapping } from "@tebak-kata/shared";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { battleApi, type SeenGiftDTO } from "../api";
import { TEAM_TONE } from "./giftIcons";

interface SeenGiftsCardProps {
  token: string;
  seen: SeenGiftDTO[];
  mappings: BattleGiftMapping[];
  refresh: () => Promise<void>;
  mapSeen: (g: SeenGiftDTO) => void;
}

/** Gifts that actually reached the server from TikTok, with one-click mapping. */
export function SeenGiftsCard({ token, seen, mappings, refresh, mapSeen }: SeenGiftsCardProps) {
  const toast = useToast();
  return (
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="mb-0">📡 Gift terdeteksi dari LIVE</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => void refresh()}>
              ↻ Muat ulang
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void battleApi
                  .clearSeenGifts(token)
                  .then(refresh)
                  .catch((err: unknown) => toast(errorMessage(err, "Gagal menghapus."), "error"))
              }
            >
              Kosongkan
            </Button>
          </div>
        </div>
        <p className="mb-3 text-sm font-medium text-muted">
          Setiap gift yang benar-benar diterima dari TikTok LIVE tercatat di sini beserta ID, nama, dan harga koinnya. Minta teman mengirim gift saat LIVE, lalu klik <b>Petakan</b> agar ID-nya pasti cocok.
        </p>
        {seen.length === 0 ? (
          <p className="rounded-nb-sm border-2 border-dashed border-ink p-4 text-sm font-medium text-muted">
            Belum ada gift dari TikTok. Daftar ini terisi saat LIVE_SOURCE=tiktok dan ada penonton mengirim gift.
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {seen.map((g) => {
              const mapped = findGiftMapping(mappings, g.giftId, g.giftName);
              const idMatches = mapped?.giftId === g.giftId;
              return (
                <div key={g.id} className="flex items-center gap-3 rounded-nb-sm border-2 border-ink bg-white px-3 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {g.imageUrl ? <img src={g.imageUrl} alt="" className="h-9 w-9 shrink-0" /> : <span className="text-2xl">🎁</span>}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">
                      {g.giftName} <span className="font-mono text-xs text-muted">id {g.giftId}</span>
                    </div>
                    <div className="truncate text-[11px] text-muted">
                      {g.diamondCount} koin · {g.timesSeen}× · terakhir @{g.lastSender ?? "-"}
                    </div>
                    {mapped && (
                      <div className="truncate text-[11px] font-bold" style={{ color: TEAM_TONE[mapped.team] }}>
                        → Team {mapped.team} · {UNIT_META[mapped.unitType].label} ×{mapped.quantity}
                        {!idMatches && " (cocok via nama)"}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant={mapped && idMatches ? "secondary" : "primary"} onClick={() => mapSeen(g)}>
                    {mapped ? (idMatches ? "Ubah" : "Kunci ID") : "Petakan"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
  );
}
