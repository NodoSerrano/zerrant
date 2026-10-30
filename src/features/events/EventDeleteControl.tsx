"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "./actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface EventDeleteControlProps {
  eventId: string;
}

export function EventDeleteControl({ eventId }: EventDeleteControlProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useGuardedActionState(deleteEvent, null);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center justify-center gap-2 font-display text-[15px] font-medium text-coral focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Eliminar evento
      </button>
      {confirming ? (
        <ConfirmDialog
          title="Eliminar evento"
          confirmLabel="Sí, eliminar"
          pendingLabel="Eliminando..."
          action={action}
          pending={pending}
          error={state?.error}
          onCancel={() => setConfirming(false)}
          hiddenFields={{ eventId }}
        >
          ¿Eliminar este evento? Se borra de la agenda y se pierden las confirmaciones de
          asistencia.
        </ConfirmDialog>
      ) : null}
    </>
  );
}
