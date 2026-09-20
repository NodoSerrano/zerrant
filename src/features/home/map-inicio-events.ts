import { formatDayKey, formatEventTimeRange } from "@/features/events/day";
import type { AgendaEvent } from "@/features/events/types";
import type { InicioEventItem } from "@/features/home/InicioHub";

/** Map events rows to Inicio list items (date + time label in agenda TZ). */
export function mapInicioEvents(events: AgendaEvent[], now: Date = new Date()): InicioEventItem[] {
  return events.map((event) => {
    const day = formatDayKey(new Date(event.inicio));
    const today = formatDayKey(now);
    const time = formatEventTimeRange(event.inicio, event.fin);
    const timeLabel = day === today ? time : `${day} · ${time}`;
    return {
      id: event.id,
      title: event.titulo,
      timeLabel,
      place: event.lugar,
      href: `/agenda/${event.id}`,
    };
  });
}
