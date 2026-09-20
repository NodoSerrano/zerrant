"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseAgendaWallClockIso, validateEventRange } from "./validation";

const CREATE_ERROR = "No pudimos publicar el evento. Probá de nuevo.";
const CREATE_REJECTED = "No pudimos publicar el evento.";
const INVALID_TITULO = "El título no puede estar vacío.";
const INVALID_FECHA = "Indicá la fecha del evento.";
const INVALID_INICIO = "Indicá el inicio del evento.";
const INVALID_DATETIME = "Revisá la fecha y la hora del evento.";
const TOURIST_BLOCKED = "Solo los serranos pueden crear eventos.";

function trimmed(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function createEvent(
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

  if (profile?.tier === "tourist") {
    return { error: TOURIST_BLOCKED };
  }

  const titulo = trimmed(formData.get("titulo"));
  if (!titulo) {
    return { error: INVALID_TITULO };
  }

  const fecha = trimmed(formData.get("fecha"));
  if (!fecha) {
    return { error: INVALID_FECHA };
  }

  const inicioHm = trimmed(formData.get("inicio"));
  if (!inicioHm) {
    return { error: INVALID_INICIO };
  }

  const finHm = trimmed(formData.get("fin"));
  const descripcion = trimmed(formData.get("descripcion"));
  const lugar = trimmed(formData.get("lugar"));

  const inicioIso = parseAgendaWallClockIso(fecha, inicioHm);
  if (!inicioIso) {
    return { error: INVALID_DATETIME };
  }

  let finIso: string | null = null;
  if (finHm) {
    finIso = parseAgendaWallClockIso(fecha, finHm);
    if (!finIso) {
      return { error: INVALID_DATETIME };
    }
  }

  const range = validateEventRange({ inicio: inicioIso, fin: finIso });
  if (!range.ok) {
    return { error: range.error };
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      titulo,
      descripcion,
      lugar,
      inicio: inicioIso,
      fin: finIso,
      creado_por: user.id,
    })
    .select("id");

  if (error) {
    return { error: CREATE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: CREATE_REJECTED };
  }

  revalidatePath("/agenda");
  redirect(`/agenda?dia=${fecha}`);
}
