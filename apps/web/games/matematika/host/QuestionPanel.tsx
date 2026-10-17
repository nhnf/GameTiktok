"use client";

import { useSecondsUntil } from "@/lib/useLiveCountdown";
import type { MathQuestionHostState } from "@tebak-kata/shared";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface MathQuestionPanelProps {
  question: MathQuestionHostState | null;
}

const STATUS_LABEL: Record<string, string> = {
  READY: "Siap",
  ACTIVE: "Berjalan",
  TIME_UP: "Waktu habis",
  COMPLETED: "Selesai",
  SKIPPED: "Dilewati",
  DRAFT: "Draft",
};

export function MathQuestionPanel({ question }: MathQuestionPanelProps) {
  const timeLeft = useSecondsUntil(question?.status === "ACTIVE" ? question.endsAt : null, 200);

  if (!question) {
    return (
      <Card tone="paper">
        <CardTitle>Matematika LIVE — soal aktif</CardTitle>
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
          <span className="text-3xl">🔢</span>
          <p className="text-sm font-bold uppercase text-muted">Belum ada soal Matematika aktif.</p>
          <p className="text-xs text-muted">Soal dibuat otomatis saat sesi dimulai.</p>
        </div>
      </Card>
    );
  }

  const isTimeUp = question.status === "TIME_UP" || question.status === "COMPLETED";

  return (
    <Card tone="paper">
      <CardTitle>Matematika LIVE — monitor soal</CardTitle>
      <div className="flex flex-col gap-4">
        {/* Top Info Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
          <div className="flex items-center gap-2">
            <Badge tone="yellow">🔢 ARITMETIKA</Badge>
            <Badge tone="blue">{question.durationSeconds} DETIK</Badge>
          </div>
          <span
            className={`rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold uppercase ${
              question.status === "ACTIVE"
                ? "bg-green text-ink"
                : isTimeUp
                  ? "bg-red/20 text-red"
                  : "bg-paper text-muted"
            }`}
          >
            {STATUS_LABEL[question.status] ?? question.status}
          </span>
        </div>

        {/* Expression & Real Answer (Host View) */}
        <div className="flex flex-col items-center justify-center rounded-nb-sm border-2 border-ink bg-white p-4 text-center shadow-nb-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Soal Saat Ini:</span>
          <div className="font-display text-4xl font-black tracking-wide text-ink my-1">
            {question.expression} = ?
          </div>
          <div className="mt-1 rounded-nb-sm border-2 border-ink bg-yellow px-3 py-1 text-xs font-bold text-ink">
            Kunci Jawaban Host: <span className="font-mono text-base font-black">{question.answer}</span>
          </div>
        </div>

        {/* Timer Countdown Bar */}
        {question.status === "ACTIVE" && question.endsAt && (
          <div className="flex items-center justify-between rounded-nb-sm border-2 border-ink bg-paper-deep p-3 shadow-nb-sm">
            <span className="text-xs font-bold uppercase tracking-wide">Sisa Waktu Menjawab:</span>
            <span className={`font-mono text-xl font-black ${timeLeft <= 3 ? "text-red animate-pulse" : "text-ink"}`}>
              ⏱ {timeLeft}s
            </span>
          </div>
        )}

        {/* Correct Answers Live Ranking List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Jawaban Benar Masuk:
            </span>
            <span className="font-mono text-xs font-bold text-ink">
              {question.totalCorrect} PEMAIN
            </span>
          </div>

          <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto pr-1">
            {question.correctAnswers.length === 0 ? (
              <div className="rounded-nb-sm border border-dashed border-ink/40 p-3 text-center text-xs font-semibold text-muted">
                {question.status === "ACTIVE" ? "Menunggu penonton menjawab di komentar..." : "Belum ada jawaban benar."}
              </div>
            ) : (
              question.correctAnswers.map((ca, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-nb-sm border-2 border-ink bg-green/30 p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-ink font-mono text-[10px] font-bold text-yellow">
                      #{ca.rank}
                    </span>
                    <span className="font-bold text-ink">@{ca.player.username}</span>
                  </div>
                  <span className="rounded-sm border border-ink bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink">
                    +{ca.points} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
