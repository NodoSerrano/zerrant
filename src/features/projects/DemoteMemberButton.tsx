"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { demoteProjectMember } from "./actions";
import { MEMBER_ACTION_CLASS } from "./projectActionStyles";
import { cn } from "@/lib/utils";

// ZER-199: turns an admin back into a member. Confirms first: it can take the
// role from the viewer themselves. The confirmation is the shared pop up (ZER-221).
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
    <div className="shrink-0">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setConfirming(true)}
        className={cn(MEMBER_ACTION_CLASS, "text-coral")}
      >
        Quitar admin
      </button>
      {confirming ? (
        <ConfirmDialog
          title="Quitar admin"
          confirmLabel="Sí, quitar"
          pendingLabel="Quitando..."
          action={formAction}
          pending={pending}
          error={state?.error}
          onCancel={() => setConfirming(false)}
          hiddenFields={{ projectId, profileId }}
        >
          {`¿Quitarle el rol de admin a ${name}?`}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
