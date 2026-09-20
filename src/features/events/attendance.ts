import { EVENT_ATTENDANCE_ESTADOS, type EventAttendanceEstado } from "@/lib/db/events-schema";
import type { EventAttendee } from "./types";

export const RSVP_LABELS: Record<EventAttendanceEstado, string> = {
  voy: "Voy",
  quizas: "Quizás",
  no: "No",
};

export type AttendanceGroup = {
  estado: EventAttendanceEstado;
  label: string;
  attendees: EventAttendee[];
};

/** Stable voy → quizas → no buckets. Empty groups stay as empty arrays. */
export function groupAttendance(rows: EventAttendee[]): AttendanceGroup[] {
  const buckets: Record<EventAttendanceEstado, EventAttendee[]> = {
    voy: [],
    quizas: [],
    no: [],
  };

  for (const row of rows) {
    buckets[row.estado].push(row);
  }

  return EVENT_ATTENDANCE_ESTADOS.map((estado) => ({
    estado,
    label: RSVP_LABELS[estado],
    attendees: buckets[estado],
  }));
}
