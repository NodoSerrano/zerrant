/**
 * ZER-91 — M6 events foundation (schema contract, no UI).
 * Mirrors PRD §6 + docs/roadmap/Seguridad RLS.md.
 */

export const EVENT_ATTENDANCE_ESTADOS = ["voy", "quizas", "no"] as const;

export type EventAttendanceEstado = (typeof EVENT_ATTENDANCE_ESTADOS)[number];

/** Columns PostgREST may INSERT on public.events (creado_por set by client = auth.uid). */
export const EVENTS_INSERT_COLUMNS = [
  "titulo",
  "descripcion",
  "lugar",
  "inicio",
  "fin",
  "creado_por",
] as const;

/** Columns PostgREST may UPDATE on public.events (creado_por immutable via grant + RLS). */
export const EVENTS_UPDATE_COLUMNS = ["titulo", "descripcion", "lugar", "inicio", "fin"] as const;

export const EVENT_ATTENDANCE_INSERT_COLUMNS = ["event_id", "profile_id", "estado"] as const;

export const EVENT_ATTENDANCE_UPDATE_COLUMNS = ["estado"] as const;

/** Filename fragment every ZER-91 migration must include. */
export const EVENTS_MIGRATION_NAME_FRAGMENT = "zer91_events_event_attendance";

export function isEventAttendanceEstado(value: string): value is EventAttendanceEstado {
  return (EVENT_ATTENDANCE_ESTADOS as readonly string[]).includes(value);
}
