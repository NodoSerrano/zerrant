"use client";

import { useState } from "react";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { leaveProject } from "./actions";

// ZER-200: the viewer leaves the project. Confirms first: getting back in may
// need an admin's approval.
export function LeaveProjectButton({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useGuardedActionState(leaveProject, null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {confirming ? (
        <form
          action={formAction}
          className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <p className="font-body text-sm text-text-primary">
            Vas a dejar de ser parte de este proyecto. Para volver vas a tener que unirte o pedir
            entrar de nuevo.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="flex-1 whitespace-nowrap rounded-pill border border-border px-3 py-2 font-display text-[13px] font-semibold text-text-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 whitespace-nowrap rounded-pill bg-coral/10 px-3 py-2 font-display text-[13px] font-semibold text-coral disabled:opacity-50"
            >
              {pending ? "Saliendo..." : "Sí, salir"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="font-display text-[15px] font-medium text-coral"
        >
          Salir del proyecto
        </button>
      )}
      {state?.error ? (
        <p role="alert" className="w-full text-sm text-coral bg-coral/10 rounded-md px-3 py-2">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
