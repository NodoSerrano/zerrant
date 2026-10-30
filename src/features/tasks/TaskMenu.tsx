"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { cancelTask } from "./actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// Each action lives in its own window of states. Cancelling still makes sense
// once the task is taken; editing doesn't, because it would change the work of
// whoever accepted it without warning. When no action remains, the trigger
// isn't drawn: no dead controls.
const ESTADOS_CANCELABLES = ["abierta", "tomada"];
const ESTADOS_EDITABLES = ["abierta"];

const ITEM_CLASSES =
  "block w-full text-left px-4 py-2.5 font-body text-sm text-text-primary hover:bg-surface-inset focus-visible:outline-hidden focus-visible:bg-surface-inset";

interface TaskMenuProps {
  taskId: string;
  estado: string;
  isOwner: boolean;
  /** On the edit screen, "Editar" would be a no-op on the screen you are
   *  already on. Only cancelling remains. */
  showEditItem?: boolean;
}

export function TaskMenu({ taskId, estado, isOwner, showEditItem = true }: TaskMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useGuardedActionState(cancelTask, null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const menuId = useId();

  const puedeCancelar = ESTADOS_CANCELABLES.includes(estado);
  const puedeEditar = showEditItem && ESTADOS_EDITABLES.includes(estado);

  function close({ restoreFocus }: { restoreFocus: boolean }) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  // The menu closes and the shared pop up asks (ZER-221). Focus goes to the
  // trigger first, so the pop up hands it back there when it closes.
  function askToCancel() {
    close({ restoreFocus: true });
    setConfirming(true);
  }

  // Escape closes and returns focus to the trigger: otherwise the focus stays
  // stranded on a node that no longer exists and the keyboard user gets lost.
  // An outside click also closes, but without stealing focus from where the
  // user just clicked.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      close({ restoreFocus: true });
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close({ restoreFocus: false });
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  // On open, focus moves into the menu. If it stayed on the trigger, the next
  // Tab would go to the content behind instead of the first item.
  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  if (!isOwner || !puedeCancelar) return null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Más opciones"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (open) close({ restoreFocus: false });
          else setOpen(true);
        }}
        className="rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Ellipsis className="size-[22px] text-text-primary" />
      </button>

      {open && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute right-0 top-full z-40 mt-2 w-max min-w-[180px] max-w-[280px] overflow-hidden py-1",
            "bg-surface border border-border rounded-md",
            "shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)]",
          )}
        >
          {puedeEditar && (
            <Link
              ref={firstItemRef as React.Ref<HTMLAnchorElement>}
              href={`/nodo/tasks/${taskId}/edit`}
              role="menuitem"
              className={ITEM_CLASSES}
            >
              Editar
            </Link>
          )}
          <button
            ref={puedeEditar ? undefined : (firstItemRef as React.Ref<HTMLButtonElement>)}
            type="button"
            role="menuitem"
            onClick={askToCancel}
            className={ITEM_CLASSES}
          >
            Cancelar tarea
          </button>
        </div>
      )}

      {confirming ? (
        <ConfirmDialog
          title="Cancelar tarea"
          confirmLabel="Sí, cancelar"
          pendingLabel="Cancelando..."
          action={action}
          pending={pending}
          error={state?.error}
          onCancel={() => setConfirming(false)}
          hiddenFields={{ taskId }}
        >
          ¿Cancelar esta tarea?
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
