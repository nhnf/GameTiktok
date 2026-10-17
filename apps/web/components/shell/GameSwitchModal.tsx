"use client";

import { useState } from "react";
import { GAME_INFO, type GameType } from "@tebak-kata/shared";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { Modal } from "@/components/ui/Modal";

interface GameSwitchModalProps {
  token: string;
  currentGame: GameType;
  targetGame: GameType;
  isSessionLive: boolean;
  onClose: () => void;
}

/** Confirms switching the active game (PRD §31). */
export function GameSwitchModal({ token, currentGame, targetGame, isSessionLive, onClose }: GameSwitchModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = GAME_INFO[targetGame];

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.switchGame(token, targetGame);
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Gagal mengganti game."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open title="Ganti game" confirmLabel={busy ? "Mengganti..." : "Ganti game"} busy={busy} onCancel={onClose} onConfirm={() => void confirm()}>
      <p className="leading-relaxed">
        Ganti dari <b>{GAME_INFO[currentGame].label}</b> ke{" "}
        <b className="underline">
          {target.emoji} {target.label}
        </b>
        ?
      </p>
      <p className="mt-2 text-xs text-muted">{target.description}</p>
      {isSessionLive && (
        <div className="mt-3 rounded-nb-sm border-2 border-ink bg-yellow p-3 text-xs font-semibold leading-normal">
          ⚠️ Ronde/puzzle yang sedang berjalan akan dihentikan. <b>Leaderboard dan poin penonton tetap tersimpan</b> untuk sesi LIVE ini.
        </div>
      )}
      {error && <ErrorNote message={error} className="mt-3" />}
    </Modal>
  );
}
