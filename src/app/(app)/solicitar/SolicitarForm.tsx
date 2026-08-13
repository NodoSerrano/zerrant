"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronLeft, Info, UserPlus } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { createMembershipRequest } from "@/features/membership/actions";
import { cn } from "@/lib/utils";

export function SolicitarForm() {
  const [state, action, pending] = useActionState(createMembershipRequest, null);

  const leaveClass = cn(
    "rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
    pending && "pointer-events-none opacity-50",
  );

  return (
    <div className="flex flex-col gap-5 pt-1.5 px-6 pb-6">
      <div>
        <Link
          href="/profile"
          aria-label="Volver"
          aria-disabled={pending || undefined}
          tabIndex={pending ? -1 : undefined}
          className={leaveClass}
        >
          <ChevronLeft className="size-6 text-text-primary" />
        </Link>
      </div>

      <div className="flex justify-center">
        <div className="flex size-[84px] items-center justify-center rounded-full bg-linear-to-br from-brand-mint to-brand-blue">
          <UserPlus className="size-9 text-on-primary" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[24px] font-bold text-text-primary">
          Sumate como Serrano
        </h1>
        <p className="font-body text-[14px] leading-[1.5] text-text-secondary">
          Contanos por qué querés ser parte y qué te gustaría aportar al nodo.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <div className="flex flex-col gap-[7px]">
          <label
            htmlFor="mensaje"
            className="font-body text-[13px] font-medium text-text-secondary"
          >
            Mensaje (opcional)
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            placeholder="Ej: Soy dev, me copa la infra y quiero ayudar con el sitio y las charlas..."
            className={cn(
              "h-[110px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <div className="flex items-center gap-[10px] rounded-2xl bg-surface-inset p-[14px]">
          <Info className="size-[18px] shrink-0 text-brand-blue" />
          <p className="font-body text-[12px] leading-[1.4] text-text-secondary">
            Un admin va a revisar tu solicitud y te va a asignar un tier.
          </p>
        </div>

        {state?.error && (
          <p role="alert" className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={pending} className="w-full">
          {pending ? "Enviando..." : "Enviar solicitud"}
        </PrimaryButton>
      </form>

      <Link
        href="/profile"
        aria-disabled={pending || undefined}
        tabIndex={pending ? -1 : undefined}
        className={cn(
          leaveClass,
          "font-display text-[15px] font-medium text-text-muted text-center",
        )}
      >
        Ahora no
      </Link>
    </div>
  );
}
