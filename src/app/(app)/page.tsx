import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDayKey } from "@/features/events/day";
import type { AgendaEvent } from "@/features/events/types";
import { InicioHub } from "@/features/home/InicioHub";
import { upcomingBirthdays, type BirthdayProfileInput } from "@/features/home/birthdays";
import { mapInicioEvents } from "@/features/home/map-inicio-events";
import { NO_ROWS, resolveOnboardingRedirect } from "@/features/profile/onboarding-gate";
import { getOnboardingGateProfile } from "@/features/profile/onboarding-gate-server";

const UPCOMING_EVENTS_LIMIT = 8;
const BIRTHDAY_PROFILE_COLUMNS =
  "id, nombre, apellido, apodo, nombre_visible, fecha_nacimiento, avatar_url, tier";

export default async function InicioPage() {
  // Explicit root gate (AC2 / NFR27). (app)/template also enforces this, but `/`
  // used to own the gate in src/app/page.tsx — keep the same contract on the page.
  const { profile, error, userId } = await getOnboardingGateProfile();

  if (!userId) {
    redirect("/auth/login");
  }

  // Soft-allow on infra errors — fall through to hub (same as former root page).
  if (error && error.code !== NO_ROWS) {
    // still render hub; do not lock into onboarding on transient profile read failure
  } else {
    const onboardingTarget = resolveOnboardingRedirect(profile, "/");
    if (onboardingTarget) {
      redirect(onboardingTarget);
    }
  }

  const supabase = await createClient();
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
