"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskCategoria, TaskUrgencia } from "./types";

const CANCEL_ERROR = "No pudimos cancelar la tarea. Probá de nuevo.";
const UPDATE_ERROR = "No pudimos guardar los cambios. Probá de nuevo.";

// Estados desde los que todavía tiene sentido cancelar. Una tarea `hecha` o
// `verificada` ya se trabajó: cancelarla borraría el registro de ese trabajo.
const CANCELABLE_ESTADOS = ["abierta", "tomada"] as const;

function trimmed(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

  // Los tres filtros son la guarda: sólo el creador, sólo esta tarea, y sólo
  // desde un estado cancelable. La policy de RLS no alcanza — deja escribir
  // también a quien la tomó.
  const { error } = await supabase
    .from("tasks")
    .update({ estado: "cancelada", tomada_por: null })
    .eq("id", taskId)
    .eq("creado_por", user.id)
    .in("estado", [...CANCELABLE_ESTADOS]);

  if (error) {
    return { error: CANCEL_ERROR };
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

  // `titulo` es NOT NULL pero acepta la cadena vacía, así que sin este chequeo
  // el `required` del HTML es la única defensa.
  if (!titulo) {
    return { error: "El título no puede estar vacío" };
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      titulo,
      descripcion: trimmed(formData.get("descripcion")),
      categoria: formData.get("categoria") as TaskCategoria,
      urgencia: formData.get("urgencia") as TaskUrgencia,
    })
    .eq("id", taskId)
    // Sin este filtro, quien tomó la tarea puede reescribirle el texto: la
    // policy de RLS y el grant por columna se lo permiten.
    .eq("creado_por", user.id);

  if (error) {
    return { error: UPDATE_ERROR };
  }

  revalidatePath("/nodo", "layout");
  redirect(`/nodo/tasks/${taskId}`);
}
