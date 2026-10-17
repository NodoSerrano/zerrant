/**
 * ZER-169 request history: reads membership_request_events (written by the
 * ZER-143 triggers; admins only via RLS) into what the admin panel shows.
 */

import { displayName } from "@/features/profile/displayName";
import type { Profile } from "@/features/profile/types";
import type { MembershipRequestEstado } from "./request-state";

export const MEMBERSHIP_REQUEST_EVENTS_SELECT =
  "id, request_id, from_estado, to_estado, actor_id, motivo, created_at, profiles!membership_request_events_actor_id_fkey(nombre, apellido, apodo, nombre_visible)";

type EventActor = Pick<Profile, "nombre" | "apellido" | "apodo"> & {
  nombre_visible: Profile["nombre_visible"] | null;
};

export type RequestEventRow = {
  id: string;
  request_id: string;
  from_estado: MembershipRequestEstado | null;
  to_estado: MembershipRequestEstado;
  actor_id: string | null;
  motivo: string | null;
  created_at: string;
  profiles: EventActor | EventActor[] | null;
};

export type RequestHistoryEvent = {
  id: string;
  from: MembershipRequestEstado | null;
  to: MembershipRequestEstado;
  actorName: string;
  motivo: string | null;
  at: string;
};

export type AdminMembresiasVista = "en_curso" | "historial";

export function parseVista(raw: string | undefined): AdminMembresiasVista {
  return raw === "historial" ? "historial" : "en_curso";
}

export const HISTORY_FILTERS = ["todas", "aprobado", "cerrada"] as const;
export type HistoryFilter = (typeof HISTORY_FILTERS)[number];

export function parseHistoryFilter(raw: string | undefined): HistoryFilter {
  return (HISTORY_FILTERS as readonly string[]).includes(raw ?? "")
    ? (raw as HistoryFilter)
    : "todas";
}

export function historyEstados(filter: HistoryFilter): MembershipRequestEstado[] {
  return filter === "todas" ? ["aprobado", "cerrada"] : [filter];
}

function actorName(profiles: RequestEventRow["profiles"]): string {
  const actor = Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
  // Null actor: service_role or a since-deleted profile (actor_id is set null).
  if (!actor) return "Sistema";
  const name = displayName({
    nombre: actor.nombre,
    apellido: actor.apellido,
    apodo: actor.apodo,
    nombre_visible: actor.nombre_visible ?? "nombre_apellido",
  });
  return name || "Sin nombre";
}

export function groupEventsByRequest(rows: RequestEventRow[]): Map<string, RequestHistoryEvent[]> {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const byRequest = new Map<string, RequestHistoryEvent[]>();
  for (const row of sorted) {
    const list = byRequest.get(row.request_id) ?? [];
    list.push({
      id: row.id,
      from: row.from_estado,
      to: row.to_estado,
      actorName: actorName(row.profiles),
      motivo: row.motivo,
      at: row.created_at,
    });
    byRequest.set(row.request_id, list);
  }
  return byRequest;
}

/** Latest estado change; the creation row (from = null) is not a change. */
export function lastChangeOf(
  events: RequestHistoryEvent[],
): { actorName: string; at: string; motivo: string | null } | null {
  const last = events.findLast((event) => event.from !== null);
  return last ? { actorName: last.actorName, at: last.at, motivo: last.motivo } : null;
}

/** The event that moved the request into its final estado. */
export function closingEvent(
  events: RequestHistoryEvent[],
  estado: MembershipRequestEstado,
): RequestHistoryEvent | null {
  return events.findLast((event) => event.to === estado) ?? null;
}
