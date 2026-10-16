const WEEKDAY = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;
const MONTH = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sept",
  "oct",
  "nov",
  "dic",
] as const;

const DAY_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDayKey(value: string): { year: number; month: number; day: number } | null {
  const match = DAY_KEY_RE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/** "vie 16 oct" — calendar date, not the browser's locale popup. */
export function formatAgendaDate(value: string): string {
  const parts = parseDayKey(value);
  if (!parts) return value;
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return `${WEEKDAY[weekday]} ${parts.day} ${MONTH[parts.month - 1]}`;
}

export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Monday-first blanks + day numbers for one month. */
export function monthCells(year: number, month: number): Array<number | null> {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leading = (first + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<number | null> = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(day);
  return cells;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export const MONTH_LABEL = MONTH;
