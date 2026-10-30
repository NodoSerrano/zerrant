"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { FormFeedback } from "@/components/FormFeedback";

interface ConfirmDialogProps {
  title: string;
  /** What happens if the user confirms. */
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string | null;
  onCancel: () => void;
  /** Values the action reads from the form (ids). */
  hiddenFields?: Record<string, string>;
}

/**
 * ZER-221: the one confirmation pop up for destructive actions. Centered on
 * every screen size, with a single confirm button; cancelling is the X,
 * tapping outside or Escape (same rules as archiving in ZER-201). Rendered in a
 * portal so a parent menu or card cannot clip it.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  pendingLabel,
  action,
  pending,
  error,
  onCancel,
  hiddenFields,
}: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const cancel = () => {
    if (!pending) onCancel();
  };

  // Focus starts on the X, the safe choice, and goes back to whatever opened
  // the dialog when it closes, so a keyboard user is not left on <body>.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previous?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [pending, onCancel]);

  return createPortal(
    <div
      data-testid="confirm-dialog-backdrop"
      onClick={cancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5"
    >
      <form
        action={action}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="relative flex w-full max-w-lg flex-col gap-3 rounded-2xl border border-border bg-surface p-4 pr-12"
      >
        {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          ref={cancelRef}
          type="button"
          aria-label="Cancelar"
          disabled={pending}
          onClick={cancel}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-text-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <h2 id={titleId} className="font-display text-[15px] font-semibold text-text-primary">
          {title}
        </h2>
        <div className="font-body text-sm text-text-primary">{children}</div>
        <FormFeedback error={error} />
        <button
          type="submit"
          disabled={pending}
          className="w-full whitespace-nowrap rounded-pill bg-coral/10 px-3 py-2 font-display text-[13px] font-semibold text-on-coral-tint focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
        >
          {pending ? pendingLabel : confirmLabel}
        </button>
      </form>
    </div>,
    document.body,
  );
}
