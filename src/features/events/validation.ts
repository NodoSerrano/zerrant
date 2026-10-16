import { AGENDA_TIME_ZONE } from "./day";

export type EventRangeInput = {
  inicio: string;
  fin: string | null;
};

export type EventRangeResult = { ok: true } | { ok: false; error: string };

const RANGE_ERROR = "La hora de fin no puede ser anterior al inicio.";
const PARSE_ERROR = "Revisá la fecha y la hora del evento.";

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const MERIDIEM_RE = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?\s*([ap])\.?\s*m\.?$/i;

/** 24-hour HH:MM. A 12-hour label is converted so PM cannot be stored as the morning hour. */
function normalizeAgendaTimeHm(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, " ");
  const h24 = TIME_RE.exec(value);
  if (h24) return `${h24[1]}:${h24[2]}`;

  const h12 = MERIDIEM_RE.exec(value);
  if (!h12) return null;

  let hour = Number(h12[1]);
  const minute = h12[2];
  if (hour < 1 || hour > 12) return null;

  const pm = h12[3]!.toLowerCase() === "p";
  if (hour === 12) hour = pm ? 12 : 0;
  else if (pm) hour += 12;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

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
  let utcMs = Date.UTC(y, mo - 1, d, hh, mm, ss ?? 0);

  for (let i = 0; i < 3; i += 1) {
    const p = partsInZone(new Date(utcMs));
    const asUtcLike = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const desired = Date.UTC(y, mo - 1, d, hh, mm, ss ?? 0);
    utcMs += desired - asUtcLike;
  }

  return new Date(utcMs);
}

function isValidCalendarDay(dayKey: string): boolean {
  const [y, m, d] = dayKey.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

/**
 * Parse a form date (YYYY-MM-DD) + time (HH:MM) as America/Argentina/Buenos_Aires
 * wall clock and return a UTC ISO string. Matches agenda day bucketing (ZER-92).
 */
export function parseAgendaWallClockIso(dayKey: string, timeHm: string): string | null {
  if (!DAY_KEY_RE.test(dayKey) || !isValidCalendarDay(dayKey)) return null;
  const hm = normalizeAgendaTimeHm(timeHm);
  if (!hm) return null;
  const iso = zonedTimeToUtc(dayKey, `${hm}:00`).toISOString();
  return iso;
}

/** Pure range rule shared by create (6.7) and edit (6.10). Equal times are allowed. */
export function validateEventRange({ inicio, fin }: EventRangeInput): EventRangeResult {
  const startMs = Date.parse(inicio);
  if (Number.isNaN(startMs)) {
    return { ok: false, error: PARSE_ERROR };
  }

  if (fin == null || fin === "") {
    return { ok: true };
  }

  const endMs = Date.parse(fin);
  if (Number.isNaN(endMs)) {
    return { ok: false, error: PARSE_ERROR };
  }

  if (endMs < startMs) {
    return { ok: false, error: RANGE_ERROR };
  }

  return { ok: true };
}
