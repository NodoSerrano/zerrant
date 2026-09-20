"use client";

import { SecondaryButton } from "@/components/SecondaryButton";
import { EVENT_ATTENDANCE_ESTADOS, type EventAttendanceEstado } from "@/lib/db/events-schema";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
import { setRsvp } from "./actions";
import { RSVP_LABELS } from "./attendance";

const SELECTED_CLASS: Record<EventAttendanceEstado, string> = {
  voy: "bg-mint-raw/20 text-brand-mint border-brand-mint/30",
  quizas: "bg-warm-yellow/20 text-warm-yellow border-warm-yellow/30",
  no: "bg-surface-inset text-text-primary",
};

export type RsvpControlProps = {
  eventId: string;
  currentEstado: EventAttendanceEstado | null;
};

export function RsvpControl({ eventId, currentEstado }: RsvpControlProps) {
  const [state, formAction, pending] = useGuardedActionState(setRsvp, null);

  return (
    <div data-testid="rsvp-control" className="flex flex-col gap-2">
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="event_id" value={eventId} />
        <div className="flex gap-2" role="group" aria-label="Confirmar asistencia">
          {EVENT_ATTENDANCE_ESTADOS.map((estado) => {
            const selected = currentEstado === estado;
            return (
              <SecondaryButton
                key={estado}
                type="submit"
                name="estado"
                value={estado}
                disabled={pending}
                aria-pressed={selected}
                size="sm"
                className={cn("flex-1", selected && SELECTED_CLASS[estado])}
              >
                {RSVP_LABELS[estado]}
              </SecondaryButton>
            );
          })}
        </div>
        {state?.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      </form>
    </div>
  );
}
