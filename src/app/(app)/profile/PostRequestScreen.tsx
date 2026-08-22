"use client";

import { ArrowRight, Compass, Hourglass } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/features/auth/actions";
import { SecondaryButton } from "@/components/SecondaryButton";

export function PostRequestScreen() {
  return (
    <div className="flex flex-col items-center text-center gap-[20px] px-6 pt-6 pb-7">
      <div className="size-[92px] rounded-full bg-[#ff972820] flex items-center justify-center mt-2">
        <Hourglass size={40} className="text-[#ff4d21]" />
      </div>

      <div className="flex flex-col gap-2 max-w-[300px]">
        <h1 className="font-display text-[22px] font-medium text-text-primary leading-tight">
          Tu cuenta está en revisión
        </h1>
        <p className="font-body text-[13px] text-text-secondary leading-relaxed">
          Un admin de Nodo va a revisar tu solicitud pronto. Cuando te aprueben, pasás de Turista a
          Serrano y vas a aparecer en el plantel.
        </p>
      </div>

      <div className="rounded-pill bg-surface border border-border px-4 py-3 flex items-center gap-3">
        <span className="font-body text-xs font-semibold text-[#ff4d21] bg-[#ff972820] rounded-pill px-3 py-1.5">
          Turista
        </span>
        <ArrowRight size={16} className="text-text-muted shrink-0" />
        <span className="font-body text-xs font-semibold text-[#8a847c] bg-[#f1ebe0] rounded-pill px-3 py-1.5">
          Serrano
        </span>
      </div>

      <div className="flex items-center gap-2 text-text-secondary">
        <Compass size={18} className="shrink-0" />
        <p className="font-body text-[13px]">Mientras tanto, explorá el plantel y la agenda</p>
      </div>

      <Link
        href="/nodo/tasks"
        className="inline-flex items-center justify-center rounded-pill font-display font-medium text-on-primary transition-all bg-linear-to-br from-brand-green to-brand-blue shadow-[0_4px_14px_rgba(17,88,176,0.33)] hover:opacity-90 active:scale-[0.98] h-[54px] px-6 text-base w-full"
      >
        Explorar Nodo
      </Link>

      <form action={signOut} className="w-full">
        <SecondaryButton type="submit" className="w-full">
          Cerrar sesión
        </SecondaryButton>
      </form>
    </div>
  );
}
