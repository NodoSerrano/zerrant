/**
 * ZER-142 first-party interview slots.
 * Calendly / Google Calendar were considered and rejected: occupancy must live
 * in Postgres (unique slot_id) and no applicant data leaves the app.
 */

import type { MembershipRequestEstado } from "./request-state";

export const INTERVIEW_SLOT_MINUTES = 30;

export const BOOKABLE_INTERVIEW_ESTADOS = [
  "pendiente_coordinacion",
  "entrevista_solicitada",
  "reprogramacion",
] as const satisfies readonly MembershipRequestEstado[];

export type BookableInterviewEstado = (typeof BOOKABLE_INTERVIEW_ESTADOS)[number];

export function isBookableInterviewEstado(
  estado: MembershipRequestEstado,
): estado is BookableInterviewEstado {
  return (BOOKABLE_INTERVIEW_ESTADOS as readonly string[]).includes(estado);
}

/** datetime-local value (`YYYY-MM-DDTHH:MM`) in America/Argentina/Buenos_Aires → ISO. */
export function artWallClockToIso(local: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(local);
  if (!match) return null;
  const dayKey = match[1]!;
  const [hh, mm] = match[2]!.split(":").map(Number);
  const [y, mo, d] = dayKey.split("-").map(Number);
  let utcMs = Date.UTC(y, mo - 1, d, hh, mm, 0);
  for (let i = 0; i < 3; i += 1) {
    const shown = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const map = Object.fromEntries(
      shown
        .formatToParts(new Date(utcMs))
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value]),
    );
    const asUtcLike = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second),
    );
    utcMs += Date.UTC(y, mo - 1, d, hh, mm, 0) - asUtcLike;
  }
  return new Date(utcMs).toISOString();
}
