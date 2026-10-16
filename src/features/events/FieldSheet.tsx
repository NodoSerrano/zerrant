"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface FieldSheetProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function FieldSheet({ title, open, onClose, children }: FieldSheetProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end bg-black/55" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[80vh] w-full overflow-auto rounded-t-[22px] border-t border-border bg-surface-inset px-4 pt-3.5 pb-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-3 text-center font-display text-base font-medium text-text-primary">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
