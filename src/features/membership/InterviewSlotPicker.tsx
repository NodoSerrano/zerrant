"use client";

import { bookInterviewSlot } from "@/features/membership/interview-actions";
import { formatDayKey, formatEventTimeRange } from "@/features/events/day";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { PrimaryButton } from "@/components/PrimaryButton";

export type OpenInterviewSlot = {
  id: string;
  starts_at: string;
  ends_at: string;
};

export function InterviewSlotPicker({ slots }: { slots: OpenInterviewSlot[] }) {
  const [state, formAction, pending] = useGuardedActionState(bookInterviewSlot, null);

  if (slots.length === 0) {
    return (
      <p className="font-body text-[14px] text-text-muted text-center py-6">
        Todavía no hay horarios libres. Te avisamos cuando un entrevistador publique uno.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2" disabled={pending}>
        <legend className="sr-only">Horarios disponibles</legend>
        {slots.map((slot) => {
          const day = formatDayKey(new Date(slot.starts_at));
          const time = formatEventTimeRange(slot.starts_at, slot.ends_at);
          return (
            <label
              key={slot.id}
              className="flex items-center gap-3 rounded-[16px] border border-border bg-surface px-3 py-3"
            >
              <input type="radio" name="slotId" value={slot.id} required className="size-4" />
              <span className="font-body text-[14px] text-text-primary">
                {day} · {time}
              </span>
            </label>
          );
        })}
      </fieldset>
      {state?.error ? (
        <p className="font-body text-xs text-coral text-center">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="font-body text-xs text-brand-green text-center">{state.success}</p>
      ) : null}
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? "Reservando..." : "Reservar horario"}
      </PrimaryButton>
    </form>
  );
}
