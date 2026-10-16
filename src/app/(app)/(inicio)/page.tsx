import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatAgendaDateLabel,
  formatDayKey,
  formatEventDuration,
  formatEventTimeRange,
} from "@/features/events/day";
import type { AgendaEvent } from "@/features/events/types";
import { fetchLumaCalendarEvents } from "@/features/events/luma-client";
import {
  internalEventToAgendaItem,
  mergeAgendaListItems,
  takeUpcomingAgendaItems,
} from "@/features/events/luma-normalize";
import { InicioHub } from "@/features/home/InicioHub";
import { recentMemberConfirmation } from "@/features/membership/member-confirmed";
import { upcomingBirthdays, type BirthdayProfileInput } from "@/features/home/birthdays";
import { resolveSerSerranoCtaVisibility } from "@/features/membership/ser-serrano-cta-server";
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
  const viewerIsTourist = profile?.tier === "tourist";

  const [
    { data: events },
    birthdayProfiles,
    lumaResult,
    { data: approvedRequest },
    showSerSerranoCta,
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id, titulo, descripcion, lugar, inicio, fin, creado_por")
      .gte("inicio", nowIso)
      .order("inicio", { ascending: true })
      .limit(UPCOMING_EVENTS_LIMIT),
    viewerIsTourist
      ? Promise.resolve({ data: null })
      : supabase.from("profiles").select(BIRTHDAY_PROFILE_COLUMNS).neq("tier", "tourist"),
    fetchLumaCalendarEvents(),
    recentMemberConfirmation(supabase, userId, now),
    resolveSerSerranoCtaVisibility(userId, {
      client: supabase,
      tier: profile?.tier ?? null,
    }),
  ]);
  const profiles = birthdayProfiles.data;

  const internal = ((events ?? []) as AgendaEvent[]).map(internalEventToAgendaItem);
  const luma = lumaResult.ok ? lumaResult.events : [];
  const merged = mergeAgendaListItems(luma, internal);
  const upcoming = takeUpcomingAgendaItems(merged, now, UPCOMING_EVENTS_LIMIT);
  const eventItems = upcoming.map((event) => {
    const time = formatEventTimeRange(event.inicio, event.fin);
    return {
      id: event.id,
      title: event.title,
      dateLabel: formatAgendaDateLabel(event.inicio),
      timeLabel: time,
      durationLabel: formatEventDuration(event.inicio, event.fin),
      place: event.place,
      href: event.href,
      coverUrl: event.coverUrl,
    };
  });
  const birthdayRows = upcomingBirthdays((profiles ?? []) as BirthdayProfileInput[], {
    today,
  });

  const showCommunityHub = Boolean(profile && profile.tier !== "tourist");

  return (
    <InicioHub
      events={eventItems}
      birthdays={birthdayRows}
      showCommunityHub={showCommunityHub}
      showBirthdays={!viewerIsTourist}
      showSerSerranoCta={showSerSerranoCta}
      memberConfirmed={Boolean(approvedRequest)}
    />
  );
}
