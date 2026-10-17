"use client";

import { useEffect, useState } from "react";
import { battleApi, type CatalogGiftDTO } from "../api";
import { GiftIcon } from "./giftIcons";

/** Search TikTok's gift catalog and pick a gift (fills id, name, coins, icon). */
export function CatalogPicker({ token, onPick }: { token: string; onPick: (g: CatalogGiftDTO) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CatalogGiftDTO[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      battleApi
        .giftCatalog(token, q.trim(), 40)
        .then((r) => {
          setResults(r.gifts);
          setTotal(r.total);
        })
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q, open, token]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="🔎 Cari gift TikTok (mis. rose, galaxy)…"
        className="nb-input"
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-nb-sm border-3 border-ink bg-white shadow-nb-md">
          {total === 0 && <p className="p-3 text-xs font-medium text-muted">Katalog TikTok belum bisa dimuat (cek koneksi internet server).</p>}
          {results.map((g) => (
            <button
              key={g.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(g);
                setQ("");
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 border-b-2 border-ink/10 px-3 py-1.5 text-left hover:bg-yellow"
            >
              <GiftIcon url={g.imageUrl} size={32} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{g.name}</span>
              <span className="font-mono text-xs text-muted">{g.diamondCount} koin · id {g.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * PRD §34 — Gift Mapping Dashboard (Gift → Team → Unit → Quantity), plus a
 * list of gifts actually received from TikTok so the host maps real ids.
 */
