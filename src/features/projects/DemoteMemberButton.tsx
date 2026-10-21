"use client";

import { useState } from "react";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { demoteProjectMember } from "./actions";

// ZER-199: turns an admin back into a member. Confirms first: it can take the
// role from the viewer themselves.
export function DemoteMemberButton({
  projectId,
  profileId,
  name,
}: {
  projectId: string;
  profileId: string;
  name: string;
}) {
  const [state, formAction, pending] = useGuardedActionState(demoteProjectMember, null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      {confirming ? (
        <form action={formAction} className="flex flex-col items-end gap-1.5">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="profileId" value={profileId} />
          <p className="max-w-[11rem] text-right font-body text-[11px] text-text-secondary">
            {`¿Quitarle el rol de admin a ${name}?`}
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="whitespace-nowrap rounded-pill border border-border px-2.5 py-1 font-display text-[11px] font-semibold text-text-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="whitespace-nowrap rounded-pill bg-coral/10 px-2.5 py-1 font-display text-[11px] font-semibold text-coral disabled:opacity-50"
            >
              {pending ? "Quitando..." : "Sí, quitar"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="whitespace-nowrap font-display text-[11px] font-semibold text-coral"
        >
          Quitar admin
        </button>
      )}
      {state?.error ? (
        <p role="alert" className="max-w-[11rem] text-right font-body text-[10px] text-coral">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
