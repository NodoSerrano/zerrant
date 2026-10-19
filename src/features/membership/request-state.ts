/**
 * ZER-143 membership request state machine. Contract shared with ZER-144,
 * ZER-167 and ZER-169: the DB mirrors this table in
 * `public.membership_request_transitions` and enforces it with a trigger, so
 * this module is for UI decisions only, never for authorization.
 */

export const MEMBERSHIP_REQUEST_ESTADOS = [
  "pendiente_coordinacion",
  "entrevista_solicitada",
  "entrevista_coordinada",
  "reprogramacion",
  "entrevista_realizada",
  "aprobado",
  "cerrada",
] as const;

export type MembershipRequestEstado = (typeof MEMBERSHIP_REQUEST_ESTADOS)[number];

export type MembershipRequestActor = "admin" | "owner";

export const MEMBERSHIP_REQUEST_INITIAL_ESTADO: MembershipRequestEstado = "pendiente_coordinacion";

const TERMINAL: ReadonlySet<MembershipRequestEstado> = new Set(["aprobado", "cerrada"]);

export const MEMBERSHIP_REQUEST_ACTIVE_ESTADOS = MEMBERSHIP_REQUEST_ESTADOS.filter(
  (e) => !TERMINAL.has(e),
);

const LABELS: Record<MembershipRequestEstado, string> = {
  pendiente_coordinacion: "Pendiente de coordinación",
  entrevista_solicitada: "Entrevista solicitada",
  entrevista_coordinada: "Entrevista coordinada",
  reprogramacion: "Reprogramación requerida",
  entrevista_realizada: "Entrevista realizada",
  aprobado: "Aprobado como miembro",
  cerrada: "Solicitud cerrada",
};

export type MembershipRequestTransition = {
  from: MembershipRequestEstado;
  to: MembershipRequestEstado;
  actor: MembershipRequestActor;
};

export const MEMBERSHIP_REQUEST_TRANSITIONS: readonly MembershipRequestTransition[] = [
  { from: "pendiente_coordinacion", to: "entrevista_solicitada", actor: "admin" },
  { from: "pendiente_coordinacion", to: "cerrada", actor: "admin" },
  { from: "entrevista_solicitada", to: "entrevista_coordinada", actor: "admin" },
  { from: "entrevista_solicitada", to: "reprogramacion", actor: "admin" },
  { from: "entrevista_solicitada", to: "cerrada", actor: "admin" },
  { from: "entrevista_coordinada", to: "reprogramacion", actor: "admin" },
  { from: "entrevista_coordinada", to: "entrevista_realizada", actor: "admin" },
  { from: "entrevista_coordinada", to: "cerrada", actor: "admin" },
  { from: "reprogramacion", to: "entrevista_solicitada", actor: "admin" },
  { from: "reprogramacion", to: "entrevista_coordinada", actor: "admin" },
  { from: "reprogramacion", to: "cerrada", actor: "admin" },
  { from: "entrevista_realizada", to: "aprobado", actor: "admin" },
  { from: "entrevista_realizada", to: "cerrada", actor: "admin" },
];

export function isMembershipRequestEstado(value: unknown): value is MembershipRequestEstado {
  return (
    typeof value === "string" && (MEMBERSHIP_REQUEST_ESTADOS as readonly string[]).includes(value)
  );
}

export function isTerminalEstado(estado: MembershipRequestEstado): boolean {
  return TERMINAL.has(estado);
}

export function estadoLabel(estado: MembershipRequestEstado): string {
  return LABELS[estado];
}

export function canTransition(
  from: MembershipRequestEstado,
  to: MembershipRequestEstado,
  actor: MembershipRequestActor,
): boolean {
  return MEMBERSHIP_REQUEST_TRANSITIONS.some(
    (t) => t.from === from && t.to === to && t.actor === actor,
  );
}

export function nextEstados(
  from: MembershipRequestEstado,
  actor: MembershipRequestActor,
): MembershipRequestEstado[] {
  return MEMBERSHIP_REQUEST_TRANSITIONS.filter((t) => t.from === from && t.actor === actor).map(
    (t) => t.to,
  );
}

/** Matches the CHECK on membership_request_events.motivo. */
export const MEMBERSHIP_TRANSITION_MOTIVO_MAX = 500;

/** Estados that cannot be reached without a motivo (product decision, ZER-169). */
const MOTIVO_REQUIRED: ReadonlySet<MembershipRequestEstado> = new Set(["cerrada"]);

export function isMotivoRequired(to: MembershipRequestEstado): boolean {
  return MOTIVO_REQUIRED.has(to);
}
