"use client";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { joinProject } from "./actions";

export function ProjectJoinButton({
  projectId,
  label,
  compact = false,
}: {
  projectId: string;
  label: string;
  /** Small, content-width button for list cards (ZER-154). */
  compact?: boolean;
}) {
  const [state, formAction, pending] = useGuardedActionState(joinProject, null);

  return (
    <form
      action={formAction}
      className={compact ? "flex flex-col items-end gap-1" : "flex w-full flex-col gap-2"}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <PrimaryButton
        type="submit"
        size={compact ? "sm" : "md"}
        className={compact ? undefined : "w-full"}
        disabled={pending}
      >
        {pending ? "Enviando..." : label}
      </PrimaryButton>
      {state?.error ? (
        <p
          role="alert"
          className={
            compact
              ? "font-body text-xs text-coral text-right"
              : "font-body text-xs text-coral text-center w-full"
          }
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
