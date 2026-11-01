"use client";

import Link from "next/link";
import { dismissProjectJoinNotice } from "@/features/projects/actions";
import type { ProjectJoinNoticeViewModel } from "@/features/projects/project-join-notices";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

type ActionState = { error?: string } | null;

export function ProjectJoinNoticeCard({ notice }: { notice: ProjectJoinNoticeViewModel }) {
  const [state, action, pending] = useGuardedActionState(dismissProjectJoinNotice, null);
  const error = (state as ActionState)?.error;

  return (
    <section
      aria-label={notice.kind === "aprobada" ? "Solicitud aprobada" : "Solicitud rechazada"}
      className="rounded-[22px] bg-surface border border-border p-[18px] flex flex-col gap-3"
    >
      <p className="font-body text-[14px] text-text-primary leading-relaxed">{notice.message}</p>
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={notice.href}
          className="font-display text-sm font-semibold text-brand-green underline-offset-2 hover:underline"
        >
          {notice.projectName}
        </Link>
        <form action={action}>
          <input type="hidden" name="projectId" value={notice.projectId} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-pill bg-surface border border-border h-9 px-4 font-display text-[13px] font-medium text-text-secondary disabled:opacity-50"
          >
            {pending ? "Cerrando..." : "Entendido"}
          </button>
        </form>
      </div>
      {error ? <p className="font-body text-xs text-coral">{error}</p> : null}
    </section>
  );
}
