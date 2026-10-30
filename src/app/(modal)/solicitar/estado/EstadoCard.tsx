import { BadgeCheck, CircleSlash } from "lucide-react";
import { MembershipEstadoChip } from "@/components/MembershipEstadoChip";
import { PendingMembershipCard } from "@/app/(app)/profile/PendingMembershipCard";
import type { MembershipRequestEstado } from "@/features/membership/request-state";
import { formatReapplyDate, type ReapplyStatus } from "@/features/membership/reapply";

const FINAL = {
  aprobado: {
    Icon: BadgeCheck,
    iconTone: "text-brand-green",
    circle: "bg-brand-green/10",
    description:
      "¡Ya sos Serrano! Desde ahora aparecés en el plantel y podés sumarte a eventos y proyectos.",
  },
  cerrada: {
    Icon: CircleSlash,
    iconTone: "text-text-muted",
    circle: "bg-surface-inset",
    description: "Tu solicitud se cerró.",
  },
} as const;

// ZER-180: a new request waits 30 days, or less if an admin enabled it.
function cerradaDescription(reapply: ReapplyStatus | undefined): string {
  if (reapply?.allowed) return "Tu solicitud se cerró. Ya podés enviar una nueva.";
  const desde = reapply?.availableFrom
    ? ` Podés enviar una nueva desde el ${formatReapplyDate(reapply.availableFrom)}.`
    : "";
  return `Tu solicitud se cerró.${desde} Si creés que es un error, hablá con un admin de Nodo.`;
}

/** Status card of /solicitar/estado: 2.7b for active requests, Pencil variants for the final ones. */
export function EstadoCard({
  estado,
  reapply,
}: {
  estado: MembershipRequestEstado;
  /** Only for cerrada (ZER-180). */
  reapply?: ReapplyStatus;
}) {
  if (estado !== "aprobado" && estado !== "cerrada") {
    return <PendingMembershipCard estado={estado} />;
  }
  const { Icon, iconTone, circle } = FINAL[estado];
  const description =
    estado === "cerrada" ? cerradaDescription(reapply) : FINAL.aprobado.description;

  return (
    <div className="rounded-[22px] bg-surface border border-border p-[18px] flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${circle}`}>
          <Icon size={20} className={iconTone} aria-hidden />
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="font-display text-[17px] font-bold text-text-primary">
            Tu solicitud de membresía
          </span>
          <MembershipEstadoChip estado={estado} />
        </div>
      </div>
      <p className="font-body text-[13px] text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
