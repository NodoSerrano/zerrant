import Link from "next/link";
import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadMembershipPipeline } from "@/features/membership/pipeline-server";
import { membershipPipelineStep } from "@/features/membership/pipeline";
import type { MembershipRequestEstado } from "@/features/membership/request-state";
import { reapplyStatus } from "@/features/membership/reapply";
import { BRAND_CTA_SHADOW_CLASS, BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";
import { cn } from "@/lib/utils";
import { EstadoCard } from "./EstadoCard";
import { Timeline } from "./Timeline";

export const dynamic = "force-dynamic";

const BUTTON =
  "inline-flex h-[54px] w-full items-center justify-center rounded-pill px-6 font-display text-base font-medium transition-all active:scale-[0.98]";

export default async function EstadoPage() {
  const input = await loadMembershipPipeline(await createClient());

  if (!input.hasSession) redirect("/auth/login?next=%2Fsolicitar%2Festado");
  if (input.profileError || input.requestError) redirect("/profile");

  const isMember = Boolean(input.profile?.tier) && input.profile?.tier !== "tourist";
  if (!input.request && !isMember) redirect("/solicitar");

  const progress = membershipPipelineStep(input);
  // Membership wins over any request row (e.g. an old cerrada one); a member
  // without a request row is shown as approved too.
  const estado: MembershipRequestEstado = isMember
    ? "aprobado"
    : (input.request?.estado ?? "aprobado");
  const approved = estado === "aprobado";
  const reapply =
    estado === "cerrada" && input.request
      ? reapplyStatus({
          cerradaEn: input.request.cerradaEn ?? null,
          reaperturaHabilitadaEn: input.request.reaperturaHabilitadaEn ?? null,
        })
      : undefined;

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex justify-start">
        <Link
          href="/profile"
          aria-label="Cerrar"
          className="-ml-2.5 inline-flex size-11 items-center justify-center rounded-md text-text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="size-6" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold text-text-primary">
          Tu camino a Serrano
        </h1>
        <p className="text-sm text-text-secondary">Seguí en qué paso está tu solicitud.</p>
      </div>

      <EstadoCard estado={estado} reapply={reapply} />
      <Timeline progress={progress} />

      {approved ? (
        <Link
          href="/"
          className={cn(
            BUTTON,
            "text-on-gradient hover:opacity-90",
            BRAND_GRADIENT_CLASS,
            BRAND_CTA_SHADOW_CLASS,
          )}
        >
          Entrar a Nodo
        </Link>
      ) : reapply?.allowed ? (
        <Link
          href="/solicitar"
          className={cn(
            BUTTON,
            "text-on-gradient hover:opacity-90",
            BRAND_GRADIENT_CLASS,
            BRAND_CTA_SHADOW_CLASS,
          )}
        >
          Volver a solicitar
        </Link>
      ) : (
        <Link
          href="/profile"
          className={cn(
            BUTTON,
            "border border-border bg-surface text-text-primary hover:bg-surface-inset",
          )}
        >
          Ir a mi perfil
        </Link>
      )}
    </div>
  );
}
