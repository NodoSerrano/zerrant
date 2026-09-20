/**
 * ZER-87 — M6 aportes foundation (schema contract, no UI).
 * Mirrors PRD §6 + docs/roadmap/Seguridad RLS.md.
 */

export const APORTE_TIPOS = [
  "economico",
  "donacion",
  "prestamo",
  "charla",
  "actividad",
  "mantenimiento",
  "administracion",
  "yerba",
  "otro",
] as const;

export type AporteTipo = (typeof APORTE_TIPOS)[number];

/** Columns PostgREST may INSERT on public.aportes. */
export const APORTES_INSERT_COLUMNS = [
  "profile_id",
  "tipo",
  "descripcion",
  "monto",
  "fecha",
  "registrado_por",
] as const;

/** Columns PostgREST may UPDATE (profile_id / registrado_por immutable via grant). */
export const APORTES_UPDATE_COLUMNS = ["tipo", "descripcion", "monto", "fecha"] as const;

/** Filename fragment every ZER-87 migration must include. */
export const APORTES_MIGRATION_NAME_FRAGMENT = "zer87_aportes";

export function isAporteTipo(value: string): value is AporteTipo {
  return (APORTE_TIPOS as readonly string[]).includes(value);
}
