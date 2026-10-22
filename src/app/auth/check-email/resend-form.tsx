"use client";

import { FormFeedback } from "@/components/FormFeedback";
import { SecondaryButton } from "@/components/SecondaryButton";
import { resendSignupEmail } from "@/features/auth/actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { NextField } from "@/features/auth/NextField";

export function ResendSignupForm({ email, next = "/" }: { email?: string; next?: string }) {
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
      <NextField next={next} />
      <SecondaryButton type="submit" className="w-full" disabled={pending}>
        {pending ? "Reenviando..." : "Reenviar email"}
      </SecondaryButton>
      <FormFeedback
        error={state?.error}
        success={state?.success ? "Listo. Te reenviamos el enlace." : null}
      />
    </form>
  );
}
