"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskCategoria, TaskUpdate, TaskUrgencia } from "./types";

const CANCEL_ERROR = "No pudimos cancelar la tarea. Probá de nuevo.";
const UPDATE_ERROR = "No pudimos guardar los cambios. Probá de nuevo.";
// When the filters match no rows, PostgREST doesn't return an error: the
// update simply touches nothing. Without telling that case apart, the action
// redirects as if it had worked.
const CANCEL_REJECTED = "No pudimos cancelar esta tarea.";
const UPDATE_REJECTED = "No pudimos guardar los cambios.";
const INVALID_INPUT = "Revisá los datos de la tarea.";

const CATEGORIAS: TaskCategoria[] = ["reparacion", "limpieza", "compra", "mantenimiento", "otro"];
const URGENCIAS: TaskUrgencia[] = ["baja", "media", "alta"];

// States from which cancelling still makes sense. A `hecha` or `verificada`
// task was already worked on: cancelling it would erase the record of that work.
const CANCELABLE_ESTADOS = ["abierta", "tomada"] as const;

function trimmed(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Validates against the enum list instead of blindly casting. */
function oneOf<T extends string>(value: FormDataEntryValue | null, allowed: T[]): T | null {
  return typeof value === "string" && (allowed as string[]).includes(value) ? (value as T) : null;
}

export async function createTask(_prevState: { error: string } | null, formData: FormData) {
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

  if (!profile || profile.tier === "tourist") {
    return { error: "Solo los serranos pueden crear tareas" };
  }

  const { error } = await supabase.from("tasks").insert({
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    categoria: formData.get("categoria") as TaskCategoria,
    urgencia: formData.get("urgencia") as TaskUrgencia,
    creado_por: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/nodo", "layout");
  redirect("/nodo/tasks");
}

export async function takeTask(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const taskId = formData.get("taskId") as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (!profile || profile.tier === "tourist") {
    return { error: "Solo los serranos pueden tomar tareas" };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ estado: "tomada", tomada_por: user.id })
    .eq("id", taskId)
    .eq("estado", "abierta");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/nodo", "layout");
  redirect(`/nodo/tasks/${taskId}`);
}

export async function markTaskDone(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const taskId = formData.get("taskId") as string;

  const { error } = await supabase
    .from("tasks")
    .update({ estado: "hecha" })
    .eq("id", taskId)
    .eq("tomada_por", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/nodo", "layout");
  redirect(`/nodo/tasks/${taskId}`);
}

export async function verifyTask(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const taskId = formData.get("taskId") as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) {
    return { error: "Solo un admin puede verificar tareas" };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ estado: "verificada" })
    .eq("id", taskId)
    .eq("estado", "hecha");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/nodo", "layout");
  redirect(`/nodo/tasks/${taskId}`);
}

export async function cancelTask(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const taskId = trimmed(formData.get("taskId"));

  if (!taskId) {
    return { error: "No autorizado" };
  }

  // The three filters are the guard: only the creator, only this task, and
  // only from a cancelable state. The RLS policy alone isn't enough — it also
  // lets whoever took the task write.
  // `tomada_por` is preserved: the state already says it's cancelled, and
  // erasing who had it would lose the trail of work someone agreed to do.
  const { data, error } = await supabase
    .from("tasks")
    .update({ estado: "cancelada" })
    .eq("id", taskId)
    .eq("creado_por", user.id)
    .in("estado", [...CANCELABLE_ESTADOS])
    .select("id");

  if (error) {
    return { error: CANCEL_ERROR };
  }

  // Zero rows = the filters rejected the operation (not the user's task, or no
  // longer in a cancelable state). Not a database error, but not a success either.
  if (!data || data.length === 0) {
    return { error: CANCEL_REJECTED };
  }

  revalidatePath("/nodo", "layout");
  redirect(`/nodo/tasks/${taskId}`);
}

export async function updateTask(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const taskId = trimmed(formData.get("taskId"));

  if (!taskId) {
    return { error: "No autorizado" };
  }

  const titulo = trimmed(formData.get("titulo"));

  // `titulo` is NOT NULL but accepts the empty string, so without this check
  // the HTML `required` is the only defense.
  if (!titulo) {
    return { error: "El título no puede estar vacío" };
  }

  const categoria = oneOf(formData.get("categoria"), CATEGORIAS);
  const urgencia = oneOf(formData.get("urgencia"), URGENCIAS);

  if (!categoria || !urgencia) {
    return { error: INVALID_INPUT };
  }

  const cambios: TaskUpdate = { titulo, categoria, urgencia };

  // A partial submit shouldn't wipe the description that was already there: the
  // column is only touched if the field came in the form.
  if (formData.has("descripcion")) {
    cambios.descripcion = trimmed(formData.get("descripcion"));
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(cambios)
    .eq("id", taskId)
    // Without this filter, whoever took the task could rewrite its text: the
    // RLS policy and the column grant allow it.
    .eq("creado_por", user.id)
    // Once taken, changing its scope changes the taker's work without
    // warning; hecha or verificada, rewriting it breaks the record.
    .eq("estado", "abierta")
    .select("id");

  if (error) {
    return { error: UPDATE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: UPDATE_REJECTED };
  }

  revalidatePath("/nodo", "layout");
  redirect(`/nodo/tasks/${taskId}`);
}
