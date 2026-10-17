"use client";

import { useState, type ReactNode } from "react";
import { useHostToken } from "@/lib/hostToken";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";

/**
 * PRD section 49 — Host API must be authenticated. V1 scaffold: enter the
 * server's HOST_TOKEN once; it's kept in localStorage and sent as a bearer
 * token on every host/admin request and the host WebSocket connection.
 */
export function HostTokenGate({ children }: { children: (token: string, signOut: () => void) => ReactNode }) {
  const { token, ready, setToken, clearToken } = useHostToken();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (!ready) return <div className="bg-dots min-h-screen" aria-busy="true" />;

  if (token) return <>{children(token, clearToken)}</>;

  const submit = async () => {
    setChecking(true);
    setError(null);
    try {
      await api.getHostState(input.trim());
      setToken(input.trim());
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Token salah." : "Tidak bisa terhubung ke server. Pastikan server game berjalan.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-dots flex min-h-screen items-center justify-center px-4 text-ink">
      <div className="relative w-full max-w-sm">
        <div className="absolute -top-5 left-6 z-10 -rotate-3 rounded-nb border-3 border-ink bg-yellow px-4 py-1.5 font-display text-lg uppercase leading-none shadow-nb-sm">
          Tebak Kata Live
        </div>
        <Card shadow="xl" className="pt-10">
          <h1 className="mb-2 font-display text-2xl uppercase leading-tight">Masuk host</h1>
          <p className="mb-4 text-sm font-medium">Masukkan Host Token untuk membuka dashboard.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label className="mb-4 block">
              <span className="nb-label mb-1.5 block">Host token</span>
              <input
                type="password"
                autoComplete="current-password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="HOST_TOKEN"
                className="nb-input"
              />
            </label>
            {error && <ErrorNote message={error} className="mb-3" />}
            <Button type="submit" size="lg" className="w-full" disabled={checking || input.length === 0}>
              {checking ? "Memeriksa..." : "Masuk ➜"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
