"use client";

import { useState } from "react";
import { SecondaryButton } from "@/components/SecondaryButton";
import { EVENT_ATTENDANCE_ESTADOS, type EventAttendanceEstado } from "@/lib/db/events-schema";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
import { setRsvp } from "./actions";
import { RSVP_LABELS } from "./attendance";

// Each selected class repeats its background on hover: on touch screens hover
// sticks after the tap and would grey the chosen answer out again (ZER-211).
const SELECTED_CLASS: Record<EventAttendanceEstado, string> = {
  voy: "bg-mint-raw/20 hover:bg-mint-raw/20 text-on-mint-tint border-brand-mint/30",
  quizas: "bg-warm-yellow/20 hover:bg-warm-yellow/20 text-on-yellow-tint border-warm-yellow/30",
  // Red, so a chosen "No" never reads as an unanswered grey option.
  no: "bg-coral/20 hover:bg-coral/20 text-on-coral-tint border-coral/30",
};

export type RsvpControlProps = {
  eventId: string;
  currentEstado: EventAttendanceEstado | null;
};

export function RsvpControl({ eventId, currentEstado }: RsvpControlProps) {
  const [state, formAction, pending] = useGuardedActionState(setRsvp, null);
  // Saving takes a moment: show the tapped answer as chosen meanwhile, then
  // trust the saved one again (ZER-211).
  const [tapped, setTapped] = useState<EventAttendanceEstado | null>(null);
  const shownEstado = pending && tapped ? tapped : currentEstado;

  return (
    <div data-testid="rsvp-control" className="flex flex-col gap-2">
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="event_id" value={eventId} />
        <div className="flex gap-2" role="group" aria-label="Confirmar asistencia">
          {EVENT_ATTENDANCE_ESTADOS.map((estado) => {
            const selected = shownEstado === estado;
            return (
              <SecondaryButton
                key={estado}
                type="submit"
                name="estado"
                value={estado}
                disabled={pending}
                aria-pressed={selected}
                onClick={() => setTapped(estado)}
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
