"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { approveProjectJoin, rejectProjectJoin } from "@/features/projects/actions";
import { joinRequestMetaLabel } from "@/features/projects/join-request-transform";
import type { JoinRequestViewModel } from "@/features/projects/join-request-transform";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

type ActionState = { error?: string } | null;

export function JoinRequestRow({
  projectId,
  request,
}: {
  projectId: string;
  request: JoinRequestViewModel;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveState, approveAction, approvePending] = useGuardedActionState(
    approveProjectJoin,
    null,
  );
  const [rejectState, rejectAction, rejectPending] = useGuardedActionState(rejectProjectJoin, null);

  const approveError = (approveState as ActionState)?.error;
  const rejectError = (rejectState as ActionState)?.error;
  const busy = approvePending || rejectPending;
  const meta = joinRequestMetaLabel(request.createdAt);

  return (
    <div className="rounded-[24px] bg-surface border border-border p-4 flex flex-col gap-3.5 shadow-[0_10px_30px_-12px_#1a161426]">
      <div className="flex items-center gap-3">
        <Avatar name={request.name || "??"} src={request.avatarUrl} size="md" className="size-12" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-display text-[16px] font-medium text-text-primary truncate">
            {request.name || "Sin nombre"}
          </span>
          {request.subtitle ? (
            <span className="font-body text-xs text-text-muted truncate">{request.subtitle}</span>
          ) : null}
          <span className="font-body text-[11px] text-text-muted">{meta}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {!rejectOpen ? (
          <div className="flex gap-2.5">
            <form action={approveAction} className="flex-1">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="profileId" value={request.profileId} />
              <button
                type="submit"
                disabled={busy}
                className="rounded-pill bg-primary h-[44px] flex items-center justify-center gap-1.5 w-full disabled:opacity-50"
              >
                <Check className="size-[17px] text-on-primary" aria-hidden="true" />
                <span className="font-display text-[15px] font-medium text-on-primary">
                  {approvePending ? "Aprobando..." : "Aprobar"}
                </span>
              </button>
            </form>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejectOpen(true)}
              className="flex-1 rounded-pill bg-surface border border-border h-[44px] flex items-center justify-center w-full disabled:opacity-50"
            >
              <span className="font-display text-[15px] font-medium text-text-secondary">
                Rechazar
              </span>
            </button>
          </div>
        ) : (
          <form action={rejectAction} className="flex flex-col gap-2.5">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="profileId" value={request.profileId} />
            <label className="flex flex-col gap-1.5">
              <span className="font-display text-[13px] font-medium text-text-primary">
                Motivo del rechazo
              </span>
              <textarea
                name="motivo"
                required
                rows={3}
                placeholder="Contale por qué no entra ahora"
                className="w-full rounded-[16px] border border-border bg-surface-inset px-3 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted resize-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Motivo del rechazo"
              />
            </label>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => setRejectOpen(false)}
                className="flex-1 rounded-pill bg-surface border border-border h-[44px] flex items-center justify-center disabled:opacity-50"
              >
                <span className="font-display text-[15px] font-medium text-text-secondary">
                  Cancelar
                </span>
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-pill bg-primary h-[44px] flex items-center justify-center disabled:opacity-50"
              >
                <span className="font-display text-[15px] font-medium text-on-primary">
                  {rejectPending ? "Rechazando..." : "Confirmar rechazo"}
                </span>
              </button>
            </div>
          </form>
        )}
        {(approveError || rejectError) && (
          <p className="font-body text-xs text-coral text-center">{approveError || rejectError}</p>
        )}
      </div>
    </div>
  );
}
