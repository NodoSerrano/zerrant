"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isTasksBlockedTier } from "@/features/tasks/tier-guards";
import {
  PROJECT_ESTADOS,
  PROJECT_INGRESOS,
  type ProjectEstado,
  type ProjectIngreso,
} from "./types";

const CREATE_ERROR = "No pudimos crear el proyecto. Probá de nuevo.";
const CREATE_REJECTED = "No pudimos crear el proyecto.";
const INVALID_INPUT = "Revisá los datos del proyecto.";
const EMPTY_NOMBRE = "El nombre no puede estar vacío";
const TOURIST_BLOCKED = "Solo los serranos pueden crear proyectos";

function trimmed(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Validates against the enum list instead of blindly casting. */
function oneOf<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

/**
 * Creates a project. The creator is seated as project_members admin/aprobado by
 * the AFTER INSERT trigger from ZER-78 — same transaction as the projects row.
 */
export async function createProject(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (!profile || isTasksBlockedTier(profile.tier)) {
    return { error: TOURIST_BLOCKED };
  }

  const nombre = trimmed(formData.get("nombre"));
  if (!nombre) {
    return { error: EMPTY_NOMBRE };
  }

  const estado = oneOf(formData.get("estado"), PROJECT_ESTADOS);
  const ingreso = oneOf(formData.get("ingreso"), PROJECT_INGRESOS);
  if (!estado || !ingreso) {
    return { error: INVALID_INPUT };
  }

  void (estado satisfies ProjectEstado);
  void (ingreso satisfies ProjectIngreso);

  const descripcion = formData.has("descripcion") ? trimmed(formData.get("descripcion")) : null;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      nombre,
      descripcion,
      estado,
      ingreso,
      creado_por: user.id,
    })
    .select("id");

  if (error) {
    return { error: CREATE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: CREATE_REJECTED };
  }

  revalidatePath("/nodo/projects");
  revalidatePath("/nodo", "layout");
  redirect("/nodo/projects");
}

const JOIN_ERROR = "No pudimos unirte al proyecto. Probá de nuevo.";
const JOIN_REJECTED = "No pudimos unirte al proyecto.";
const JOIN_UNAUTHORIZED = "No autorizado";
const JOIN_TOURIST = "Solo los serranos pueden unirse a proyectos";
const JOIN_NOT_FOUND = "No encontramos ese proyecto.";
const JOIN_INVALID = "Revisá el proyecto e intentá de nuevo.";
const ALREADY_MEMBER = "Ya sos parte de este proyecto.";
const ALREADY_REQUESTED = "Ya enviaste una solicitud.";
/** Composite PK (project_id, profile_id). */
const UNIQUE_VIOLATION = "23505";

/**
 * Self-join a project. Reads projects.ingreso and inserts the matching estado.
 * The RLS WITH CHECK is the real door; this action is ergonomics on top of it.
 */
export async function joinProject(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: JOIN_UNAUTHORIZED };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (!profile || isTasksBlockedTier(profile.tier)) {
    return { error: JOIN_TOURIST };
  }

  const projectId = trimmed(formData.get("projectId"));
  if (!projectId) {
    return { error: JOIN_INVALID };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, ingreso")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { error: JOIN_NOT_FOUND };
  }

  const estado = project.ingreso === "abierto" ? "aprobado" : "pendiente";

  const { data, error } = await supabase
    .from("project_members")
    .insert({
      project_id: project.id,
      profile_id: user.id,
      estado,
    })
    .select("project_id");

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        error: project.ingreso === "abierto" ? ALREADY_MEMBER : ALREADY_REQUESTED,
      };
    }
    return { error: JOIN_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: JOIN_REJECTED };
  }

  revalidatePath(`/nodo/projects/${project.id}`);
  revalidatePath("/nodo/projects");
  revalidatePath("/nodo", "layout");
  return null;
}

const APPROVE_ERROR = "No pudimos aprobar la solicitud. Probá de nuevo.";
const APPROVE_REJECTED = "No pudimos aprobar esta solicitud.";
const REJECT_ERROR = "No pudimos rechazar la solicitud. Probá de nuevo.";
const REJECT_REJECTED = "No pudimos rechazar esta solicitud.";
const QUEUE_UNAUTHORIZED = "No autorizado";
const QUEUE_INVALID = "Revisá la solicitud e intentá de nuevo.";

/**
 * Approve a pending project join request (pendiente → aprobado).
 * Only estado is updated; rol and other projects are never touched.
 * 0-row updates are failures — PostgREST does not error on empty matches.
 */
export async function approveProjectJoin(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: QUEUE_UNAUTHORIZED };
  }

  const projectId = trimmed(formData.get("projectId"));
  const profileId = trimmed(formData.get("profileId"));
  if (!projectId || !profileId) {
    return { error: QUEUE_INVALID };
  }

  const { data, error } = await supabase
    .from("project_members")
    .update({ estado: "aprobado" })
    .eq("project_id", projectId)
    .eq("profile_id", profileId)
    .eq("estado", "pendiente")
    .select("profile_id");

  if (error) {
    return { error: APPROVE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: APPROVE_REJECTED };
  }

  revalidatePath(`/nodo/projects/${projectId}/requests`);
  revalidatePath(`/nodo/projects/${projectId}`);
  revalidatePath("/nodo/projects");
  revalidatePath("/nodo", "layout");
  return null;
}

/**
 * Reject a pending project join request by deleting the pendiente row.
 * No third enum value — the person may request again.
 */
export async function rejectProjectJoin(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: QUEUE_UNAUTHORIZED };
  }

  const projectId = trimmed(formData.get("projectId"));
  const profileId = trimmed(formData.get("profileId"));
  if (!projectId || !profileId) {
    return { error: QUEUE_INVALID };
  }

  const { data, error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("profile_id", profileId)
    .eq("estado", "pendiente")
    .select("profile_id");

  if (error) {
    return { error: REJECT_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: REJECT_REJECTED };
  }

  revalidatePath(`/nodo/projects/${projectId}/requests`);
  revalidatePath(`/nodo/projects/${projectId}`);
  revalidatePath("/nodo/projects");
  revalidatePath("/nodo", "layout");
  return null;
}

const PROMOTE_ERROR = "No pudimos designar admin. Probá de nuevo.";
const PROMOTE_REJECTED = "No pudimos designar admin.";
const PROMOTE_UNAUTHORIZED = "No autorizado";
const PROMOTE_INVALID = "Revisá el miembro e intentá de nuevo.";

/**
 * Promote an approved miembro to project admin. RLS enforces the actor is a
 * project admin; the filter refuses pendiente targets and no-ops on existing admins.
 */
export async function promoteProjectMember(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: PROMOTE_UNAUTHORIZED };
  }

  const projectId = trimmed(formData.get("projectId"));
  const profileId = trimmed(formData.get("profileId"));
  if (!projectId || !profileId) {
    return { error: PROMOTE_INVALID };
  }

  const { data, error } = await supabase
    .from("project_members")
    .update({ rol: "admin" })
    .eq("project_id", projectId)
    .eq("profile_id", profileId)
    .eq("estado", "aprobado")
    .eq("rol", "miembro")
    .select("project_id, profile_id, rol");

  if (error) {
    return { error: PROMOTE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: PROMOTE_REJECTED };
  }

  revalidatePath(`/nodo/projects/${projectId}`);
  revalidatePath(`/nodo/projects/${projectId}/requests`);
  revalidatePath("/nodo/projects");
  revalidatePath("/nodo", "layout");
  return null;
}
