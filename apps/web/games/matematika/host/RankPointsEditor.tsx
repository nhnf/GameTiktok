"use client";

import { useState } from "react";

interface RankPointsEditorProps {
  rankPoints: number[];
  rank10Plus: number;
  onChange: (rankPoints: number[], rank10Plus: number) => void;
}

/** Collapsible editor for the points of answer ranks 1–9 and 10+. */
export function RankPointsEditor({ rankPoints, rank10Plus, onChange }: RankPointsEditorProps) {
  const [open, setOpen] = useState(false);
  const points = Array.from({ length: 9 }, (_, i) => rankPoints[i] ?? Math.max(10, 100 - i * 10));
  const clamp = (value: string) => Math.max(0, Math.min(1000, Math.round(Number(value) || 0)));

  return (
    <div className="border-t-2 border-ink/20 pt-2">
      <button
        type="button"
        className="flex w-full items-center justify-between font-display text-xs uppercase text-ink hover:text-blue"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>⚙️ Poin per urutan penjawab</span>
        <span>{open ? "▲ Tutup" : "▼ Buka"}</span>
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-3 gap-2 rounded-nb-sm border-2 border-ink/30 bg-paper p-2.5 text-xs">
          {points.map((pts, idx) => (
            <label key={idx} className="flex items-center justify-between gap-1 font-bold">
              #{idx + 1}
              <input
                type="number"
                min={0}
                max={1000}
                className="h-7 w-14 rounded-nb-sm border-2 border-ink bg-white px-1 text-center font-mono"
                value={pts}
                onChange={(e) => onChange(points.map((p, i) => (i === idx ? clamp(e.target.value) : p)), rank10Plus)}
              />
            </label>
          ))}
          <label className="col-span-3 flex items-center justify-between gap-1 border-t border-ink/20 pt-1.5 font-bold">
            Urutan #10 dan seterusnya
            <input
              type="number"
              min={0}
              max={1000}
              className="h-7 w-14 rounded-nb-sm border-2 border-ink bg-white px-1 text-center font-mono"
              value={rank10Plus}
              onChange={(e) => onChange(points, clamp(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
