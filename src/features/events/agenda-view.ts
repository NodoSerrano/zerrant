/**
 * ZER-157: the agenda as one vertical list grouped by month and day, split
 * into upcoming and past. Day boundaries follow the agenda time zone.
 */

import { addCalendarDays, formatDayKey, WEEKDAY_SHORT_ES } from "./day";
import type { AgendaListItem } from "./luma-normalize";

export type AgendaVista = "proximos" | "pasados";

export function parseAgendaVista(raw: string | undefined): AgendaVista {
  return raw === "pasados" ? "pasados" : "proximos";
}

export type AgendaDay = { key: string; label: string; items: AgendaListItem[] };
export type AgendaMonth = { key: string; label: string; days: AgendaDay[] };

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
const MONTHS_LONG = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function spelledDay(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${WEEKDAY_SHORT_ES[weekday]} ${d} ${MONTHS_SHORT[m - 1]}`;
}

function dayLabel(dayKey: string, todayKey: string): string {
  const spelled = spelledDay(dayKey);
  if (dayKey === todayKey) return `Hoy · ${spelled}`;
  if (dayKey === addCalendarDays(todayKey, 1)) return `Mañana · ${spelled}`;
  if (dayKey === addCalendarDays(todayKey, -1)) return `Ayer · ${spelled}`;
  return spelled;
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

/** An event still counts as upcoming until it ends (or starts, if it has no end). */
function isUpcoming(item: AgendaListItem, nowMs: number): boolean {
  const end = Date.parse(item.fin ?? item.inicio);
  return !Number.isNaN(end) && end >= nowMs;
}

export function buildAgendaSections(
  items: AgendaListItem[],
  { vista, now }: { vista: AgendaVista; now: Date },
): AgendaMonth[] {
  const nowMs = now.getTime();
  const direction = vista === "proximos" ? 1 : -1;
  const selected = items
    .filter((item) => !Number.isNaN(Date.parse(item.inicio)))
    .filter((item) => isUpcoming(item, nowMs) === (vista === "proximos"))
    .sort((a, b) => direction * (Date.parse(a.inicio) - Date.parse(b.inicio)));

  const todayKey = formatDayKey(now);
  const months: AgendaMonth[] = [];
  for (const item of selected) {
    const dayKey = formatDayKey(new Date(item.inicio));
    const monthKey = dayKey.slice(0, 7);
    let month = months.at(-1);
    if (month?.key !== monthKey) {
      month = { key: monthKey, label: monthLabel(monthKey), days: [] };
      months.push(month);
    }
    let day = month.days.at(-1);
    if (day?.key !== dayKey) {
      day = { key: dayKey, label: dayLabel(dayKey, todayKey), items: [] };
      month.days.push(day);
    }
    day.items.push(item);
  }
  return months;
}
