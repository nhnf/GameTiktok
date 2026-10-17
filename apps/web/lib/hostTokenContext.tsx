"use client";

import { createContext, useContext, type ReactNode } from "react";

const TokenContext = createContext<string | null>(null);

export function TokenProvider({ token, children }: { token: string; children: ReactNode }) {
  return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>;
}

/** Only usable inside an `<AdminShell>`/`<HostDashboard>` subtree. */
export function useAdminToken(): string {
  const token = useContext(TokenContext);
  if (!token) throw new Error("useAdminToken() called outside a TokenProvider — wrap the page in <AdminShell>.");
  return token;
}
