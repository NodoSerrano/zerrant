import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDayKey } from "@/features/events/day";
import type { AgendaEvent } from "@/features/events/types";
import { InicioHub } from "@/features/home/InicioHub";
import { upcomingBirthdays, type BirthdayProfileInput } from "@/features/home/birthdays";
import { mapInicioEvents } from "@/features/home/map-inicio-events";

const UPCOMING_EVENTS_LIMIT = 8;
const BIRTHDAY_PROFILE_COLUMNS =
  "id, nombre, apellido, apodo, nombre_visible, fecha_nacimiento, avatar_url, tier";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const today = formatDayKey(now);

  const [{ data: events }, { data: profiles }] = await Promise.all([
    supabase
      .from("events")
      .select("id, titulo, descripcion, lugar, inicio, fin, creado_por")
      .gte("inicio", nowIso)
      .order("inicio", { ascending: true })
      .limit(UPCOMING_EVENTS_LIMIT),
    supabase.from("profiles").select(BIRTHDAY_PROFILE_COLUMNS).neq("tier", "tourist"),
  ]);

  const eventItems = mapInicioEvents((events ?? []) as AgendaEvent[], now);
  const birthdayRows = upcomingBirthdays((profiles ?? []) as BirthdayProfileInput[], {
    today,
  });

  return <InicioHub events={eventItems} birthdays={birthdayRows} />;
}
