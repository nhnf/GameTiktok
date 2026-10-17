import type { ReactNode } from "react";

/** Keyboard shortcut hint inside a button. */
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border-2 border-ink bg-white px-1.5 font-mono text-[10px] leading-4 text-ink">{children}</kbd>;
}

/** True when a key press is meant for a text field, not a dashboard shortcut. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)));
}
