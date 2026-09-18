/**
 * ZER-42 — pure contract mirroring the DB trigger on public.tasks.
 * RLS row policies alone cannot restrict which columns change; the trigger
 * enforces these transitions. Keep this file aligned with the migration.
 */

export type TaskGuardEstado = "abierta" | "tomada" | "hecha" | "verificada" | "cancelada";

export type TaskGuardRow = {
  estado: TaskGuardEstado;
  creado_por: string;
  tomada_por: string | null;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  urgencia: string;
};

export type TaskGuardActor = {
  id: string;
  isAdmin: boolean;
};

export type TaskGuardResult = { ok: true } | { ok: false; reason: string };

function contentChanged(oldRow: TaskGuardRow, newRow: TaskGuardRow): boolean {
  return (
    oldRow.titulo !== newRow.titulo ||
    oldRow.descripcion !== newRow.descripcion ||
    oldRow.categoria !== newRow.categoria ||
    oldRow.urgencia !== newRow.urgencia
  );
}

/** Whether actor may apply newRow over oldRow (PostgREST UPDATE semantics). */
export function assertTaskUpdateAllowed(
  oldRow: TaskGuardRow,
  newRow: TaskGuardRow,
  actor: TaskGuardActor,
): TaskGuardResult {
  if (newRow.creado_por !== oldRow.creado_por) {
    return { ok: false, reason: "creado_por is immutable" };
  }

  const content = contentChanged(oldRow, newRow);

  // Admin verify: hecha → verificada, only estado
  if (
    actor.isAdmin &&
    oldRow.estado === "hecha" &&
    newRow.estado === "verificada" &&
    newRow.tomada_por === oldRow.tomada_por &&
    !content
  ) {
    return { ok: true };
  }

  // Claim open task: anyone authenticated serrano path (caller is future taker)
  if (
    oldRow.estado === "abierta" &&
    oldRow.tomada_por === null &&
    newRow.estado === "tomada" &&
    newRow.tomada_por === actor.id &&
    !content
  ) {
    return { ok: true };
  }

  // Taker marks done
  if (
    actor.id === oldRow.tomada_por &&
    oldRow.estado === "tomada" &&
    newRow.estado === "hecha" &&
    newRow.tomada_por === oldRow.tomada_por &&
    !content
  ) {
    return { ok: true };
  }

  // Creator cancels
  if (
    actor.id === oldRow.creado_por &&
    (oldRow.estado === "abierta" || oldRow.estado === "tomada") &&
    newRow.estado === "cancelada" &&
    newRow.tomada_por === oldRow.tomada_por &&
    !content
  ) {
    return { ok: true };
  }

  // Creator edits content while still abierta
  if (
    actor.id === oldRow.creado_por &&
    oldRow.estado === "abierta" &&
    newRow.estado === "abierta" &&
    newRow.tomada_por === oldRow.tomada_por
  ) {
    return { ok: true };
  }

  if (newRow.estado === "verificada" && oldRow.estado !== "verificada") {
    return { ok: false, reason: "only admin may set verificada" };
  }

  if (content && actor.id === oldRow.tomada_por && actor.id !== oldRow.creado_por) {
    return { ok: false, reason: "taker cannot edit content" };
  }

  return { ok: false, reason: "update not allowed for this role/transition" };
}
