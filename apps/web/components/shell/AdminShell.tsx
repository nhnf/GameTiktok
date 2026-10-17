"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { HostTokenGate } from "./HostTokenGate";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import { TokenProvider } from "@/lib/hostTokenContext";

/** Design System §2/50 — Admin/Setup surface for words/categories/gifts/settings. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <HostTokenGate>
      {(token, signOut) => (
        <TokenProvider token={token}>
          <ToastProvider>
            <div className="flex h-screen flex-col bg-paper text-ink">
              <Topbar subtitle="Admin / Setup" onSignOut={signOut} />
              <div className="flex min-h-0 flex-1">
                <Sidebar active={pathname} />
                <main className="bg-dots min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
              </div>
            </div>
          </ToastProvider>
        </TokenProvider>
      )}
    </HostTokenGate>
  );
}
