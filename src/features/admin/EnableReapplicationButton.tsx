"use client";

import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { FormFeedback } from "@/components/FormFeedback";
import { enableReapplication } from "./actions";

// ZER-180: an admin lets someone with a cerrada request apply again before the 30 days.
export function EnableReapplicationButton({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useGuardedActionState(enableReapplication, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-pill border border-border bg-surface px-4 min-h-[36px] font-display text-[13px] font-medium text-text-primary disabled:opacity-50"
      >
        {pending ? "Habilitando..." : "Habilitar nueva solicitud"}
      </button>
      <FormFeedback error={state?.error} success={state?.success} />
    </form>
  );
}
