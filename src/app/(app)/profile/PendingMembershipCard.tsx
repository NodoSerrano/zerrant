import { Hourglass } from "lucide-react";

/** Tourist membership card when a request is already pending (ZER-110). */
export function PendingMembershipCard() {
  return (
    <div className="rounded-[22px] bg-surface border border-border p-[18px] flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="size-10 rounded-full bg-warm-yellow/10 flex items-center justify-center shrink-0">
          <Hourglass size={20} className="text-warm-orange" aria-hidden />
        </div>
        <span className="font-display text-[17px] font-bold text-text-primary">
          Solicitud en revisión
        </span>
      </div>
      <p className="font-body text-[13px] text-text-secondary leading-relaxed">
        Un admin de Nodo va a revisar tu solicitud pronto. Cuando te aprueben, pasás de Turista a
        Serrano y vas a aparecer en el plantel.
      </p>
    </div>
  );
}
