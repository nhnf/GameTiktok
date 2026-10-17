import Link from "next/link";
import { NAV_SECTIONS } from "@/games/nav";

/** Design System §24 — 240px sidebar; collapses to icons below 1400px wide. One section per game module. */
export function Sidebar({ active }: { active: string }) {
  return (
    <aside className="flex h-full w-[76px] shrink-0 flex-col gap-4 overflow-y-auto border-r-3 border-ink bg-paper p-3 min-[1400px]:w-[240px]">
      {NAV_SECTIONS.map((section) => (
        <nav key={section.title} aria-label={section.title} className="flex flex-col gap-1.5">
          <span className="hidden px-2 text-[10px] font-black uppercase tracking-wider text-muted min-[1400px]:inline">{section.title}</span>
          {section.items.map((item) => {
            const isActive = active === item.href || (item.href !== "/host" && active.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={`${section.title} — ${item.label}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-10 items-center gap-3 rounded-nb-sm border-2 px-3 text-xs font-bold transition-all duration-100 ${
                  isActive
                    ? "border-ink bg-ink text-white shadow-nb-sm"
                    : "border-transparent text-ink hover:translate-x-0.5 hover:border-ink hover:bg-white"
                }`}
              >
                <span aria-hidden className="text-base leading-none">
                  {item.icon}
                </span>
                <span className="hidden truncate min-[1400px]:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ))}
    </aside>
  );
}
