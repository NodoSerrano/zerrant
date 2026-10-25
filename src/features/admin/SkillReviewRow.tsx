"use client";

import { FormFeedback } from "@/components/FormFeedback";
import { reviewSkill } from "@/features/plantel/skills-actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

/** One pending skill proposal with approve / reject (ZER-163). */
export function SkillReviewRow({
  skillId,
  nombre,
  proposedBy,
}: {
  skillId: string;
  nombre: string;
  proposedBy: string;
}) {
  const [state, formAction, pending] = useGuardedActionState(reviewSkill, null);

  return (
    <li className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-display text-[16px] font-medium text-text-primary">{nombre}</span>
        <span className="font-body text-[12px] text-text-muted">Propuesta por {proposedBy}</span>
      </div>
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="skillId" value={skillId} />
        <button
          type="submit"
          name="decision"
          value="aprobar"
          disabled={pending}
          aria-label={`Aprobar ${nombre}`}
          className="flex-1 h-11 rounded-pill bg-primary font-display text-[14px] font-medium text-on-primary disabled:opacity-50"
        >
          Aprobar
        </button>
        <button
          type="submit"
          name="decision"
          value="rechazar"
          disabled={pending}
          aria-label={`Rechazar ${nombre}`}
          className="flex-1 h-11 rounded-pill border border-border bg-surface font-display text-[14px] font-medium text-text-secondary disabled:opacity-50"
        >
          Rechazar
        </button>
      </form>
      <FormFeedback error={state?.error} success={state?.success} />
    </li>
  );
}
