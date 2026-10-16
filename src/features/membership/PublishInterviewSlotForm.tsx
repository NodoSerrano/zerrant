"use client";

import { createInterviewSlot } from "@/features/membership/interview-actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { PrimaryButton } from "@/components/PrimaryButton";

export function PublishInterviewSlotForm() {
  const [state, formAction, pending] = useGuardedActionState(createInterviewSlot, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="font-body text-[12px] font-medium text-text-muted">
          Nuevo horario (Argentina)
        </span>
        <input
          type="datetime-local"
          name="startsAt"
          required
          className="h-[44px] rounded-[12px] border border-border bg-surface px-3 font-body text-[14px] text-text-primary"
        />
      </label>
      {state?.error ? <p className="font-body text-xs text-coral">{state.error}</p> : null}
      {state?.success ? (
        <p className="font-body text-xs text-brand-green">{state.success}</p>
      ) : null}
      <PrimaryButton type="submit" size="sm" disabled={pending}>
        {pending ? "Publicando..." : "Publicar horario"}
      </PrimaryButton>
    </form>
  );
}
