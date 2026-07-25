"use client";

export const dynamic = "force-dynamic";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronLeft, LockKeyhole } from "lucide-react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { resetPassword } from "@/features/auth/actions";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, null);

  return (
    <div className="px-6 py-6 flex flex-col justify-center gap-5 min-h-full">
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/auth/login"
          aria-label="Volver"
          className="flex items-center justify-center size-9 text-text-primary"
        >
          <ChevronLeft size={24} />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="size-[84px] rounded-full bg-brand-green/10 flex items-center justify-center">
          <LockKeyhole size={36} className="text-brand-green" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-display text-2xl font-bold text-text-primary">Nueva contraseña</h1>
          <p className="font-body text-sm font-normal text-text-secondary leading-normal">
            Elegí una contraseña nueva para tu cuenta.
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-[14px]">
        <Input
          name="password"
          type="password"
          label="Nueva contraseña"
          placeholder="••••••••"
          required
          minLength={6}
        />
        <Input
          name="confirmPassword"
          type="password"
          label="Repetir contraseña"
          placeholder="••••••••"
          required
          minLength={6}
        />

        {state?.error && (
          <p className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">{state.error}</p>
        )}

        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar contraseña"}
        </PrimaryButton>
      </form>
    </div>
  );
}
