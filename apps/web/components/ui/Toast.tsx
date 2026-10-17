"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";
type PushToast = (message: string, tone?: ToastTone) => void;

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<PushToast | null>(null);

const TONE_CLASS: Record<ToastTone, string> = {
  success: "bg-green",
  error: "bg-red",
  info: "bg-yellow",
};

const TONE_ICON: Record<ToastTone, string> = {
  success: "✔",
  error: "✖",
  info: "ℹ",
};

const DURATION_MS = 3200;
const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback<PushToast>((message, tone = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-80 flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`animate-slide-in-right rounded-nb border-3 border-ink px-4 py-3 text-sm font-bold text-ink shadow-nb-md ${TONE_CLASS[toast.tone]}`}
          >
            <span aria-hidden className="mr-2">
              {TONE_ICON[toast.tone]}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): PushToast {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast() must be used inside <ToastProvider>.");
  return push;
}
