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
import type { AgendaEvent } from "@/features/events/types";
import { SerSerranoCta } from "@/features/membership/SerSerranoCta";
import { resolveSerSerranoCtaVisibility } from "@/features/membership/ser-serrano-cta-server";

export default async function AgendaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-text-secondary">Iniciá sesión para ver la agenda.</p>;
  }

  const [{ data: events }, { data: profile }, lumaResult, showSerSerranoCta] = await Promise.all([
    supabase
      .from("events")
      .select("id, titulo, descripcion, lugar, inicio, fin, creado_por")
      .order("inicio", { ascending: true }),
    supabase.from("profiles").select("tier").eq("id", user.id).single(),
    fetchLumaCalendarEvents(),
    resolveSerSerranoCtaVisibility(user.id),
  ]);

  const internal = ((events ?? []) as AgendaEvent[]).map(internalEventToAgendaItem);
  const lumaAll = lumaResult.ok ? lumaResult.events : [];
  const list = mergeAgendaListItems(lumaAll, internal);
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

      {!list.length ? (
        <EmptyState title="No hay eventos" subtitle="Todavía no hay eventos." icon={Calendar} />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((event) => (
            <EventCard
              key={event.id}
              href={event.href}
              title={event.title}
              dateLabel={formatAgendaDateLabel(event.inicio)}
              timeLabel={formatEventTimeRange(event.inicio, event.fin)}
              durationLabel={formatEventDuration(event.inicio, event.fin)}
              place={event.place}
              coverUrl={event.coverUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
