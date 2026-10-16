/** 24h choices for the event time sheet. Equal start/end is valid. */

export const PICKER_HOURS = Array.from({ length: 24 }, (_, hour) => hour);
export const PICKER_MINUTES = [0, 15, 30, 45] as const;

const HM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseHm(value: string): { hour: number; minute: number } | null {
  const match = HM_RE.exec(value);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export function formatHm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Spanish length, e.g. "2 h 30 min". Null if the span is negative. */
export function formatMinutes(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  const whole = Math.round(minutes);
  if (whole === 0) return "0 min";
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return hours === 1 ? "1 h" : `${hours} h`;
  return `${hours} h ${rest} min`;
}

/** Spanish duration between two HH:MM values. Null if either is missing or the range is invalid. */
export function formatDuration(start: string, end: string): string | null {
  const from = parseHm(start);
  const to = parseHm(end);
  if (!from || !to) return null;
  return formatMinutes(to.hour * 60 + to.minute - (from.hour * 60 + from.minute));
}

/** Zero-padded HH:MM compares in order. Empty values are not a range yet. */
export function isBeforeStart(candidate: string, start: string): boolean {
  if (!candidate || !start) return false;
  return candidate < start;
}

/** If an existing end is now before start, snap it to start. Empty end stays empty. */
export function clampEnd(start: string, end: string): string {
  if (!end || !start || end >= start) return end;
  return start;
}

export function minuteChoices(currentMinute: number | null): number[] {
  const base: number[] = [...PICKER_MINUTES];
  if (currentMinute == null || base.includes(currentMinute)) return base;
  return [...base, currentMinute].sort((a, b) => a - b);
}

export function isHourDisabled(
  hour: number,
  minutes: number[],
  start: string,
  pickingEnd: boolean,
): boolean {
  if (!pickingEnd || !start) return false;
  return minutes.every((minute) => formatHm(hour, minute) < start);
}

export function isMinuteDisabled(
  hour: number,
  minute: number,
  start: string,
  pickingEnd: boolean,
): boolean {
  if (!pickingEnd || !start) return false;
  return formatHm(hour, minute) < start;
}
