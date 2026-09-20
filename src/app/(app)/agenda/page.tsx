import { Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { DayStrip } from "@/features/events/DayStrip";
import { EventCard } from "@/features/events/EventCard";
import {
  buildDayStrip,
  dayBoundsIso,
  formatEventTimeRange,
  parseDayKey,
} from "@/features/events/day";
import type { AgendaEvent } from "@/features/events/types";

const STRIP_LENGTH = 14;

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-text-secondary">Iniciá sesión para ver la agenda.</p>;
  }

  const { dia } = await searchParams;
  const selectedKey = parseDayKey(dia);
  const days = buildDayStrip(STRIP_LENGTH);
  const { startIso, endIso } = dayBoundsIso(selectedKey);

  const { data: events } = await supabase
    .from("events")
    .select("id, titulo, descripcion, lugar, inicio, fin, creado_por")
    .gte("inicio", startIso)
    .lt("inicio", endIso)
    .order("inicio", { ascending: true });

  const list = (events ?? []) as AgendaEvent[];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[22px] font-bold text-text-primary">Agenda</h1>

      <DayStrip days={days} selectedKey={selectedKey} />

      {!list.length ? (
        <EmptyState
          title="No hay eventos"
          subtitle="Parece que todavía no hay eventos para este día."
          icon={Calendar}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((event) => (
            <EventCard
              key={event.id}
              title={event.titulo}
              timeLabel={formatEventTimeRange(event.inicio, event.fin)}
              place={event.lugar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
