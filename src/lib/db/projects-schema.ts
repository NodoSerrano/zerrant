/**
 * ZER-78 — M5 projects foundation (schema contract, no UI).
 * Mirrors PRD §6 + _bmad-output/specs/spec-m5-proyectos/data-model.md.
 */

export const PROJECT_ESTADOS = ["idea", "en_curso", "pausado", "terminado"] as const;
export type ProjectEstado = (typeof PROJECT_ESTADOS)[number];

export const PROJECT_INGRESOS = ["abierto", "aprobacion"] as const;
export type ProjectIngreso = (typeof PROJECT_INGRESOS)[number];

export const PROJECT_MEMBER_ROLES = ["miembro", "admin"] as const;
export type ProjectMemberRol = (typeof PROJECT_MEMBER_ROLES)[number];

export const PROJECT_MEMBER_ESTADOS = ["pendiente", "aprobado"] as const;
export type ProjectMemberEstado = (typeof PROJECT_MEMBER_ESTADOS)[number];

/** Columns PostgREST may INSERT on public.projects. */
export const PROJECTS_INSERT_COLUMNS = [
  "nombre",
  "descripcion",
  "estado",
  "ingreso",
  "creado_por",
] as const;

/** Columns PostgREST may UPDATE (creado_por immutable via grant). */
export const PROJECTS_UPDATE_COLUMNS = ["nombre", "descripcion", "estado", "ingreso"] as const;

/**
 * Columns PostgREST may INSERT on public.project_members for self-join.
 * rol omitted so clients cannot self-grant admin (defaults + WITH CHECK lock miembro).
 * estado is allowed so the action can set aprobado/pendiente; RLS WITH CHECK enforces the ingreso door.
 */
export const PROJECT_MEMBERS_INSERT_COLUMNS = ["project_id", "profile_id", "estado"] as const;

/** Columns PostgREST may UPDATE on public.project_members. */
export const PROJECT_MEMBERS_UPDATE_COLUMNS = ["rol", "estado"] as const;

/** Filename fragment every ZER-78 migration must include. */
export const PROJECTS_MIGRATION_NAME_FRAGMENT = "zer78_projects_project_members";

export function isProjectEstado(value: string): value is ProjectEstado {
  return (PROJECT_ESTADOS as readonly string[]).includes(value);
}

export function isProjectIngreso(value: string): value is ProjectIngreso {
  return (PROJECT_INGRESOS as readonly string[]).includes(value);
}
