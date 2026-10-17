"use client";

import type { ReactNode } from "react";
import type { OverlayBackground, OverlayOptions } from "../overlayOptions";

const BACKGROUNDS: OverlayBackground[] = ["paper", "yellow", "dark", "transparent"];

export function DisplayOptions({
  options,
  setOption,
}: {
  options: OverlayOptions;
  setOption: <K extends keyof OverlayOptions>(key: K, value: OverlayOptions[K]) => void;
}) {
  return (
        <div className="space-y-3">
          <div className="nb-label">Tampilan</div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold">Latar (bg)</span>
            <select className="nb-input" value={options.background} onChange={(e) => setOption("background", e.target.value as OverlayBackground)}>
              {BACKGROUNDS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </label>
          <Toggle label="Reduced motion" checked={options.reducedMotion} onChange={(value) => setOption("reducedMotion", value)} />
          <Toggle label="Ticker tebakan" checked={options.ticker} onChange={(value) => setOption("ticker", value)} />
          <Toggle label="Cara main saat idle" checked={options.howTo} onChange={(value) => setOption("howTo", value)} />
          <Toggle label="Suara" checked={options.sound} onChange={(value) => setOption("sound", value)} />
        </div>
  );
}

export function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="nb-label mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
      <input type="checkbox" className="h-4 w-4 accent-ink" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
