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
