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
const INVALID_COVER = "La imagen tiene que ser una URL https.";
const TOURIST_BLOCKED = "Solo los serranos pueden crear eventos.";
const UPDATE_ERROR = "No pudimos guardar los cambios. Probá de nuevo.";
const UPDATE_REJECTED = "No pudimos guardar los cambios.";
const UPDATE_FORBIDDEN = "No podés modificar este evento.";
const DELETE_ERROR = "No pudimos eliminar el evento. Probá de nuevo.";
const DELETE_REJECTED = "No pudimos eliminar el evento.";
const DELETE_FORBIDDEN = "No podés eliminar este evento.";
const MISSING_EVENT = "No encontramos el evento.";
const RSVP_TOURIST_BLOCKED = "Solo los serranos pueden confirmar asistencia.";
const RSVP_ERROR = "No pudimos guardar tu respuesta. Probá de nuevo.";
const RSVP_REJECTED = "No pudimos guardar tu respuesta.";
const INVALID_EVENT = "Falta el evento.";
const INVALID_ESTADO = "Revisá tu respuesta.";

function trimmed(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function coverUrlFromForm(value: string | null): { ok: true; url: string | null } | { ok: false } {
  if (!value) return { ok: true, url: null };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false };
  }
  if (url.protocol !== "https:") return { ok: false };
  return { ok: true, url: url.toString() };
}

type EventWriter = Awaited<ReturnType<typeof createClient>>;

/** Creator or platform admin. Anyone else gets `forbidden` and no write. */
async function assertCanManageEvent(
  supabase: EventWriter,
  userId: string,
  eventId: string,
  messages: { read: string; forbidden: string },
): Promise<{ error: string } | null> {
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("creado_por")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) return { error: messages.read };
  if (!event) return { error: MISSING_EVENT };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", userId)
    .single();

  const isCreator = event.creado_por === userId;
  const isPlatformAdmin = profile?.is_platform_admin === true;
  if (!isCreator && !isPlatformAdmin) return { error: messages.forbidden };
  return null;
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

  let coverUrl: string | null = null;
  if (formData.has("cover_url")) {
    const cover = coverUrlFromForm(trimmed(formData.get("cover_url")));
    if (!cover.ok) return { error: INVALID_COVER };
    coverUrl = cover.url;
  }

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
      ...(coverUrl ? { cover_url: coverUrl } : {}),
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

  const denied = await assertCanManageEvent(supabase, user.id, eventId, {
    read: UPDATE_ERROR,
    forbidden: UPDATE_FORBIDDEN,
  });
  if (denied) return denied;

  const titulo = trimmed(formData.get("titulo"));
  if (!titulo) {
    return { error: INVALID_TITULO };
  }

  const patch: {
    titulo: string;
    descripcion?: string | null;
    lugar?: string | null;
    inicio?: string;
    fin?: string | null;
    cover_url?: string | null;
  } = { titulo };

  if (formData.has("descripcion")) {
    patch.descripcion = trimmed(formData.get("descripcion"));
  }
  if (formData.has("lugar")) {
    patch.lugar = trimmed(formData.get("lugar"));
  }
  if (formData.has("cover_url")) {
    const cover = coverUrlFromForm(trimmed(formData.get("cover_url")));
    if (!cover.ok) return { error: INVALID_COVER };
    patch.cover_url = cover.url;
  }

  const touchesSchedule = formData.has("fecha") || formData.has("inicio") || formData.has("fin");
  if (touchesSchedule) {
    const fecha = trimmed(formData.get("fecha"));
    if (!fecha) return { error: INVALID_FECHA };

    const inicioHm = trimmed(formData.get("inicio"));
    if (!inicioHm) return { error: INVALID_INICIO };

    const finHm = trimmed(formData.get("fin"));
    const inicioIso = parseAgendaWallClockIso(fecha, inicioHm);
    if (!inicioIso) return { error: INVALID_DATETIME };

    let finIso: string | null = null;
    if (finHm) {
      finIso = parseAgendaWallClockIso(fecha, finHm);
      if (!finIso) return { error: INVALID_DATETIME };
    }

    const range = validateEventRange({ inicio: inicioIso, fin: finIso });
    if (!range.ok) return { error: range.error };

    patch.inicio = inicioIso;
    patch.fin = finIso;
  }

  // Zero-row update is a rejection, not a silent success.
  const { data, error } = await supabase
    .from("events")
    .update(patch)
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

  const denied = await assertCanManageEvent(supabase, user.id, eventId, {
    read: DELETE_ERROR,
    forbidden: DELETE_FORBIDDEN,
  });
  if (denied) return denied;

  // Real DELETE. Attendance rows go with the event through the FK.
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
