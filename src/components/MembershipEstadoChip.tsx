import { estadoLabel, type MembershipRequestEstado } from "@/features/membership/request-state";

const TONE: Partial<Record<MembershipRequestEstado, string>> = {
  reprogramacion: "bg-warm-yellow/[0.17] border-warm-yellow",
  entrevista_coordinada: "bg-brand-blue/[0.12] border-brand-blue",
  entrevista_realizada: "bg-brand-green/[0.12] border-brand-green",
};

const NEUTRAL_TONE = "bg-surface-inset border-border";

/** Estado chip shared by RequestCard (6.1b) and PendingMembershipCard (2.7b). */
export function MembershipEstadoChip({ estado }: { estado: MembershipRequestEstado }) {
  const toned = estado in TONE;
  return (
    <span
      data-estado-chip
      className={`inline-flex w-fit shrink-0 whitespace-nowrap rounded-pill border px-[10px] py-1 ${TONE[estado] ?? NEUTRAL_TONE}`}
    >
      <span
        className={`font-body text-[11px] font-medium ${toned ? "text-text-primary" : "text-text-secondary"}`}
      >
        {estadoLabel(estado)}
      </span>
    </span>
  );
}
