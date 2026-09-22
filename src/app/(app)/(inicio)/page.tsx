import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDayKey, formatEventTimeRange } from "@/features/events/day";
import type { AgendaEvent } from "@/features/events/types";
import { fetchLumaCalendarEvents } from "@/features/events/luma-client";
import {
  internalEventToAgendaItem,
  mergeAgendaListItems,
  takeUpcomingAgendaItems,
} from "@/features/events/luma-normalize";
import { InicioHub } from "@/features/home/InicioHub";
import { upcomingBirthdays, type BirthdayProfileInput } from "@/features/home/birthdays";
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

  const [{ data: events }, { data: profiles }, lumaResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, titulo, descripcion, lugar, inicio, fin, creado_por")
      .gte("inicio", nowIso)
      .order("inicio", { ascending: true })
      .limit(UPCOMING_EVENTS_LIMIT),
    supabase.from("profiles").select(BIRTHDAY_PROFILE_COLUMNS).neq("tier", "tourist"),
    fetchLumaCalendarEvents(),
  ]);

  const internal = ((events ?? []) as AgendaEvent[]).map(internalEventToAgendaItem);
  const luma = lumaResult.ok ? lumaResult.events : [];
  const merged = mergeAgendaListItems(luma, internal);
  const upcoming = takeUpcomingAgendaItems(merged, now, UPCOMING_EVENTS_LIMIT);
  const eventItems = upcoming.map((event) => {
    const day = formatDayKey(new Date(event.inicio));
    const time = formatEventTimeRange(event.inicio, event.fin);
    const timeLabel = day === today ? time : `${day} · ${time}`;
    return {
      id: event.id,
      title: event.title,
      timeLabel,
      place: event.place,
      href: event.href,
    };
  });
  const birthdayRows = upcomingBirthdays((profiles ?? []) as BirthdayProfileInput[], {
    today,
  });

  return <InicioHub events={eventItems} birthdays={birthdayRows} />;
}
