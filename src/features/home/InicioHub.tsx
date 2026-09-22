import Link from "next/link";
import { Cake, Calendar, FolderOpen, ListTodo } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/features/events/EventCard";
import type { UpcomingBirthday } from "@/features/home/birthdays";

export type InicioEventItem = {
  id: string;
  title: string;
  timeLabel: string;
  place: string | null;
  href: string;
  coverUrl?: string | null;
};

export type InicioHubProps = {
  events: InicioEventItem[];
  birthdays: UpcomingBirthday[];
  /** Members (non-tourist) see Tareas/Proyectos entry under Inicio. */
  showCommunityHub?: boolean;
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

export function InicioHub({ events, birthdays, showCommunityHub = false }: InicioHubProps) {
  return (
    <div className="flex flex-col gap-6" data-pencil-frame="zTB9C">
      <h1 className="font-display text-[22px] font-bold text-text-primary">Inicio</h1>

      {showCommunityHub ? (
        <section className="flex flex-col gap-3" aria-labelledby="inicio-comunidad-heading">
          <h2
            id="inicio-comunidad-heading"
            className="font-display text-[15px] font-semibold text-text-primary"
          >
            Tareas y proyectos
          </h2>
          <p className="font-body text-[13px] text-text-secondary">
            Lo que antes vivía en Nodo ahora entra desde Inicio.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/nodo/tasks"
              className="rounded-[20px] bg-surface border border-border shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)] p-4 flex flex-col gap-2 min-h-[88px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <ListTodo className="size-5 text-text-primary" aria-hidden="true" />
              <span className="font-display text-[15px] font-semibold text-text-primary">
                Tareas
              </span>
              <span className="font-body text-xs text-text-muted">
                Listado y filtros de la comunidad
              </span>
            </Link>
            <Link
              href="/nodo/projects"
              className="rounded-[20px] bg-surface border border-border shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)] p-4 flex flex-col gap-2 min-h-[88px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <FolderOpen className="size-5 text-text-primary" aria-hidden="true" />
              <span className="font-display text-[15px] font-semibold text-text-primary">
                Proyectos
              </span>
              <span className="font-body text-xs text-text-muted">Iniciativas y membresías</span>
            </Link>
          </div>
        </section>
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
                timeLabel={event.timeLabel}
                place={event.place}
                coverUrl={event.coverUrl}
              />
            ))}
          </div>
        )}
      </section>

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
    </div>
  );
}
