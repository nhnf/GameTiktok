"use client";

import { HostTokenGate } from "@/components/shell/HostTokenGate";
import { HostDashboard } from "@/components/host/HostDashboard";

export default function HostPage() {
  return <HostTokenGate>{(token, signOut) => <HostDashboard token={token} signOut={signOut} />}</HostTokenGate>;
}
