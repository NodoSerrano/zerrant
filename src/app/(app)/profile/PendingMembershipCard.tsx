import { CalendarCheck, CalendarClock, CalendarPlus, Hourglass, UserCheck } from "lucide-react";
import type { ComponentType } from "react";
import { MembershipEstadoChip } from "@/components/MembershipEstadoChip";
import { type MembershipRequestEstado } from "@/features/membership/request-state";

type StateCopy = {
  Icon: ComponentType<{ size?: number; className?: string }>;
  description: string;
};

const PENDIENTE: StateCopy = {
  Icon: Hourglass,
  description:
    "Recibimos tu solicitud. Un admin de Nodo te va a contactar para coordinar una entrevista.",
};

/** Icon + description per estado, as in the 2.7b PendingMembershipCard frame. */
const COPY: Partial<Record<MembershipRequestEstado, StateCopy>> = {
  pendiente_coordinacion: PENDIENTE,
  entrevista_solicitada: {
    Icon: CalendarPlus,
    description:
      "Te propusimos una entrevista. Te vamos a escribir por el contacto que dejaste para elegir horario.",
  },
  entrevista_coordinada: {
    Icon: CalendarCheck,
    description: "Tu entrevista ya tiene horario. ¡Nos vemos en el Nodo!",
  },
  reprogramacion: {
    Icon: CalendarClock,
    description:
      "El horario que coordinamos no está disponible. Te vamos a proponer uno nuevo: tu solicitud sigue en curso.",
  },
  entrevista_realizada: {
    Icon: UserCheck,
    description:
      "Gracias por la entrevista. Falta la confirmación final para que pases de Turista a Serrano.",
  },
};

/** Tourist membership card while a request is in progress (ZER-110, ZER-143). */
export function PendingMembershipCard({ estado }: { estado: MembershipRequestEstado }) {
  const { Icon, description } = COPY[estado] ?? PENDIENTE;

  return (
    <div className="rounded-[22px] bg-surface border border-border p-[18px] flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="size-10 rounded-full bg-warm-yellow/10 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-warm-orange" aria-hidden />
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
