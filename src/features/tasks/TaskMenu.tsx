"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { cancelTask } from "./actions";
import { cn } from "@/lib/utils";

// Cada acción vive en su propia ventana de estados. Cancelar sigue teniendo
// sentido con la tarea ya tomada; editar no, porque le cambiaría el trabajo a
// quien la aceptó sin avisarle. Si no queda ninguna acción, el disparador no se
// dibuja: nada de controles muertos.
const ESTADOS_CANCELABLES = ["abierta", "tomada"];
const ESTADOS_EDITABLES = ["abierta"];

const ITEM_CLASSES =
  "block w-full text-left px-4 py-2.5 font-body text-sm text-text-primary hover:bg-surface-inset focus-visible:outline-hidden focus-visible:bg-surface-inset";

interface TaskMenuProps {
  taskId: string;
  estado: string;
  isOwner: boolean;
  /** En la pantalla de editar, "Editar" sería un no-op sobre la pantalla en la
   *  que ya estás. Sólo queda cancelar. */
  showEditItem?: boolean;
}

export function TaskMenu({ taskId, estado, isOwner, showEditItem = true }: TaskMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(cancelTask, null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const menuId = useId();

  const puedeCancelar = ESTADOS_CANCELABLES.includes(estado);
  const puedeEditar = showEditItem && ESTADOS_EDITABLES.includes(estado);

  function close({ restoreFocus }: { restoreFocus: boolean }) {
    setOpen(false);
    setConfirming(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  // Escape cierra y devuelve el foco al disparador: si no, el foco queda
  // colgado en un nodo que dejó de existir y el usuario de teclado se pierde.
  // Un click afuera también cierra, pero sin robar el foco de donde el usuario
  // acaba de hacer click.
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

  // Al abrir, el foco entra al menú. Si se queda en el disparador, el siguiente
  // Tab lleva al contenido de atrás en vez de al primer ítem.
  useEffect(() => {
    if (open && !confirming) firstItemRef.current?.focus();
  }, [open, confirming]);

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
          // Durante la confirmación el contenedor deja de tener `menuitem`s, así
          // que dejar `role="menu"` metería a un lector de pantalla en un menú
          // vacío con una acción destructiva pendiente.
          role={confirming ? "dialog" : "menu"}
          aria-label={confirming ? "Confirmar cancelación" : undefined}
          aria-modal={confirming ? false : undefined}
          className={cn(
            "absolute right-0 top-full z-40 mt-2 w-max min-w-[180px] max-w-[280px] overflow-hidden py-1",
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
                  className="flex-1 whitespace-nowrap rounded-pill bg-coral/10 px-3 py-1.5 font-display text-[13px] font-semibold text-coral disabled:opacity-50"
                >
                  {pending ? "Cancelando..." : "Sí, cancelar"}
                </button>
                <button
                  type="button"
                  // Deshabilitado en vuelo: si no, desmonta el form a mitad del
                  // pedido y el usuario se queda sin resultado ni error.
                  disabled={pending}
                  onClick={() => setConfirming(false)}
                  className="flex-1 whitespace-nowrap rounded-pill border border-border px-3 py-1.5 font-display text-[13px] font-semibold text-text-secondary disabled:opacity-50"
                >
                  Volver
                </button>
              </div>
            </form>
          ) : (
            <>
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
