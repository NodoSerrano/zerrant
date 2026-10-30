import { AGENDA_TIME_ZONE } from "@/features/events/day";

/**
 * ZER-180: after a cerrada request, a new one is allowed 30 days after it
 * closed, or earlier once a platform admin enables it. Mirrors the DB gate
 * membership_requests_reapply_gate (20261026220000_zer180_membership_reapply).
 */
export const REAPPLY_COOLDOWN_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ClosedRequest = {
  cerradaEn: string | null;
  reaperturaHabilitadaEn: string | null;
};

export type ReapplyStatus =
  | { allowed: true }
  /** availableFrom is null when the closing date is unknown: the DB blocks that case too. */
  | { allowed: false; availableFrom: string | null };

/** `closed` is the latest cerrada request of the profile, or null if there is none. */
export function reapplyStatus(closed: ClosedRequest | null, now: Date = new Date()): ReapplyStatus {
  if (!closed || closed.reaperturaHabilitadaEn) return { allowed: true };
  if (!closed.cerradaEn) return { allowed: false, availableFrom: null };

  const availableFrom = new Date(
    new Date(closed.cerradaEn).getTime() + REAPPLY_COOLDOWN_DAYS * DAY_MS,
  );
  return availableFrom.getTime() <= now.getTime()
    ? { allowed: true }
    : { allowed: false, availableFrom: availableFrom.toISOString() };
}

export type ClosedRow = {
  id: string;
  profileId: string;
  estado: string;
  cerradaEn: string | null;
  updatedAt: string;
};

/** Ids of the cerrada row the insert gate reads, one per profile. */
export function gateClosedIds(rows: ClosedRow[]): Set<string> {
  const best = new Map<string, ClosedRow>();
  for (const row of rows) {
    if (row.estado !== "cerrada" || !row.profileId) continue;
    const current = best.get(row.profileId);
    if (!current || closedIsLater(row, current)) best.set(row.profileId, row);
  }
  return new Set([...best.values()].map((row) => row.id));
}

function closedIsLater(candidate: ClosedRow, current: ClosedRow): boolean {
  if (candidate.cerradaEn && !current.cerradaEn) return true;
  if (!candidate.cerradaEn && current.cerradaEn) return false;
  if (candidate.cerradaEn && current.cerradaEn && candidate.cerradaEn !== current.cerradaEn) {
    return candidate.cerradaEn > current.cerradaEn;
  }
  if (candidate.updatedAt !== current.updatedAt) return candidate.updatedAt > current.updatedAt;
  return candidate.id > current.id;
}

/** "19 de noviembre", the day in Argentina. */
export function formatReapplyDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    timeZone: AGENDA_TIME_ZONE,
  }).format(new Date(iso));
}
