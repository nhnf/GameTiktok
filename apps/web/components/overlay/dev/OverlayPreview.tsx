"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SCORING,
  type Category,
  type ChatMessageView,
  type Difficulty,
  type GameStatePublic,
  type LeaderboardEntry,
  type ServerEvent,
  type SessionStatus,
} from "@tebak-kata/shared";
import type { ConnectionStatus } from "@/lib/useGameSocket";
import { Button } from "@/components/ui/Button";
import { OverlayView } from "../OverlayView";
import { ScaledStage } from "../ScaledStage";
import { OVERLAY_HEIGHT, OVERLAY_WIDTH, type OverlayOptions } from "../overlayOptions";
import { ControlGroup, DisplayOptions } from "./previewParts";
import { buildPreviewState } from "./previewState";

interface SampleWord {
  word: string;
  category: Category;
  difficulty: Difficulty;
}

// Lengths 5 / 8 / 12 / 16 exercise one-row, tight-row and two-row tile layouts.
const SAMPLE_WORDS: SampleWord[] = [
  { word: "KELAS", category: { id: "pendidikan", name: "Pendidikan", emoji: "🎓" }, difficulty: "easy" },
  { word: "KOMPUTER", category: { id: "teknologi", name: "Teknologi", emoji: "💻" }, difficulty: "medium" },
  { word: "PERPUSTAKAAN", category: { id: "tempat", name: "Tempat", emoji: "📍" }, difficulty: "hard" },
  { word: "TRANSPORTASIUMUM", category: { id: "kendaraan", name: "Kendaraan", emoji: "🚗" }, difficulty: "hard" },
];

const SAMPLE_PLAYERS = ["andi", "budi_santoso", "siti.nur", "rian99", "dewi_kece_banget_sekali_loh"];

type TimedEvent = ServerEvent & { seq: number };

/** PLAN §11.3 — fake-data harness for the Tebak Kata overlay states and events (other games: use a real session). */
export function OverlayPreview() {
  const [wordIndex, setWordIndex] = useState(0);
  const [revealed, setRevealed] = useState(1);
  const [solved, setSolved] = useState(false);
  const [isBoss, setIsBoss] = useState(false);
  const [status, setStatus] = useState<SessionStatus>("ACTIVE");
  const [connection, setConnection] = useState<ConnectionStatus>("open");
  const [scores, setScores] = useState<Record<string, number>>({ andi: 45, budi_santoso: 30, "siti.nur": 20 });
  const [wordsFound, setWordsFound] = useState(27);
  const [chatLog, setChatLog] = useState<ChatMessageView[]>([]);
  const [lastEvent, setLastEvent] = useState<TimedEvent | null>(null);
  const [options, setOptions] = useState<OverlayOptions>({
    background: "paper",
    sound: false,
    reducedMotion: false,
    ticker: true,
    howTo: true,
    hero3d: true,
  });

  const seq = useRef(0);
  const idSeq = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  const sample = SAMPLE_WORDS[wordIndex];
  const target = sample.word;
  const difficulty: Difficulty = isBoss ? "boss" : sample.difficulty;
  const reward = DEFAULT_SCORING[difficulty];

  const leaderboard = useMemo<LeaderboardEntry[]>(
    () =>
      Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([username, points]) => ({ userId: username, username, points, wins: Math.floor(points / 10) })),
    [scores],
  );

  const state = useMemo<GameStatePublic>(
    () => buildPreviewState({ status, wordIndex, isBoss, category: sample.category, difficulty, target, solved, revealed, reward, leaderboard, wordsFound }),
    [status, wordIndex, isBoss, sample.category, difficulty, target, solved, revealed, reward, leaderboard, wordsFound],
  );

  const later = (fn: () => void, delayMs: number) => {
    timers.current.push(setTimeout(fn, delayMs));
  };
  const emit = (event: ServerEvent) => setLastEvent({ ...event, seq: ++seq.current } as TimedEvent);
  const randomPlayer = () => SAMPLE_PLAYERS[Math.floor(Math.random() * SAMPLE_PLAYERS.length)];

  const pushChat = (username: string, rawComment: string, matchedLength: number, isWinner = false) => {
    const message: ChatMessageView = {
      id: `chat-${++idSeq.current}`,
      username,
      rawComment,
      matchedLength,
      isFullMatch: isWinner,
      isWinner,
      createdAt: new Date().toISOString(),
    };
    setChatLog((prev) => [message, ...prev].slice(0, 40));
    emit({ type: "CHAT_MESSAGE", payload: message });
  };

  const reveal = (position: number, source: "GUESS" | "HINT" | "GIFT") => {
    setRevealed(position + 1);
    emit({ type: "LETTER_REVEALED", payload: { position, letter: target[position], source } });
  };

  const canPlay = status === "ACTIVE" && !solved;

  const guessPartial = () => {
    if (!canPlay) return;
    if (revealed >= target.length) {
      emit({ type: "ALL_LETTERS_REVEALED", payload: {} });
      return;
    }
    const length = revealed + 1;
    pushChat(randomPlayer(), `${target.slice(0, length)}X`.toLowerCase(), length);
    reveal(revealed, "GUESS");
  };

  const hint = () => {
    if (!canPlay) return;
    if (revealed >= target.length) emit({ type: "ALL_LETTERS_REVEALED", payload: {} });
    else reveal(revealed, "HINT");
  };

  const gift = () => {
    if (!canPlay) return;
    emit({
      type: "GIFT_RECEIVED",
      payload: { id: `gift-${++idSeq.current}`, username: randomPlayer(), giftName: "Rose", effect: "REVEAL_NEXT_LETTER", createdAt: new Date().toISOString() },
    });
    const position = revealed;
    if (position < target.length) later(() => reveal(position, "GIFT"), 500);
  };

  const win = () => {
    if (!canPlay) return;
    const player = randomPlayer();
    setScores((prev) => ({ ...prev, [player]: (prev[player] ?? 0) + reward }));
    setSolved(true);
    setRevealed(target.length);
    setWordsFound((count) => count + 1);
    pushChat(player, target.toLowerCase(), target.length, true);
    const payload = { winner: { userId: player, username: player }, points: reward, word: target };
    emit(isBoss ? { type: "BOSS_DEFEATED", payload } : { type: "PLAYER_WON", payload });
  };

  const nextWord = (boss: boolean, fromIndex = wordIndex) => {
    const next = (fromIndex + 1) % SAMPLE_WORDS.length;
    const nextSample = SAMPLE_WORDS[next];
    setWordIndex(next);
    setRevealed(0);
    setSolved(false);
    setIsBoss(boss);
    setStatus("ACTIVE");
    if (boss) {
      emit({
        type: "BOSS_STARTED",
        payload: {
          puzzleId: `${next}-boss`,
          category: nextSample.category,
          difficulty: "boss",
          isBoss: true,
          wordLength: nextSample.word.length,
          display: nextSample.word.split("").map(() => null),
          revealedLength: 0,
          status: "ACTIVE",
          winner: null,
          rewardPoints: DEFAULT_SCORING.boss,
        },
      });
    }
  };

  const skip = () => {
    if (status !== "ACTIVE") return;
    emit({ type: "PUZZLE_SKIPPED", payload: { word: target } });
    const fromIndex = wordIndex;
    later(() => nextWord(false, fromIndex), 1600);
  };

  const chatBurst = () => {
    for (let i = 0; i < 12; i++) {
      later(() => {
        const length = Math.floor(Math.random() * (revealed + 1));
        pushChat(randomPlayer(), `${target.slice(0, length)}ab`.toLowerCase(), length);
      }, i * 140);
    }
  };

  const endSession = () => {
    setStatus("ENDED");
    emit({
      type: "SESSION_ENDED",
      payload: {
        summary: {
          sessionId: "preview",
          totalPlayers: 128,
          totalComments: 8421,
          totalValidGuesses: 5120,
          wordsSolved: wordsFound,
          wordsSkipped: 3,
          bossesDefeated: 1,
          topPlayer: leaderboard[0] ?? null,
        },
      },
    });
  };

  const setOption = <K extends keyof OverlayOptions>(key: K, value: OverlayOptions[K]) => setOptions((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex h-screen bg-paper">
      <aside className="flex w-[320px] shrink-0 flex-col gap-5 overflow-y-auto border-r-3 border-ink bg-white p-4">
        <div>
          <div className="inline-block -rotate-1 rounded-nb border-3 border-ink bg-yellow px-3 py-1 font-display text-lg uppercase shadow-nb-sm">Overlay preview</div>
          <p className="mt-3 text-xs font-medium text-muted">Mode development saja. Data palsu — tidak terhubung ke server atau TikTok.</p>
        </div>

        <ControlGroup title="Gameplay">
          <Button size="sm" onClick={guessPartial} disabled={!canPlay}>
            Tebak parsial
          </Button>
          <Button size="sm" variant="success" onClick={win} disabled={!canPlay}>
            Menang
          </Button>
          <Button size="sm" variant="secondary" onClick={hint} disabled={!canPlay}>
            💡 Hint
          </Button>
          <Button size="sm" variant="secondary" onClick={gift} disabled={!canPlay}>
            🎁 Gift
          </Button>
          <Button size="sm" variant="info" onClick={() => nextWord(false)}>
            Kata baru
          </Button>
          <Button size="sm" variant="secondary" onClick={skip} disabled={status !== "ACTIVE"}>
            Skip
          </Button>
          <Button size="sm" variant="secondary" onClick={chatBurst} disabled={status !== "ACTIVE"}>
            Chat ramai
          </Button>
          <Button size="sm" variant="secondary" onClick={() => emit({ type: "ALL_LETTERS_REVEALED", payload: {} })}>
            Semua huruf
          </Button>
        </ControlGroup>

        <ControlGroup title="Boss">
          <Button size="sm" variant="dark" onClick={() => nextWord(true)}>
            Boss mulai
          </Button>
          <Button size="sm" variant="success" onClick={win} disabled={!canPlay || !isBoss}>
            Boss kalah
          </Button>
        </ControlGroup>

        <ControlGroup title="Status">
          <Button size="sm" variant="secondary" onClick={() => setStatus(status === "PAUSED" ? "ACTIVE" : "PAUSED")} disabled={status !== "ACTIVE" && status !== "PAUSED"}>
            {status === "PAUSED" ? "Lanjut" : "Jeda"}
          </Button>
          <Button size="sm" variant="danger" onClick={endSession} disabled={status === "ENDED"}>
            Akhiri
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setStatus("CREATED")}>
            Idle
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setConnection(connection === "open" ? "closed" : "open")}>
            {connection === "open" ? "Putus koneksi" : "Sambung"}
          </Button>
        </ControlGroup>

        <DisplayOptions options={options} setOption={setOption} />

        <div className="rounded-nb-sm border-2 border-ink bg-paper px-3 py-2 text-xs font-medium">
          Kata: <b className="font-mono">{target}</b> ({target.length} huruf) · status <b>{status}</b>
        </div>
      </aside>

      <div
        className={`min-w-0 flex-1 p-4 ${options.background === "transparent" ? "bg-[repeating-conic-gradient(#d4d4d4_0_25%,#ffffff_0_50%)] bg-[length:32px_32px]" : ""}`}
      >
        <ScaledStage width={OVERLAY_WIDTH} height={OVERLAY_HEIGHT}>
          <OverlayView connection={connection} state={state} lastEvent={lastEvent} chatLog={chatLog} options={options} />
        </ScaledStage>
      </div>
    </div>
  );
}
