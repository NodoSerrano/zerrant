"use client";

import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { PrimaryButton } from "@/components/PrimaryButton";
import { approveDonacion, rejectDonacion } from "@/features/donaciones/actions";

interface AdminDonacionActionsProps {
  aporteId: string;
}

export function AdminDonacionActions({ aporteId }: AdminDonacionActionsProps) {
  const [approveState, approveAction, approvePending] = useGuardedActionState(
    approveDonacion,
    null,
  );
  const [rejectState, rejectAction, rejectPending] = useGuardedActionState(rejectDonacion, null);
  const pending = approvePending || rejectPending;
  const error = approveState?.error ?? rejectState?.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <form action={approveAction}>
          <input type="hidden" name="aporte_id" value={aporteId} />
          <PrimaryButton type="submit" disabled={pending} className="!h-10 !px-4 !text-sm">
            {approvePending ? "…" : "Aprobar"}
          </PrimaryButton>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="aporte_id" value={aporteId} />
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-pill border border-coral px-4 text-sm font-medium text-coral disabled:opacity-50"
          >
            {rejectPending ? "…" : "Rechazar"}
          </button>
        </form>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}
