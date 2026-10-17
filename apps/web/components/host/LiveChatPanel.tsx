"use client";

import { useState } from "react";
import { normalizeGuess, type ChatMessageView } from "@tebak-kata/shared";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";

/**
 * Design System §29 — Live Chat Panel. Also a manual comment injector
 * (POST /api/mock/comment) so the host can demo exact scenarios.
 */
export function LiveChatPanel({ token, chatLog, canSend, paused = false }: { token: string; chatLog: ChatMessageView[]; canSend: boolean; paused?: boolean }) {
  const [username, setUsername] = useState("host_demo");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!comment.trim() || !username.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.mockComment(token, { platformUserId: `manual-${username.trim()}`, username: username.trim(), rawComment: comment });
      setComment("");
    } catch (err) {
      setError(errorMessage(err, "Gagal mengirim."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card padded={false} className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b-3 border-ink bg-ink px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-yellow">💬 Live chat</span>
        <span className="font-mono text-xs text-white/80">{chatLog.length}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-paper p-3">
        {chatLog.length === 0 && <p className="py-6 text-center text-sm font-medium text-muted">Belum ada komentar.</p>}
        {chatLog.map((message) => (
          <ChatRow key={message.id} message={message} />
        ))}
      </div>

      <form
        className="space-y-2 border-t-3 border-ink bg-white p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="nb-label">Simulasi komentar penonton</div>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" aria-label="Username simulasi" className="nb-input py-1.5 text-xs" />
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={canSend ? "Tulis tebakan/jawaban..." : paused ? "Sesi sedang dijeda" : "Mulai sesi LIVE dulu"}
            aria-label="Isi komentar"
            className="nb-input min-w-0 flex-1"
            disabled={!canSend}
          />
          <Button type="submit" variant="dark" disabled={sending || !canSend || !comment.trim()}>
            Kirim
          </Button>
        </div>
        {error && <ErrorNote message={error} />}
      </form>
    </Card>
  );
}

function Verdict({ message }: { message: ChatMessageView }) {
  const chip = "rounded-full border-2 border-ink px-2 text-[10px] font-bold uppercase leading-5";
  if (message.status === "JOINED") {
    return <span className={`${chip} ${message.team === "RED" ? "bg-[#fee2e2]" : "bg-[#dbeafe]"}`}>{message.team === "RED" ? "🔴 Merah" : "🔵 Biru"}</span>;
  }
  if (message.status === "CORRECT" || message.isWinner) {
    return (
      <span className={`${chip} bg-yellow`}>
        ✔ Benar{message.rank ? ` #${message.rank}` : ""}
        {message.points ? ` +${message.points}` : ""}
      </span>
    );
  }
  if (message.status === "ALREADY_FOUND") return <span className={`${chip} bg-white`}>Sudah</span>;
  if (message.status === "INVALID") return <span className={`${chip} bg-paper text-muted`}>✖</span>;
  // Tebak Kata: show the matched prefix.
  const guess = normalizeGuess(message.rawComment);
  const matched = Math.min(message.matchedLength, guess.length);
  return matched > 0 ? <span className={`${chip} bg-green font-mono`}>{guess.slice(0, matched)} ✔</span> : null;
}

function ChatRow({ message }: { message: ChatMessageView }) {
  const win = message.status === "CORRECT" || message.isWinner;
  return (
    <div className={`rounded-nb-sm border-2 border-ink px-3 py-2 ${win ? "bg-green shadow-nb-sm" : "bg-white"}`}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0 truncate font-bold">{message.username}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Verdict message={message} />
          <time className="font-mono text-[10px] text-muted">{formatTime(message.createdAt)}</time>
        </span>
      </div>
      <div className="mt-0.5 break-words text-sm font-medium">{message.rawComment}</div>
    </div>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
