"use client";

import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { promoteProjectMember } from "./actions";
import { MEMBER_ACTION_CLASS } from "./projectActionStyles";
import { cn } from "@/lib/utils";

export function PromoteMemberButton({
  projectId,
  profileId,
}: {
  projectId: string;
  profileId: string;
}) {
  const [state, formAction, pending] = useGuardedActionState(promoteProjectMember, null);

  return (
    <form action={formAction} className="shrink-0 flex flex-col items-end gap-1">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="profileId" value={profileId} />
      <button
        type="submit"
        disabled={pending}
        className={cn(MEMBER_ACTION_CLASS, "text-brand-blue")}
      >
        {pending ? "Designando..." : "Designar admin"}
      </button>
      {state?.error ? (
        <p className="font-body text-[10px] text-coral max-w-[9rem] text-right">{state.error}</p>
      ) : null}
    </form>
  );
}
