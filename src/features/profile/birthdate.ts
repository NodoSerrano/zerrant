/**
 * Strict civil birth date: `YYYY-MM-DD` only, calendar-real, not future, year ≥ 1900.
 * Native `type=date` can degrade to free text; never accept localized strings.
 */
export function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return false;
  }

  return date.getTime() <= Date.now() && date.getUTCFullYear() >= 1900;
}

/** Today as `YYYY-MM-DD` (UTC calendar day) for date input `max`. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
