import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  RequestCard,
  type RequestCardData,
  type RequestProfileData,
  type RequestScreeningData,
} from "@/components/RequestCard";
import { InterviewNoteForm } from "@/features/admin/InterviewNoteForm";
import { displayName } from "@/features/profile/displayName";
import type { Tier } from "@/features/profile/types";
import Link from "next/link";
import { MEMBERSHIP_REQUEST_ACTIVE_ESTADOS } from "@/features/membership/request-state";
import { PublishInterviewSlotForm } from "@/features/membership/PublishInterviewSlotForm";
import { formatDayKey, formatEventTimeRange } from "@/features/events/day";
import {
  groupEventsByRequest,
  historyEstados,
  lastChangeOf,
  MEMBERSHIP_REQUEST_EVENTS_SELECT,
  parseHistoryFilter,
  parseVista,
  type RequestEventRow,
} from "@/features/membership/request-history";
import { RequestHistoryList, type RequestHistoryItem } from "@/features/admin/RequestHistoryList";

export const dynamic = "force-dynamic";

const SCREENING_SELECT =
  "id, estado, mensaje, created_at, contacto_whatsapp, frecuencia_uso, duracion_visita, aporte_actitud, reunion_disponibilidad, situacion_actual, ocupacion_detalle, entrevista_items, aporte_otro, aporte_mayor, profiles!membership_requests_profile_id_fkey(nombre, apellido, apodo, nombre_visible, avatar_url, tier, id)";

const NOTES_SELECT =
  "id, request_id, author_id, body, created_at, profiles!interview_notes_author_id_fkey(nombre, apellido, apodo, nombre_visible)";

type NoteAuthor = {
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: RequestProfileData["nombre_visible"];
};

type NoteRow = {
  id: string;
  request_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles: NoteAuthor | NoteAuthor[] | null;
};

function noteAuthor(profiles: NoteRow["profiles"]): NoteAuthor | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

function formatNoteDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

type RequestRow = {
  id: string;
  estado: RequestCardData["estado"];
  mensaje: string | null;
  created_at: string;
  contacto_whatsapp: string | null;
  frecuencia_uso: RequestScreeningData["frecuencia_uso"];
  duracion_visita: RequestScreeningData["duracion_visita"];
  aporte_actitud: RequestScreeningData["aporte_actitud"];
  reunion_disponibilidad: string | null;
  situacion_actual: RequestScreeningData["situacion_actual"];
  ocupacion_detalle: string | null;
  entrevista_items: string | null;
  aporte_otro: string | null;
  aporte_mayor: RequestScreeningData["aporte_mayor"];
  profiles: RequestProfileData & { tier: Tier };
};

function toScreening(row: RequestRow): RequestScreeningData {
  return {
    contacto_whatsapp: row.contacto_whatsapp,
    frecuencia_uso: row.frecuencia_uso,
    duracion_visita: row.duracion_visita,
    aporte_actitud: row.aporte_actitud,
    reunion_disponibilidad: row.reunion_disponibilidad,
    situacion_actual: row.situacion_actual,
    ocupacion_detalle: row.ocupacion_detalle,
    entrevista_items: row.entrevista_items,
    aporte_otro: row.aporte_otro,
    aporte_mayor: row.aporte_mayor,
    mensaje: row.mensaje,
  };
}

const HISTORY_SELECT =
  "id, estado, created_at, profiles!membership_requests_profile_id_fkey(nombre, apellido, apodo, nombre_visible, avatar_url, id)";

/** The newest final requests; older history is out of scope until someone needs paging. */
const HISTORY_LIMIT = 100;

type HistoryRow = {
  id: string;
  estado: RequestHistoryItem["estado"];
  created_at: string;
  profiles: RequestProfileData | RequestProfileData[] | null;
};

async function loadEvents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requestIds: string[],
): Promise<{ rows: RequestEventRow[]; error: boolean }> {
  if (requestIds.length === 0) return { rows: [], error: false };
  const { data, error } = await supabase
    .from("membership_request_events")
    .select(MEMBERSHIP_REQUEST_EVENTS_SELECT)
    .in("request_id", requestIds)
    .order("created_at", { ascending: true });
  return { rows: (data ?? []) as RequestEventRow[], error: Boolean(error) };
}

export default async function AdminMembresiasPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; estado?: string }>;
}) {
  const params = await searchParams;
  const vista = parseVista(params.vista);
  const historyFilter = parseHistoryFilter(params.estado);
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { count: pendingCount, data: pendingRequests },
    { count: rolesCount },
    { data: bookings },
    { data: openSlots },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("membership_requests")
      .select(SCREENING_SELECT, { count: "exact" })
      .in("estado", MEMBERSHIP_REQUEST_ACTIVE_ESTADOS)
      .order("created_at", { ascending: false })
      // Tiebreaker: equal created_at would otherwise fall back to physical row
      // order, and an UPDATE (every transition) moves the row to the end.
      .order("id", { ascending: true }),
    supabase
      .from("profile_roles")
      .select("id", { count: "exact", head: true })
      .eq("confirmado", false),
    supabase.from("interview_bookings").select("request_id, interview_slots(starts_at, ends_at)"),
    supabase
      .from("interview_slot_availability")
      .select("id, starts_at, ends_at, booked")
      .eq("booked", false)
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }),
  ]);

  let historyItems: RequestHistoryItem[] = [];
  let historyEventsError = false;
  if (vista === "historial") {
    const { data: historyRows } = await supabase
      .from("membership_requests")
      .select(HISTORY_SELECT)
      .in("estado", historyEstados(historyFilter))
      .order("actualizado_en", { ascending: false })
      .order("id", { ascending: true })
      .limit(HISTORY_LIMIT);
    const rows = (historyRows ?? []) as HistoryRow[];
    const events = await loadEvents(
      supabase,
      rows.map((row) => row.id),
    );
    historyEventsError = events.error;
    const eventsByRequest = groupEventsByRequest(events.rows);
    historyItems = rows.map((row) => {
      const profile = Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles;
      return {
        id: row.id,
        estado: row.estado,
        createdAt: row.created_at,
        name: profile
          ? displayName({
              nombre: profile.nombre,
              apellido: profile.apellido,
              apodo: profile.apodo,
              nombre_visible: profile.nombre_visible ?? "nombre_apellido",
            })
          : "",
        avatarUrl: profile?.avatar_url ?? null,
        events: eventsByRequest.get(row.id) ?? [],
      };
    });
  }

  const bookingByRequest = new Map<string, { starts_at: string; ends_at: string }>();
  for (const row of bookings ?? []) {
    const slot = Array.isArray(row.interview_slots) ? row.interview_slots[0] : row.interview_slots;
    if (slot?.starts_at && slot.ends_at) {
      bookingByRequest.set(row.request_id, { starts_at: slot.starts_at, ends_at: slot.ends_at });
    }
  }

  const requests: RequestCardData[] = (Array.isArray(pendingRequests) ? pendingRequests : [])
    .filter(
      (row): row is RequestRow =>
        row !== null &&
        typeof row === "object" &&
        "profiles" in row &&
        row.profiles !== null &&
        typeof row.profiles === "object",
    )
    .map((row) => ({
      id: row.id,
      estado: row.estado,
      mensaje: row.mensaje,
      created_at: row.created_at,
      screening: toScreening(row),
      booking: bookingByRequest.get(row.id) ?? null,
      profile: {
        id: row.profiles.id,
        nombre: row.profiles.nombre,
        apellido: row.profiles.apellido,
        apodo: row.profiles.apodo,
        nombre_visible: row.profiles.nombre_visible,
        avatar_url: row.profiles.avatar_url,
      } satisfies RequestProfileData,
    }));

  const requestIds = requests.map((request) => request.id);
  let notes: NoteRow[] = [];
  let notesError = false;
  let activeEventsError = false;
  if (vista === "en_curso" && requestIds.length > 0) {
    const [notesResult, events] = await Promise.all([
      supabase
        .from("interview_notes")
        .select(NOTES_SELECT)
        .in("request_id", requestIds)
        .order("created_at", { ascending: true }),
      loadEvents(supabase, requestIds),
    ]);
    notesError = Boolean(notesResult.error);
    notes = (notesResult.data ?? []) as NoteRow[];
    activeEventsError = events.error;
    const eventsByRequest = groupEventsByRequest(events.rows);
    for (const request of requests) {
      request.lastChange = lastChangeOf(eventsByRequest.get(request.id) ?? []);
    }
  }
  const notesByRequest = new Map<string, NoteRow[]>();
  for (const note of notes) {
    const list = notesByRequest.get(note.request_id) ?? [];
    list.push(note);
    notesByRequest.set(note.request_id, list);
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-center gap-3">
          <Link href="/profile" aria-label="Volver al perfil">
            <ChevronLeft className="size-6 text-text-primary" />
          </Link>
          <span className="font-display text-[16px] font-medium text-text-primary">
            Panel de admin
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[3px]">
            <h1 className="font-display text-[22px] font-bold text-text-primary">Miembros</h1>
            <p className="font-body text-[13px] text-text-secondary">
              {vista === "historial"
                ? "Aprobadas y cerradas, con quién, cuándo y por qué"
                : "Turistas esperando ser Serranos"}
            </p>
          </div>
          <div className="rounded-pill bg-coral px-[13px] py-[7px]">
            <span className="font-display text-[14px] font-bold text-on-primary">
              {pendingCount ?? 0}
            </span>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-[14px] bg-surface-inset">
          <div className="rounded-[11px] bg-surface h-[38px] flex-1 flex items-center justify-center shadow-[0_2px_6px_#1a161418]">
            <span className="font-display text-[13px] font-semibold text-text-primary">
              Miembros · {pendingCount ?? 0}
            </span>
          </div>
          <Link
            href="/admin/roles"
            className="rounded-[11px] h-[38px] flex-1 flex items-center justify-center"
          >
            <span className="font-display text-[13px] font-medium text-text-muted">
              Roles · {rolesCount ?? 0}
            </span>
          </Link>
        </div>

        <nav aria-label="Vista de solicitudes" className="flex gap-2">
          {(
            [
              ["en_curso", `En curso · ${pendingCount ?? 0}`, "/admin/membresias"],
              ["historial", "Historial", "/admin/membresias?vista=historial"],
            ] as const
          ).map(([key, label, href]) => (
            <Link
              key={key}
              href={href}
              aria-current={vista === key ? "page" : undefined}
              className={`rounded-pill border px-4 min-h-[36px] flex items-center font-display text-[13px] font-medium ${
                vista === key
                  ? "bg-text-primary border-text-primary text-bg"
                  : "bg-surface border-border text-text-secondary"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {vista === "historial" ? (
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-[16px] font-semibold text-text-primary">
              Historial de solicitudes
            </h2>
            <RequestHistoryList
              items={historyItems}
              filter={historyFilter}
              eventsError={historyEventsError}
              limit={HISTORY_LIMIT}
            />
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-[16px] font-semibold text-text-primary">
                Usuarios pendientes de aprobación
              </h2>
              {activeEventsError ? (
                <p className="font-body text-[13px] text-coral">
                  No pudimos cargar quién hizo el último cambio
                </p>
              ) : null}
              {notesError ? (
                <p className="font-body text-[13px] text-coral">
                  No pudimos cargar las notas internas
                </p>
              ) : null}
              {requests.length === 0 ? (
                <p className="font-body text-[14px] text-text-muted text-center py-8">
                  No hay solicitudes pendientes
                </p>
              ) : (
                requests.map((r) => (
                  <div key={r.id} className="flex flex-col gap-2">
                    <RequestCard request={r} />
                    <div className="rounded-[24px] border border-border bg-surface px-4 py-3 flex flex-col gap-3">
                      <h3 className="font-display text-[13px] font-semibold text-text-primary">
                        Notas internas
                      </h3>
                      {(notesByRequest.get(r.id) ?? []).map((note) => {
                        const author = noteAuthor(note.profiles);
                        const authorName = author
                          ? displayName({
                              nombre: author.nombre,
                              apellido: author.apellido,
                              apodo: author.apodo,
                              nombre_visible: author.nombre_visible ?? "nombre_apellido",
                            })
                          : "Admin";
                        const own = user?.id === note.author_id;
                        return (
                          <div key={note.id} className="flex flex-col gap-1.5">
                            <p className="font-body text-[11px] text-text-muted">
                              {authorName} · {formatNoteDate(note.created_at)}
                            </p>
                            {own ? (
                              <InterviewNoteForm
                                requestId={r.id}
                                noteId={note.id}
                                body={note.body}
                              />
                            ) : (
                              <p className="font-body text-[13px] text-text-secondary whitespace-pre-wrap">
                                {note.body}
                              </p>
                            )}
                          </div>
                        );
                      })}
                      <InterviewNoteForm requestId={r.id} />
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="flex flex-col gap-3 pt-2">
              <h2 className="font-display text-[16px] font-semibold text-text-primary">
                Horarios de entrevista
              </h2>
              <PublishInterviewSlotForm />
              {(openSlots ?? []).filter((slot) => slot.id && slot.starts_at && slot.ends_at)
                .length === 0 ? (
                <p className="font-body text-[13px] text-text-muted">
                  No hay horarios libres publicados.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {(openSlots ?? []).map((slot) =>
                    slot.id && slot.starts_at && slot.ends_at ? (
                      <li key={slot.id} className="font-body text-[13px] text-text-secondary">
                        {formatDayKey(new Date(slot.starts_at))} ·{" "}
                        {formatEventTimeRange(slot.starts_at, slot.ends_at)}
                      </li>
                    ) : null,
                  )}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
