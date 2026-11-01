import Link from "next/link";
import { Cake, Calendar } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { MemberConfirmedNotice } from "@/features/membership/MemberConfirmedNotice";
import { EventCard } from "@/features/events/EventCard";
import type { UpcomingBirthday } from "@/features/home/birthdays";
import { SerSerranoCta } from "@/features/membership/SerSerranoCta";
import { ProjectJoinNoticeCard } from "@/features/projects/ProjectJoinNoticeCard";
import type { ProjectJoinNoticeViewModel } from "@/features/projects/project-join-notices";

export type InicioEventItem = {
  id: string;
  title: string;
  dateLabel?: string;
  timeLabel: string;
  durationLabel?: string | null;
  place: string | null;
  href: string;
  coverUrl?: string | null;
};

export type InicioHubProps = {
  events: InicioEventItem[];
  birthdays: UpcomingBirthday[];
  /** Members see upcoming birthdays. Tourists must not see the section. */
  showBirthdays?: boolean;
  /** Tourists without an active membership request (ZER-171). */
  showSerSerranoCta?: boolean;
  /** Set when this member was converted within the confirmation window (ZER-146). */
  memberConfirmed?: boolean;
  /** Undismissed project join outcomes for the viewer (ZER-202). */
  joinNotices?: ProjectJoinNoticeViewModel[];
};

function birthdaySubtitle(row: UpcomingBirthday): string {
  if (row.daysUntil === 0) {
    return `Hoy · cumple ${row.ageTurning}`;
  }
  if (row.daysUntil === 1) {
    return `Mañana · cumple ${row.ageTurning}`;
  }
  return `En ${row.daysUntil} días · cumple ${row.ageTurning}`;
}

export function InicioHub({
  events,
  birthdays,
  showBirthdays = true,
  showSerSerranoCta = false,
  memberConfirmed = false,
  joinNotices = [],
}: InicioHubProps) {
  return (
    <div className="flex flex-col gap-6" data-pencil-frame="zTB9C">
      <h1 className="font-display text-[22px] font-bold text-text-primary">Inicio</h1>

      {showSerSerranoCta ? <SerSerranoCta /> : null}
      {memberConfirmed ? <MemberConfirmedNotice /> : null}
      {joinNotices.length > 0 ? (
        <div className="flex flex-col gap-3" aria-label="Avisos de proyectos">
          {joinNotices.map((notice) => (
            <ProjectJoinNoticeCard key={`${notice.projectId}-${notice.kind}`} notice={notice} />
          ))}
        </div>
      ) : null}

      <section className="flex flex-col gap-3" aria-labelledby="inicio-eventos-heading">
        <h2
          id="inicio-eventos-heading"
          className="font-display text-[15px] font-semibold text-text-primary"
        >
          Próximos eventos
        </h2>
        {!events.length ? (
          <EmptyState
            title="No hay eventos próximos"
            subtitle="Cuando se publiquen eventos en la agenda, van a aparecer acá."
            icon={Calendar}
            className="pb-5"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                href={event.href}
                title={event.title}
                dateLabel={event.dateLabel}
                timeLabel={event.timeLabel}
                durationLabel={event.durationLabel}
                place={event.place}
                coverUrl={event.coverUrl}
              />
            ))}
          </div>
        )}
      </section>

      {showBirthdays ? (
        <section className="flex flex-col gap-3" aria-labelledby="inicio-cumples-heading">
          <h2
            id="inicio-cumples-heading"
            className="font-display text-[15px] font-semibold text-text-primary"
          >
            Próximos cumpleaños
          </h2>
          {!birthdays.length ? (
            <EmptyState
              title="No hay cumpleaños próximos"
              subtitle="No hay cumpleaños en los próximos 30 días."
              icon={Cake}
              className="pb-5"
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {birthdays.map((row) => (
                <li key={row.profileId}>
                  <Link
                    href={`/plantel/${row.profileId}`}
                    className="rounded-[20px] bg-surface border border-border shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)] p-4 flex items-center gap-3 w-full min-h-[72px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <Avatar name={row.displayName} src={row.avatarUrl} size="md" alt="" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-display text-[15px] font-medium text-text-primary truncate">
                        {row.displayName}
                      </span>
                      <span className="font-body text-xs font-normal text-text-muted">
                        {birthdaySubtitle(row)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
