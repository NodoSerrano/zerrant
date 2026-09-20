/**
 * Local calendar-day helpers for the agenda strip.
 * Keys are always YYYY-MM-DD in the runtime local timezone.
 */

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Resolve `?dia=` — missing or unparseable falls back to today. */
export function parseDayKey(value: string | undefined, now: Date = new Date()): string {
  if (!value || !DAY_KEY_RE.test(value)) return formatDayKey(now);

  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime()) || formatDayKey(dt) !== value) {
    return formatDayKey(now);
  }
  return value;
}

/** Inclusive local midnight → exclusive next midnight, as ISO for PostgREST. */
export function dayBoundsIso(dayKey: string): { startIso: string; endIso: string } {
  const [y, m, d] = dayKey.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export type StripDay = {
  key: string;
  weekdayShort: string;
  dayNumber: string;
};

const WEEKDAY_SHORT_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;

/** Consecutive local days starting at `from` (default: today). */
export function buildDayStrip(count: number, from: Date = new Date()): StripDay[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const days: StripDay[] = [];

  for (let i = 0; i < count; i += 1) {
    const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    days.push({
      key: formatDayKey(dt),
      weekdayShort: WEEKDAY_SHORT_ES[dt.getDay()],
      dayNumber: String(dt.getDate()),
    });
  }

  return days;
}

export function formatEventTimeRange(inicio: string, fin: string | null): string {
  const start = new Date(inicio);
  if (Number.isNaN(start.getTime())) return "";

  const timeFmt = new Intl.DateTimeFormat("es-AR", {
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
