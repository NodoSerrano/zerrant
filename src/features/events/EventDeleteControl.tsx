"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "./actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

interface EventDeleteControlProps {
  eventId: string;
}

export function EventDeleteControl({ eventId }: EventDeleteControlProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useGuardedActionState(deleteEvent, null);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center justify-center gap-2 font-display text-[15px] font-medium text-coral focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Eliminar evento
      </button>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
      role="dialog"
      aria-label="Confirmar eliminación"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <p className="font-body text-sm text-text-primary">
        ¿Eliminar este evento? Se borra de la agenda y se pierden las confirmaciones de asistencia.
      </p>
      {state?.error ? (
        <p role="alert" className="font-body text-xs text-coral">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 whitespace-nowrap rounded-pill bg-coral/10 px-3 py-2 font-display text-[13px] font-semibold text-coral disabled:opacity-50"
        >
          {pending ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="flex-1 whitespace-nowrap rounded-pill border border-border px-3 py-2 font-display text-[13px] font-semibold text-text-secondary disabled:opacity-50"
        >
          Volver
        </button>
      </div>
    </form>
  );
}
