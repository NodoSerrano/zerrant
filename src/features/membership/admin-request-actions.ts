import { nextEstados, type MembershipRequestEstado } from "./request-state";

export type AdminRequestActionIcon =
  | "calendar-plus"
  | "calendar-check"
  | "calendar-clock"
  | "check";

export interface AdminRequestAction {
  to: MembershipRequestEstado;
  label: string;
  variant: "primary" | "secondary";
  icon: AdminRequestActionIcon;
}

const CONFIRM_SCHEDULE: AdminRequestAction = {
  to: "entrevista_coordinada",
  label: "Confirmar horario",
  variant: "primary",
  icon: "calendar-check",
};

const RESCHEDULE: AdminRequestAction = {
  to: "reprogramacion",
  label: "Reprogramar",
  variant: "secondary",
  icon: "calendar-clock",
};

/** Admin actions per estado, as in the 6.1b RequestCard frame. "Cerrar solicitud" is separate. */
const ACTIONS: Partial<Record<MembershipRequestEstado, AdminRequestAction[]>> = {
  pendiente_coordinacion: [
    {
      to: "entrevista_solicitada",
      label: "Solicitar entrevista",
      variant: "primary",
      icon: "calendar-plus",
    },
  ],
  entrevista_solicitada: [CONFIRM_SCHEDULE, RESCHEDULE],
  entrevista_coordinada: [
    {
      to: "entrevista_realizada",
      label: "Marcar entrevista realizada",
      variant: "primary",
      icon: "check",
    },
    RESCHEDULE,
  ],
  reprogramacion: [
    CONFIRM_SCHEDULE,
    {
      to: "entrevista_solicitada",
      label: "Pedir otro horario",
      variant: "secondary",
      icon: "calendar-plus",
    },
  ],
  entrevista_realizada: [
    { to: "aprobado", label: "Aprobar como miembro", variant: "primary", icon: "check" },
  ],
};

export function adminRequestActions(estado: MembershipRequestEstado): {
  actions: AdminRequestAction[];
  canClose: boolean;
} {
  return {
    actions: ACTIONS[estado] ?? [],
    canClose: nextEstados(estado, "admin").includes("cerrada"),
  };
}
