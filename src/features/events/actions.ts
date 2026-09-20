"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EVENT_ATTENDANCE_ESTADOS, type EventAttendanceEstado } from "@/lib/db/events-schema";
import { parseAgendaWallClockIso, validateEventRange } from "./validation";

const CREATE_ERROR = "No pudimos publicar el evento. Probá de nuevo.";
const CREATE_REJECTED = "No pudimos publicar el evento.";
const INVALID_TITULO = "El título no puede estar vacío.";
const INVALID_FECHA = "Indicá la fecha del evento.";
const INVALID_INICIO = "Indicá el inicio del evento.";
const INVALID_DATETIME = "Revisá la fecha y la hora del evento.";
const TOURIST_BLOCKED = "Solo los serranos pueden crear eventos.";
const UPDATE_ERROR = "No pudimos guardar los cambios. Probá de nuevo.";
const UPDATE_REJECTED = "No pudimos guardar los cambios.";
const DELETE_ERROR = "No pudimos eliminar el evento. Probá de nuevo.";
const DELETE_REJECTED = "No pudimos eliminar el evento.";
const MISSING_EVENT = "No encontramos el evento.";
const RSVP_TOURIST_BLOCKED = "Solo los serranos pueden confirmar asistencia.";
const RSVP_ERROR = "No pudimos guardar tu respuesta. Probá de nuevo.";
const RSVP_REJECTED = "No pudimos guardar tu respuesta.";
const INVALID_EVENT = "Falta el evento.";
const INVALID_ESTADO = "Revisá tu respuesta.";

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

export async function updateEvent(
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

  const eventId = trimmed(formData.get("eventId"));
  if (!eventId) {
    return { error: MISSING_EVENT };
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

  // RLS is the authority (creator or platform admin). Zero-row update is a
  // rejection, not a silent success — same discipline as tasks.
  const { data, error } = await supabase
    .from("events")
    .update({
      titulo,
      descripcion,
      lugar,
      inicio: inicioIso,
      fin: finIso,
    })
    .eq("id", eventId)
    .select("id");

  if (error) {
    return { error: UPDATE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: UPDATE_REJECTED };
  }

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${eventId}`);
  redirect(`/agenda/${eventId}`);
}

export async function deleteEvent(
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

  const eventId = trimmed(formData.get("eventId"));
  if (!eventId) {
    return { error: MISSING_EVENT };
  }

  // Real DELETE — events has no estado / soft-delete. Cascade removes
  // event_attendance via the FK story 6.5 declared.
  const { data, error } = await supabase.from("events").delete().eq("id", eventId).select("id");

  if (error) {
    return { error: DELETE_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: DELETE_REJECTED };
  }

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${eventId}`);
  redirect("/agenda");
}

export async function setRsvp(
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
    return { error: RSVP_TOURIST_BLOCKED };
  }

  const eventId = trimmed(formData.get("event_id"));
  if (!eventId) {
    return { error: INVALID_EVENT };
  }

  const estado = oneOf<EventAttendanceEstado>(formData.get("estado"), EVENT_ATTENDANCE_ESTADOS);
  if (!estado) {
    return { error: INVALID_ESTADO };
  }

  const { data, error } = await supabase
    .from("event_attendance")
    .upsert(
      { event_id: eventId, profile_id: user.id, estado },
      { onConflict: "event_id,profile_id" },
    )
    .select("event_id");

  if (error) {
    return { error: RSVP_ERROR };
  }

  if (!data || data.length === 0) {
    return { error: RSVP_REJECTED };
  }

  revalidatePath(`/agenda/${eventId}`);
  revalidatePath("/agenda");
  return null;
}
