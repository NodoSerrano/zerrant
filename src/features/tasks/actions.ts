"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isTasksBlockedTier } from "./tier-guards";
import { parseCategorias } from "./categorias";
import type { TaskUpdate, TaskUrgencia } from "./types";
import { withActionNotice } from "@/lib/action-notice";

const CANCEL_ERROR = "No pudimos cancelar la tarea. Probá de nuevo.";
const UPDATE_ERROR = "No pudimos guardar los cambios. Probá de nuevo.";
const CREATE_ERROR = "No pudimos publicar la tarea. Probá de nuevo.";
const TAKE_ERROR = "No pudimos tomar la tarea. Probá de nuevo.";
const RELEASE_ERROR = "No pudimos liberar la tarea. Probá de nuevo.";
const ASSIGN_ERROR = "No pudimos asignar la tarea. Probá de nuevo.";
const MARK_DONE_ERROR = "No pudimos marcar la tarea como hecha. Probá de nuevo.";
const VERIFY_ERROR = "No pudimos verificar la tarea. Probá de nuevo.";
// When the filters match no rows, PostgREST doesn't return an error: the
// update simply touches nothing. Without telling that case apart, the action
// redirects as if it had worked.
const CANCEL_REJECTED = "No pudimos cancelar esta tarea.";
const UPDATE_REJECTED = "No pudimos guardar los cambios.";
const TAKE_REJECTED = "No pudimos tomar esta tarea.";
const RELEASE_REJECTED = "No pudimos liberar esta tarea.";
const ASSIGN_REJECTED = "No pudimos asignar esta tarea.";
const ASSIGN_FORBIDDEN = "No podés asignar esta tarea.";
const ASSIGNEE_BLOCKED = "Solo se puede asignar a un serrano.";
const ASSIGN_INPUT = "Revisá a quién asignás la tarea.";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidField(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && UUID_RE.test(value) ? value : null;
}

function isRlsDenied(error: { code?: string }): boolean {
  return error.code === "42501";
}
const MARK_DONE_REJECTED = "No pudimos marcar la tarea como hecha.";
const VERIFY_REJECTED = "No pudimos verificar esta tarea.";
const INVALID_INPUT = "Revisá los datos de la tarea.";

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

  if (!profile || isTasksBlockedTier(profile.tier)) {
    return { error: "Solo los serranos pueden crear tareas" };
  }

  const titulo = trimmed(formData.get("titulo"));

  if (!titulo) {
    return { error: "El título no puede estar vacío" };
  }

  const parsed = parseCategorias(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const urgencia = oneOf(formData.get("urgencia"), URGENCIAS);

  if (!urgencia) {
    return { error: INVALID_INPUT };
  }

  const descripcion = formData.has("descripcion") ? trimmed(formData.get("descripcion")) : null;

  const { error } = await supabase.from("tasks").insert({
    titulo,
    descripcion,
    categorias: parsed.categorias,
    categoria_otra: parsed.categoriaOtra,
    urgencia,
    creado_por: user.id,
  });

  if (error) {
    return { error: CREATE_ERROR };
  }

  revalidatePath("/nodo", "layout");
  redirect(withActionNotice("/nodo/tasks", "tarea-creada"));
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

  if (!profile || isTasksBlockedTier(profile.tier)) {
    return { error: "Solo los serranos pueden tomar tareas" };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ estado: "tomada", tomada_por: user.id })
    .eq("id", taskId)
    .eq("estado", "abierta")
    .select("id");

  if (error) {
    return { error: TAKE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: TAKE_REJECTED };
  }

  revalidatePath("/nodo", "layout");
  redirect(withActionNotice(`/nodo/tasks/${taskId}`, "tarea-tomada"));
}

export async function releaseTask(_prevState: { error: string } | null, formData: FormData) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (!profile || isTasksBlockedTier(profile.tier)) {
    return { error: "Solo los serranos pueden liberar tareas" };
  }

  // Row filters are not the authorization check. A caller who is not the
  // taker, the creator, or an admin is rejected in the database (42501).
  const { data, error } = await supabase
    .from("tasks")
    .update({ tomada_por: null, estado: "abierta" })
    .eq("id", taskId)
    .eq("estado", "tomada")
    .select("id");

  if (error) {
    return { error: isRlsDenied(error) ? RELEASE_REJECTED : RELEASE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: RELEASE_REJECTED };
  }

  revalidatePath("/nodo", "layout");
  redirect(withActionNotice(`/nodo/tasks/${taskId}`, "tarea-liberada"));
}

export async function assignTask(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const taskId = trimmed(formData.get("taskId"));
  // tomada_por from the client is ignored. The only assignee input is assigneeId.
  const assigneeId = uuidField(formData.get("assigneeId"));

  if (!taskId || !assigneeId) {
    return { error: ASSIGN_INPUT };
  }

  const { data: caller } = await supabase
    .from("profiles")
    .select("tier, is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!caller || isTasksBlockedTier(caller.tier)) {
    return { error: "Solo los serranos pueden asignar tareas" };
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("creado_por")
    .eq("id", taskId)
    .single();

  if (!task || (task.creado_por !== user.id && !caller.is_platform_admin)) {
    return { error: ASSIGN_FORBIDDEN };
  }

  const { data: assignee, error: assigneeError } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", assigneeId)
    .single();

  if (assigneeError || !assignee) {
    return { error: "No encontramos a esa persona." };
  }

  if (isTasksBlockedTier(assignee.tier)) {
    return { error: ASSIGNEE_BLOCKED };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ estado: "tomada", tomada_por: assigneeId })
    .eq("id", taskId)
    .in("estado", ["abierta", "tomada"])
    .select("id");

  if (error) {
    return { error: isRlsDenied(error) ? ASSIGN_REJECTED : ASSIGN_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: ASSIGN_REJECTED };
  }

  revalidatePath("/nodo", "layout");
  redirect(withActionNotice(`/nodo/tasks/${taskId}`, "tarea-asignada"));
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

  const { data, error } = await supabase
    .from("tasks")
    .update({ estado: "hecha" })
    .eq("id", taskId)
    .eq("tomada_por", user.id)
    .eq("estado", "tomada")
    .select("id");

  if (error) {
    return { error: MARK_DONE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: MARK_DONE_REJECTED };
  }

  revalidatePath("/nodo", "layout");
  redirect(withActionNotice(`/nodo/tasks/${taskId}`, "tarea-completada"));
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

  const { data, error } = await supabase
    .from("tasks")
    .update({ estado: "verificada" })
    .eq("id", taskId)
    .eq("estado", "hecha")
    .select("id");

  if (error) {
    return { error: VERIFY_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: VERIFY_REJECTED };
  }

  revalidatePath("/nodo", "layout");
  redirect(withActionNotice(`/nodo/tasks/${taskId}`, "tarea-verificada"));
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
  redirect(withActionNotice(`/nodo/tasks/${taskId}`, "tarea-cancelada"));
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

  const parsed = parseCategorias(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const urgencia = oneOf(formData.get("urgencia"), URGENCIAS);

  if (!urgencia) {
    return { error: INVALID_INPUT };
  }

  // categoria_otra always travels with categorias: unchecking Otro clears its text.
  const cambios: TaskUpdate = {
    titulo,
    categorias: parsed.categorias,
    categoria_otra: parsed.categoriaOtra,
    urgencia,
  };

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
  redirect(withActionNotice(`/nodo/tasks/${taskId}`, "tarea-actualizada"));
}
