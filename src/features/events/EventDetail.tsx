import Link from "next/link";
import { ChevronLeft, Clock, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { formatEventTimeRange } from "./day";
import { groupAttendance } from "./attendance";
import type { EventAttendee, EventCreator } from "./types";

const CHIP_VARIANT = {
  voy: "mint",
  quizas: "yellow",
  no: "default",
} as const;

export type EventDetailProps = {
  titulo: string;
  descripcion: string | null;
  lugar: string | null;
  inicio: string;
  fin: string | null;
  creator: EventCreator;
  attendees: EventAttendee[];
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[17px] font-medium text-text-primary">{children}</h2>;
}

export function EventDetail({
  titulo,
  descripcion,
  lugar,
  inicio,
  fin,
  creator,
  attendees,
}: EventDetailProps) {
  const groups = groupAttendance(attendees).filter((group) => group.attendees.length > 0);
  const timeLabel = formatEventTimeRange(inicio, fin);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link
          href="/agenda"
          aria-label="Volver a la agenda"
          className="flex items-center justify-center"
        >
          <ChevronLeft size={24} className="text-text-primary" />
        </Link>
        <span className="font-display text-base font-medium text-text-primary">Evento</span>
        <span aria-hidden="true" className="size-6" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-text-primary">{titulo}</h1>
        {descripcion ? (
          <p className="font-body text-sm leading-relaxed text-text-secondary">{descripcion}</p>
        ) : null}
      </div>

      <section className="flex w-full flex-col gap-[10px] rounded-[20px] border border-border bg-surface p-4">
        {lugar ? (
          <div className="flex items-center gap-2">
            <MapPin className="size-[15px] text-text-muted" aria-hidden="true" />
            <span className="font-body text-[13px] font-normal text-text-secondary">{lugar}</span>
          </div>
        ) : null}
        {timeLabel ? (
          <div className="flex items-center gap-2">
            <Clock className="size-[15px] text-text-muted" aria-hidden="true" />
            <time
              dateTime={inicio}
              className="font-body text-[13px] font-normal text-text-secondary"
            >
              {timeLabel}
            </time>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Avatar name={creator.name} src={creator.avatarUrl} size="sm" />
          <span className="font-body text-[13px] font-normal text-text-secondary">
            Creado por {creator.name}
          </span>
        </div>
      </section>

      {/* Story 6.9 mounts the viewer's RSVP control here. */}
      <div data-testid="rsvp-control-slot" />

      <section className="flex flex-col gap-3" aria-labelledby="attendees-heading">
        <SectionTitle>
          <span id="attendees-heading">Asistentes</span>
        </SectionTitle>
        {groups.length === 0 ? (
          <EmptyState
            title="Nadie confirmó todavía"
            subtitle="Cuando alguien marque si va, va a aparecer acá."
            icon={Users}
            className="pb-5"
          />
        ) : (
          groups.map((group) => (
            <div key={group.estado} className="flex flex-col gap-2">
              <Chip label={group.label} variant={CHIP_VARIANT[group.estado]} />
              <ul className="flex flex-col gap-2">
                {group.attendees.map((person) => (
                  <li key={person.profileId} className="flex items-center gap-2">
                    <Avatar name={person.name} src={person.avatarUrl} size="sm" />
                    <span className="font-body text-sm text-text-primary">{person.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
