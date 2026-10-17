"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";

interface QuickGiftTestCardProps {
  token: string;
  disabled?: boolean;
}

export function QuickGiftTestCard({ token, disabled = false }: QuickGiftTestCardProps) {
  const [username, setUsername] = useState("andi");
  const [customCoins, setCustomCoins] = useState(10);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sendGift = async (label: string, diamondCount: number, giftName: string, count = 1) => {
    setBusy(label);
    setError(null);
    setSuccess(null);
    try {
      const user = username.trim() || "tester";
      await api.mockGift(token, {
        username: user,
        giftId: `test-${diamondCount}`,
        giftName,
        count,
        diamondCount,
      });
      setSuccess(`Berhasil kirim gift ${giftName} (${diamondCount * count} koin) dari @${user}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(errorMessage(err, "Gagal mengirim tes gift."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <CardTitle className="mb-0 text-base">🧪 Quick Test Gift</CardTitle>
        <span className="text-[11px] font-bold text-muted">Simulasi 1-Klik</span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <label className="text-xs font-bold text-muted shrink-0">Username:</label>
        <input
          type="text"
          className="nb-input h-8 py-1 text-xs font-mono"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="nama tester"
          disabled={disabled || busy !== null}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled || busy !== null}
          onClick={() => void sendGift("1", 1, "Mawar", 1)}
        >
          {busy === "1" ? "Mengirim..." : "🎁 1 Koin (+100 Poin)"}
        </Button>

        <Button
          size="sm"
          variant="secondary"
          disabled={disabled || busy !== null}
          onClick={() => void sendGift("5", 1, "Mawar x5", 5)}
        >
          {busy === "5" ? "Mengirim..." : "🎁 5 Koin (+500 Poin)"}
        </Button>

        <Button
          size="sm"
          variant="secondary"
          disabled={disabled || busy !== null}
          onClick={() => void sendGift("30", 30, "Pedang Api", 1)}
        >
          {busy === "30" ? "Mengirim..." : "⚔️ 30 Koin (-100 Lawan)"}
        </Button>

        <Button
          size="sm"
          variant="danger"
          disabled={disabled || busy !== null}
          onClick={() => void sendGift("100", 100, "Paus Biru", 1)}
        >
          {busy === "100" ? "Mengirim..." : "💥 100 Koin (Reset Skor)"}
        </Button>
      </div>

      {/* Custom coins sender */}
      <div className="flex items-center gap-2 border-t-2 border-ink/20 pt-2.5">
        <span className="text-xs font-bold text-muted shrink-0">Kustom:</span>
        <input
          type="number"
          min={1}
          max={10000}
          className="nb-input h-8 w-20 py-1 font-mono text-xs text-center"
          value={customCoins}
          onChange={(e) => setCustomCoins(Math.max(1, Number(e.target.value) || 1))}
          disabled={disabled || busy !== null}
        />
        <span className="text-xs font-bold text-muted">koin</span>
        <Button
          size="sm"
          className="ml-auto"
          disabled={disabled || busy !== null}
          onClick={() => void sendGift("custom", customCoins, `Gift ${customCoins} Koin`, 1)}
        >
          {busy === "custom" ? "..." : "Kirim"}
        </Button>
      </div>

      {error && <ErrorNote message={error} className="mt-2" />}
      {success && (
        <div className="mt-2 rounded-nb-sm border-2 border-ink bg-green px-2.5 py-1.5 text-xs font-bold text-ink animate-pop-in">
          ✓ {success}
        </div>
      )}
    </Card>
  );
}
