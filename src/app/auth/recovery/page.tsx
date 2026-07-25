"use client";

export const dynamic = "force-dynamic";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, ArrowLeft } from "lucide-react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { sendPasswordReset } from "@/features/auth/actions";

export default function RecoveryPage() {
  const [state, action, pending] = useActionState(sendPasswordReset, null);

  return (
    <div className="px-6 py-6 flex flex-col justify-center gap-[22px] min-h-full">
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
        <div className="size-[84px] rounded-full bg-brand-blue/10 flex items-center justify-center">
          <Mail size={36} className="text-brand-blue" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="font-body text-sm font-normal text-text-secondary leading-normal">
            Ingresá tu email y te enviamos un enlace para restablecerla.
          </p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-[14px]">
        <Input name="email" type="email" label="Email" placeholder="tu@email.com" required />

        {state?.error && (
          <p className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">{state.error}</p>
        )}

        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Enviar enlace"}
        </PrimaryButton>
      </form>

      <div className="flex items-center justify-center">
        <Link
          href="/auth/login"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-green hover:underline"
        >
          <ArrowLeft size={15} />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
