"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { leaveProject } from "./actions";

// ZER-200: the viewer leaves the project. Confirms first: getting back in may
// need an admin's approval. The confirmation is the shared pop up (ZER-221).
export function LeaveProjectButton({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useGuardedActionState(leaveProject, null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setConfirming(true)}
        className="font-display text-[15px] font-medium text-coral"
      >
        Salir del proyecto
      </button>
      {confirming ? (
        <ConfirmDialog
          title="Salir del proyecto"
          confirmLabel="Sí, salir"
          pendingLabel="Saliendo..."
          action={formAction}
          pending={pending}
          error={state?.error}
          onCancel={() => setConfirming(false)}
          hiddenFields={{ projectId }}
        >
          Vas a dejar de ser parte de este proyecto. Para volver vas a tener que unirte o pedir
          entrar de nuevo.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
