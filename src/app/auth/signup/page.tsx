"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mountain } from "lucide-react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { signUpWithPassword, signInWithGoogle } from "@/features/auth/actions";
import { isGoogleAuthEnabled } from "@/features/auth/google-auth-enabled";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";
import { cn } from "@/lib/utils";
import { safeInternalPath, withNext } from "@/lib/safe-next";
import { NextField } from "@/features/auth/NextField";

function SignupForm() {
  const [state, action, pending] = useGuardedActionState(signUpWithPassword, null);
  const next = safeInternalPath(useSearchParams().get("next"));
  const showGoogleAuth = isGoogleAuthEnabled();

  return (
    <div className="px-[26px] py-6 flex flex-col justify-center gap-[22px] min-h-full">
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "size-[76px] rounded-full shadow-[0_8px_22px_-4px_rgba(17,88,176,0.33)] flex items-center justify-center",
            BRAND_GRADIENT_CLASS,
          )}
        >
          <Mountain size={36} className="text-on-gradient" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="font-display text-[26px] font-bold text-text-primary">Nodo Serrano</h1>
          <p className="font-body text-sm font-normal text-text-secondary">
            El backoffice de la comunidad
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-[14px]">
        <NextField next={next} />
        <Input name="email" type="email" label="Email" placeholder="tu@email.com" required />
        <Input
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
        />

        {state?.error && (
          <p className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">{state.error}</p>
        )}

        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </PrimaryButton>
      </form>

      {showGoogleAuth ? (
        <>
          <div className="flex items-center gap-[12px]">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[13px] text-text-muted">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form action={signInWithGoogle}>
            <NextField next={next} />
            <SecondaryButton type="submit" className="w-full">
              Continuar con Google
            </SecondaryButton>
          </form>
        </>
      ) : null}

      <div className="flex items-center justify-center gap-[5px]">
        <span className="text-[13px] text-text-secondary">¿Ya tenés cuenta?</span>
        <Link
          href={withNext("/auth/login", next)}
          className="text-[13px] font-semibold text-coral hover:underline"
        >
          Iniciá sesión
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  // Webpack production prerender requires Suspense around useSearchParams (Next 16).
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
