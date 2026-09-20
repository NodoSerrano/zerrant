"use client";

import { SecondaryButton } from "@/components/SecondaryButton";
import { resendSignupEmail } from "@/features/auth/actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

export function ResendSignupForm({ email }: { email?: string }) {
  const [state, action, pending] = useGuardedActionState(resendSignupEmail, null);

  if (!email) {
    return (
      <p className="text-sm text-text-secondary">
        No tenemos el email de esta solicitud. Volvé al registro e intentá de nuevo.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 w-full">
      <input type="hidden" name="email" value={email} />
      <SecondaryButton type="submit" className="w-full" disabled={pending}>
        {pending ? "Reenviando..." : "Reenviar email"}
      </SecondaryButton>
      {state?.error && (
        <p className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-brand-green bg-brand-green/10 rounded-md px-3 py-2">
          Listo. Te reenviamos el enlace.
        </p>
      )}
    </form>
  );
}
