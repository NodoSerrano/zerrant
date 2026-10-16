import {
  formatAgendaDateLabel,
  formatEventDuration,
  formatEventTimeRange,
} from "@/features/events/day";
import type { AgendaEvent } from "@/features/events/types";
import type { InicioEventItem } from "@/features/home/InicioHub";

/** Map events rows to Inicio list items (date + time label in agenda TZ). */
export function mapInicioEvents(events: AgendaEvent[], _now: Date = new Date()): InicioEventItem[] {
  return events.map((event) => {
    const time = formatEventTimeRange(event.inicio, event.fin);
    return {
      id: event.id,
      title: event.titulo,
      dateLabel: formatAgendaDateLabel(event.inicio),
      timeLabel: time,
      durationLabel: formatEventDuration(event.inicio, event.fin),
      place: event.lugar,
      href: `/agenda/${event.id}`,
      coverUrl: null,
    };
  });
}
