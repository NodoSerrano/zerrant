"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mountain } from "lucide-react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { signInWithPassword, signInWithGoogle } from "@/features/auth/actions";
import { isGoogleAuthEnabled } from "@/features/auth/google-auth-enabled";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";
import { cn } from "@/lib/utils";

const LOGIN_ERROR_COPY: Record<string, string> = {
  auth_callback_failed: "No pudimos confirmar el enlace. Pedí uno nuevo o intentá de nuevo.",
  otp_expired: "El enlace expiró o ya se usó. Pedí uno nuevo desde el registro.",
};

function loginErrorMessage(raw: string | null): string | null {
  if (!raw) return null;
  return LOGIN_ERROR_COPY[raw] ?? raw;
}

function LoginForm() {
  const [state, action, pending] = useGuardedActionState(signInWithPassword, null);
  const searchParams = useSearchParams();
  const urlError = loginErrorMessage(searchParams.get("error"));
  const error = state?.error ?? urlError;
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
          <Mountain size={36} className="text-on-primary" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="font-display text-[26px] font-bold text-text-primary">Nodo Serrano</h1>
          <p className="font-body text-sm font-normal text-text-secondary">
            El backoffice de la comunidad
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-[14px]">
        <Input name="email" type="email" label="Email" placeholder="tu@email.com" required />
        <Input
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Tu contraseña"
          required
        />

        <div className="flex justify-end">
          <Link
            href="/auth/recovery"
            className="font-body text-[13px] font-medium text-text-secondary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && (
          <p className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Ingresando..." : "Ingresar"}
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
            <SecondaryButton type="submit" className="w-full">
              Continuar con Google
            </SecondaryButton>
          </form>
        </>
      ) : null}

      <div className="flex items-center justify-center gap-[5px]">
        <span className="text-[13px] text-text-secondary">¿Primera vez?</span>
        <Link href="/auth/signup" className="text-[13px] font-semibold text-coral hover:underline">
          Creá tu cuenta
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // Webpack production prerender requires Suspense around useSearchParams (Next 16).
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
