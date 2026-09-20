import type { EventAttendanceEstado } from "@/lib/db/events-schema";

export type AgendaEvent = {
  id: string;
  titulo: string;
  descripcion: string | null;
  lugar: string | null;
  inicio: string;
  fin: string | null;
  creado_por: string;
};

/** Shared create/edit form defaults (edit story 6.10 reuses EventForm). */
export type EventFormDefaults = {
  titulo?: string;
  descripcion?: string;
  lugar?: string;
  /** YYYY-MM-DD in agenda TZ */
  fecha?: string;
  /** HH:MM wall clock */
  inicio?: string;
  /** HH:MM wall clock */
  fin?: string;
};

export type EventAttendee = {
  profileId: string;
  name: string;
  avatarUrl: string | null;
  estado: EventAttendanceEstado;
};

export type EventCreator = {
  profileId: string;
  name: string;
  avatarUrl: string | null;
};
