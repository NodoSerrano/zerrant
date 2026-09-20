import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/features/profile/displayName";
import { isEventAttendanceEstado } from "@/lib/db/events-schema";
import { EventDetail } from "@/features/events/EventDetail";
import type { EventAttendee, EventCreator } from "@/features/events/types";

const EVENT_SELECT = "id, titulo, descripcion, lugar, inicio, fin, creado_por";
const PROFILE_SELECT = "id, nombre, apellido, apodo, nombre_visible, avatar_url";
const FALLBACK_NAME = "Miembro";

type ProfileLite = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: Parameters<typeof displayName>[0]["nombre_visible"] | null;
  avatar_url: string | null;
};

function nameOf(profile: ProfileLite): string {
  return (
    displayName({
      nombre: profile.nombre,
      apellido: profile.apellido,
      apodo: profile.apodo,
      nombre_visible: profile.nombre_visible ?? "nombre_apellido",
    }) || FALLBACK_NAME
  );
}

function toCreator(profile: ProfileLite | undefined, fallbackId: string): EventCreator {
  if (!profile) {
    return { profileId: fallbackId, name: FALLBACK_NAME, avatarUrl: null };
  }
  return {
    profileId: profile.id,
    name: nameOf(profile),
    avatarUrl: profile.avatar_url,
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-text-secondary">Iniciá sesión para ver el evento.</p>;
  }

  const { data: event } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  const { data: attendanceRows } = await supabase
    .from("event_attendance")
    .select("profile_id, estado")
    .eq("event_id", id);

  const attendance = attendanceRows ?? [];
  const profileIds = [...new Set([event.creado_por, ...attendance.map((row) => row.profile_id)])];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .in("id", profileIds);

  const profiles = new Map((profileRows ?? []).map((row) => [row.id, row as ProfileLite]));

  const attendees: EventAttendee[] = [];
  for (const row of attendance) {
    if (!isEventAttendanceEstado(row.estado)) continue;
    const profile = profiles.get(row.profile_id);
    if (!profile) continue;
    attendees.push({
      profileId: profile.id,
      name: nameOf(profile),
      avatarUrl: profile.avatar_url,
      estado: row.estado,
    });
  }

  return (
    <EventDetail
      titulo={event.titulo}
      descripcion={event.descripcion}
      lugar={event.lugar}
      inicio={event.inicio}
      fin={event.fin}
      creator={toCreator(profiles.get(event.creado_por), event.creado_por)}
      attendees={attendees}
    />
  );
}
