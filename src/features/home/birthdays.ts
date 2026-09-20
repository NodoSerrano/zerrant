/**
 * Birthday domain helpers (FR51).
 *
 * Date strategy: civil date-only math on YYYY-MM-DD strings (no wall-clock
 * timezone conversion). Callers pass "today" already resolved to the node
 * calendar day (prefer America/Argentina/Buenos_Aires via formatDayKey from
 * events/day, or an explicit test fixture). Postgres `date` values arrive as
 * YYYY-MM-DD and stay in that form end-to-end.
 *
 * Leap-day policy: a Feb 29 birthday is observed on Feb 28 in non-leap years
 * (age ticks and next occurrence use Feb 28). Never crash on 02-29.
 */

import { displayName } from "@/features/profile/displayName";
import type { NombreVisible } from "@/features/profile/types";

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_WINDOW_DAYS = 30;

export type BirthdayProfileInput = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: NombreVisible;
  fecha_nacimiento: string | null;
  avatar_url?: string | null;
};

export type UpcomingBirthday = {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  fechaNacimiento: string;
  nextOccurrence: string;
  daysUntil: number;
  /** Age the person reaches on nextOccurrence. */
  ageTurning: number;
};

type Ymd = { year: number; month: number; day: number };

function parseYmd(value: string): Ymd | null {
  if (!DAY_KEY_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Month/day for the birthday celebration in `year` (Feb 29 → Feb 28 if needed). */
function birthdayMdInYear(birth: Ymd, year: number): { month: number; day: number } {
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(year)) {
    return { month: 2, day: 28 };
  }
  return { month: birth.month, day: birth.day };
}

function daysBetween(from: Ymd, to: Ymd): number {
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((b - a) / 86_400_000);
}

function compareYmd(a: Ymd, b: Ymd): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

/**
 * Integer calendar age as of `today` (YYYY-MM-DD).
 * Returns null when the birth date is missing or invalid.
 */
export function ageFromBirthDate(
  fechaNacimiento: string | null | undefined,
  today: string,
): number | null {
  if (!fechaNacimiento) return null;
  const birth = parseYmd(fechaNacimiento);
  const asOf = parseYmd(today);
  if (!birth || !asOf) return null;
  if (compareYmd(asOf, birth) < 0) return null;

  let age = asOf.year - birth.year;
  const mdThisYear = birthdayMdInYear(birth, asOf.year);
  const anniversaryThisYear: Ymd = {
    year: asOf.year,
    month: mdThisYear.month,
    day: mdThisYear.day,
  };
  if (compareYmd(asOf, anniversaryThisYear) < 0) {
    age -= 1;
  }
  return age;
}

/**
 * Next civil occurrence of the birthday on or after `today`.
 * Returns null when inputs are invalid.
 */
export function nextBirthdayOccurrence(fechaNacimiento: string, today: string): string | null {
  const birth = parseYmd(fechaNacimiento);
  const asOf = parseYmd(today);
  if (!birth || !asOf) return null;

  const mdThisYear = birthdayMdInYear(birth, asOf.year);
  const thisYear: Ymd = {
    year: asOf.year,
    month: mdThisYear.month,
    day: mdThisYear.day,
  };
  if (compareYmd(thisYear, asOf) >= 0) {
    return formatYmd(thisYear.year, thisYear.month, thisYear.day);
  }

  const nextYear = asOf.year + 1;
  const mdNext = birthdayMdInYear(birth, nextYear);
  return formatYmd(nextYear, mdNext.month, mdNext.day);
}

export type UpcomingBirthdaysOptions = {
  /** Civil today YYYY-MM-DD (required for deterministic tests / RSC callers). */
  today: string;
  /** Inclusive window length in days; default 30 (today + 30). */
  windowDays?: number;
};

/**
 * Profiles whose next birthday falls in [today, today+windowDays], sorted by
 * next occurrence ascending. Null/invalid birthdays are dropped.
 */
export function upcomingBirthdays(
  profiles: BirthdayProfileInput[],
  options: UpcomingBirthdaysOptions,
): UpcomingBirthday[] {
  const asOf = parseYmd(options.today);
  if (!asOf) return [];

  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const results: UpcomingBirthday[] = [];

  for (const profile of profiles) {
    const birthRaw = profile.fecha_nacimiento;
    if (!birthRaw) continue;
    const birth = parseYmd(birthRaw);
    if (!birth) continue;

    const next = nextBirthdayOccurrence(birthRaw, options.today);
    if (!next) continue;
    const nextYmd = parseYmd(next);
    if (!nextYmd) continue;

    const daysUntil = daysBetween(asOf, nextYmd);
    if (daysUntil < 0 || daysUntil > windowDays) continue;

    const ageTurning = ageFromBirthDate(birthRaw, next);
    if (ageTurning === null) continue;

    results.push({
      profileId: profile.id,
      displayName: displayName(profile),
      avatarUrl: profile.avatar_url ?? null,
      fechaNacimiento: birthRaw,
      nextOccurrence: next,
      daysUntil,
      ageTurning,
    });
  }

  results.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
    return a.displayName.localeCompare(b.displayName, "es");
  });

  return results;
}
