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
