"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

/** Confirmation dialog / popup modal (Design System §27). */
export function Modal({
  open,
  isOpen,
  title,
  children,
  confirmLabel,
  cancelLabel = "Batal",
  tone = "primary",
  busy = false,
  onConfirm,
  onCancel,
  onClose,
}: ModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleClose = onClose ?? onCancel ?? (() => {});

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, busy, handleClose]);

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
      onClick={() => !busy && handleClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nb-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md animate-pop-in rounded-nb border-5 border-ink bg-white p-6 text-ink shadow-nb-xl"
      >
        <h2 id="nb-modal-title" className="mb-3 font-display text-2xl uppercase leading-tight">
          {title}
        </h2>
        <div className="mb-6 text-sm font-medium">{children}</div>
        {confirmLabel && onConfirm && (
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              onClick={onConfirm}
              disabled={busy}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
