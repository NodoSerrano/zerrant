"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { cancelTask } from "./actions";
import { cn } from "@/lib/utils";

// Sólo desde estos estados hay algo que ofrecer. Una tarea hecha, verificada o
// cancelada no se edita ni se cancela, así que el disparador no se dibuja:
// nada de controles muertos.
const ESTADOS_CON_ACCIONES = ["abierta", "tomada"];

const ITEM_CLASSES =
  "block w-full text-left px-4 py-2.5 font-body text-sm text-text-primary hover:bg-surface-inset focus-visible:outline-hidden focus-visible:bg-surface-inset";

interface TaskMenuProps {
  taskId: string;
  estado: string;
  isOwner: boolean;
}

export function TaskMenu({ taskId, estado, isOwner }: TaskMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(cancelTask, null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Escape cierra y devuelve el foco al disparador: si no, el foco queda
  // colgado en un nodo que dejó de existir y el usuario de teclado se pierde.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      setConfirming(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!isOwner || !ESTADOS_CON_ACCIONES.includes(estado)) return null;

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
          setOpen((v) => !v);
          setConfirming(false);
        }}
        className="rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Ellipsis className="size-[22px] text-text-primary" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute right-0 top-full z-40 mt-2 min-w-[180px] overflow-hidden py-1",
            "bg-surface border border-border rounded-md",
            "shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)]",
          )}
        >
          {confirming ? (
            <form action={action} className="flex flex-col gap-2 p-3">
              <input type="hidden" name="taskId" value={taskId} />
              <p className="font-body text-sm text-text-primary">¿Cancelar esta tarea?</p>
              {state?.error && (
                <p role="alert" className="font-body text-xs text-coral">
                  {state.error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-pill bg-coral/10 px-3 py-1.5 font-display text-[13px] font-semibold text-coral disabled:opacity-50"
                >
                  {pending ? "Cancelando..." : "Sí, cancelar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-pill border border-border px-3 py-1.5 font-display text-[13px] font-semibold text-text-secondary"
                >
                  Volver
                </button>
              </div>
            </form>
          ) : (
            <>
              <Link href={`/nodo/tasks/${taskId}/edit`} role="menuitem" className={ITEM_CLASSES}>
                Editar
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => setConfirming(true)}
                className={ITEM_CLASSES}
              >
                Cancelar tarea
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
