"use client";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { joinProject } from "./actions";

export function ProjectJoinButton({ projectId, label }: { projectId: string; label: string }) {
  const [state, formAction, pending] = useGuardedActionState(joinProject, null);

  return (
    <form action={formAction} className="flex w-full flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <PrimaryButton type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : label}
      </PrimaryButton>
      {state?.error ? (
        <p className="font-body text-xs text-coral text-center w-full">{state.error}</p>
      ) : null}
    </form>
  );
}
