import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/features/events/EventCard";
import {
  formatAgendaDateLabel,
  formatEventDuration,
  formatEventTimeRange,
} from "@/features/events/day";
import { fetchLumaCalendarEvents } from "@/features/events/luma-client";
import { internalEventToAgendaItem, mergeAgendaListItems } from "@/features/events/luma-normalize";
import { buildAgendaSections, parseAgendaVista } from "@/features/events/agenda-view";
import type { AgendaEvent } from "@/features/events/types";
import { SerSerranoCta } from "@/features/membership/SerSerranoCta";
import { resolveSerSerranoCtaVisibility } from "@/features/membership/ser-serrano-cta-server";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const vista = parseAgendaVista((await searchParams).vista);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-text-secondary">Iniciá sesión para ver la agenda.</p>;
  }

  const profileRead = supabase.from("profiles").select("tier").eq("id", user.id).single();

  const [{ data: events }, { data: profile }, lumaResult, showSerSerranoCta] = await Promise.all([
    supabase
      .from("events")
      .select("id, titulo, descripcion, lugar, inicio, fin, creado_por, cover_url")
      .order("inicio", { ascending: true }),
    profileRead,
    fetchLumaCalendarEvents(),
    profileRead.then(({ data }) =>
      resolveSerSerranoCtaVisibility(user.id, {
        client: supabase,
        tier: data?.tier ?? null,
      }),
    ),
  ]);

  const internal = ((events ?? []) as AgendaEvent[]).map(internalEventToAgendaItem);
  const lumaAll = lumaResult.ok ? lumaResult.events : [];
  const list = mergeAgendaListItems(lumaAll, internal);
  const now = new Date();
  const sections = buildAgendaSections(list, { vista, now });
  const hasPast =
    vista === "proximos" && buildAgendaSections(list, { vista: "pasados", now }).length > 0;
  const canCreate = Boolean(profile?.tier && profile.tier !== "tourist");
  const lumaFailed = !lumaResult.ok;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[22px] font-bold text-text-primary">Agenda</h1>
        {canCreate ? (
          <Link
            href="/agenda/new"
            className="inline-flex items-center gap-1 rounded-pill bg-primary px-3 py-2 font-display text-[13px] font-medium text-on-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus className="size-4" aria-hidden />
            Nuevo evento
          </Link>
        ) : null}
      </div>

      {showSerSerranoCta ? <SerSerranoCta /> : null}

      {lumaFailed ? (
        <p className="font-body text-xs text-text-muted" role="status">
          No se pudieron cargar los eventos públicos de Luma. Se muestran solo los de la app.
        </p>
      ) : null}

      <nav aria-label="Vista de la agenda" className="flex gap-2">
        {(
          [
            ["proximos", "Próximos", "/agenda"],
            ["pasados", "Pasados", "/agenda?vista=pasados"],
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

      {sections.length === 0 ? (
        vista === "proximos" ? (
          <EmptyState
            title="No hay eventos próximos"
            subtitle={
              hasPast
                ? "Mirá los que ya pasaron o volvé más adelante."
                : "Todavía no hay eventos en la agenda."
            }
            icon={Calendar}
            href={hasPast ? "/agenda?vista=pasados" : undefined}
            actionLabel={hasPast ? "Ver eventos pasados" : undefined}
          />
        ) : (
          <EmptyState
            title="Todavía no hubo eventos"
            subtitle="Cuando pase el primero, va a quedar acá."
            icon={Calendar}
          />
        )
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((month) => (
            <section
              key={month.key}
              aria-labelledby={`mes-${month.key}`}
              className="flex flex-col gap-4"
            >
              <h2
                id={`mes-${month.key}`}
                className="font-display text-[17px] font-semibold text-text-primary"
              >
                {month.label}
              </h2>
              {month.days.map((day) => (
                <div key={day.key} className="flex flex-col gap-2">
                  <h3 className="font-body text-[13px] font-medium text-text-secondary">
                    {day.label}
                  </h3>
                  {day.items.map((event) => (
                    <EventCard
                      key={event.id}
                      href={event.href}
                      title={event.title}
                      dateLabel={formatAgendaDateLabel(event.inicio)}
                      timeLabel={formatEventTimeRange(event.inicio, event.fin)}
                      durationLabel={formatEventDuration(event.inicio, event.fin)}
                      place={event.place}
                      coverUrl={event.coverUrl}
                      source={event.source}
                    />
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
