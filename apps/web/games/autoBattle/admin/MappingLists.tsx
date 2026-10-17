"use client";

import { UNIT_META, type BattleGiftMapping } from "@tebak-kata/shared";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GiftIcon, TEAM_LABEL, TEAM_TONE, UnitIcon } from "./giftIcons";

interface MappingListsProps {
  mappings: BattleGiftMapping[];
  loading: boolean;
  toggle: (m: BattleGiftMapping) => Promise<void>;
  edit: (m: BattleGiftMapping) => void;
  remove: (m: BattleGiftMapping) => Promise<void>;
}

/** Current mappings, one list per team. */
export function MappingLists({ mappings, loading, toggle, edit, remove }: MappingListsProps) {
  return (
      <div className="grid gap-6 lg:grid-cols-2">
        {(["A", "B"] as const).map((team) => (
          <Card key={team} padded={false} className="overflow-hidden">
            <div className="border-b-3 border-ink px-4 py-2.5 text-sm font-black uppercase text-white" style={{ background: TEAM_TONE[team] }}>
              {TEAM_LABEL[team]}
            </div>
            {loading ? (
              <p className="p-4 text-sm text-muted">Memuat...</p>
            ) : (
              <ul>
                {mappings
                  .filter((m) => m.team === team)
                  .map((m, i) => (
                    <li key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i ? "border-t-2 border-ink" : ""} ${m.enabled ? "" : "opacity-50"}`}>
                      <GiftIcon url={m.imageUrl} size={32} />
                      <span className="font-black text-muted">➜</span>
                      <UnitIcon team={team} unit={m.unitType} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">
                          {m.giftName} <span className="font-medium text-muted">→ {UNIT_META[m.unitType].label} ×{m.quantity}</span>
                        </div>
                        <div className="font-mono text-[11px] text-muted">
                          {m.giftId ? `id ${m.giftId}` : "cocok via nama"}
                          {m.diamondCount ? ` · ${m.diamondCount} koin` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={m.enabled}
                        onClick={() => void toggle(m)}
                        className={`h-8 rounded-full border-2 border-ink px-2.5 text-[10px] font-bold uppercase ${m.enabled ? "bg-green" : "bg-white"}`}
                      >
                        {m.enabled ? "Aktif" : "Off"}
                      </button>
                      <Button size="sm" variant="secondary" onClick={() => edit(m)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void remove(m)}>
                        ✕
                      </Button>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
  );
}
