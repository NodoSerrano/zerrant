/**
 * Agenda calendar-day helpers.
 * All day keys and bounds are pinned to America/Argentina/Buenos_Aires so
 * CI (UTC) and production match the node's wall clock.
 */

export const AGENDA_TIME_ZONE = "America/Argentina/Buenos_Aires";

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAY_SHORT_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;

type ZoneParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsInZone(date: Date, timeZone: string = AGENDA_TIME_ZONE): ZoneParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Convert a civil date+time in AGENDA_TIME_ZONE to a UTC Date. */
function zonedTimeToUtc(dayKey: string, timeHms: string): Date {
  const [y, mo, d] = dayKey.split("-").map(Number);
  const [hh, mm, ss] = timeHms.split(":").map(Number);
  let utcMs = Date.UTC(y, mo - 1, d, hh, mm, ss);

  // Iterate: correct the guess by the delta between desired civil time and
  // what the zone actually shows for that instant (handles fixed offsets and DST).
  for (let i = 0; i < 3; i += 1) {
    const p = partsInZone(new Date(utcMs));
    const asUtcLike = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const desired = Date.UTC(y, mo - 1, d, hh, mm, ss);
    utcMs += desired - asUtcLike;
  }

  return new Date(utcMs);
}

/** Add N calendar days to a YYYY-MM-DD key (Gregorian, zone-agnostic). */
export function addCalendarDays(dayKey: string, delta: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function isValidCalendarDay(dayKey: string): boolean {
  const [y, m, d] = dayKey.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

function weekdayIndexInAgendaZone(date: Date): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: AGENDA_TIME_ZONE,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[label] ?? 0;
}

/** YYYY-MM-DD for `date` in the agenda timezone. */
export function formatDayKey(date: Date = new Date()): string {
  const p = partsInZone(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Resolve `?dia=` — missing or unparseable falls back to today (agenda TZ). */
export function parseDayKey(value: string | undefined, now: Date = new Date()): string {
  if (!value || !DAY_KEY_RE.test(value) || !isValidCalendarDay(value)) {
    return formatDayKey(now);
  }
  return value;
}

/** Inclusive agenda-TZ midnight → exclusive next midnight, as ISO for PostgREST. */
export function dayBoundsIso(dayKey: string): { startIso: string; endIso: string } {
  const start = zonedTimeToUtc(dayKey, "00:00:00");
  const end = zonedTimeToUtc(addCalendarDays(dayKey, 1), "00:00:00");
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export type StripDay = {
  key: string;
  weekdayShort: string;
  dayNumber: string;
};

/** Consecutive agenda-TZ days starting at `from` (default: now). */
export function buildDayStrip(count: number, from: Date = new Date()): StripDay[] {
  let key = formatDayKey(from);
  const days: StripDay[] = [];

  for (let i = 0; i < count; i += 1) {
    const noon = zonedTimeToUtc(key, "12:00:00");
    days.push({
      key,
      weekdayShort: WEEKDAY_SHORT_ES[weekdayIndexInAgendaZone(noon)],
      dayNumber: String(Number(key.slice(8, 10))),
    });
    key = addCalendarDays(key, 1);
  }

  return days;
}

export function formatEventTimeRange(inicio: string, fin: string | null): string {
  const start = new Date(inicio);
  if (Number.isNaN(start.getTime())) return "";

  const timeFmt = new Intl.DateTimeFormat("es-AR", {
    timeZone: AGENDA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const startLabel = timeFmt.format(start);
  if (!fin) return startLabel;

  const end = new Date(fin);
  if (Number.isNaN(end.getTime())) return startLabel;

  return `${startLabel} – ${timeFmt.format(end)}`;
}

/** HH:MM wall clock in the agenda TZ for an ISO timestamp (edit form prefill). */
export function wallClockHmFromIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: AGENDA_TIME_ZONE,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  });
  const map = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return `${map.hour}:${map.minute}`;
}

/** Prefill bundle for EventForm from an events row. */
export function eventFormDefaultsFromRow(event: {
  titulo: string;
  descripcion: string | null;
  lugar: string | null;
  inicio: string;
  fin: string | null;
}): import("./types").EventFormDefaults {
  return {
    titulo: event.titulo,
    descripcion: event.descripcion ?? "",
    lugar: event.lugar ?? undefined,
    fecha: formatDayKey(new Date(event.inicio)),
    inicio: wallClockHmFromIso(event.inicio),
    fin: event.fin ? wallClockHmFromIso(event.fin) : undefined,
  };
}
