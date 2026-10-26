import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { MembershipEstadoChip } from "@/components/MembershipEstadoChip";
import { AGENDA_TIME_ZONE } from "@/features/events/day";
import {
  closingEvent,
  HISTORY_FILTERS,
  type HistoryFilter,
  type RequestHistoryEvent,
} from "@/features/membership/request-history";
import { estadoLabel, type MembershipRequestEstado } from "@/features/membership/request-state";
import { formatReapplyDate, reapplyStatus } from "@/features/membership/reapply";
import { EnableReapplicationButton } from "./EnableReapplicationButton";

export interface RequestHistoryItem {
  id: string;
  estado: MembershipRequestEstado;
  createdAt: string;
  name: string;
  avatarUrl: string | null;
  events: RequestHistoryEvent[];
  /** cerrada only: when it closed and whether an admin reopened it (ZER-180). */
  cerradaEn?: string | null;
  reaperturaHabilitadaEn?: string | null;
}

const FILTER_LABELS: Record<HistoryFilter, string> = {
  todas: "Todas",
  aprobado: "Aprobadas",
  cerrada: "Cerradas",
};

const CLOSING_VERB: Partial<Record<MembershipRequestEstado, string>> = {
  aprobado: "Aprobada por",
  cerrada: "Cerrada por",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: AGENDA_TIME_ZONE,
  }).format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    // 24-hour clock, like the rest of the app (agenda, events).
    hourCycle: "h23",
    timeZone: AGENDA_TIME_ZONE,
  }).format(new Date(iso));
}

function Motivo({ text }: { text: string }) {
  return (
    <p className="font-body text-[13px] text-text-secondary whitespace-pre-wrap rounded-2xl bg-surface-inset px-3 py-2">
      <span className="font-medium text-text-primary">Motivo: </span>
      {text}
    </p>
  );
}

// ZER-180: after a cerrada request, a new one waits 30 days unless an admin enables it.
function Reapply({ item }: { item: RequestHistoryItem }) {
  if (item.reaperturaHabilitadaEn) {
    return <p className="font-body text-[13px] text-text-secondary">Nueva solicitud habilitada</p>;
  }
  const status = reapplyStatus({
    cerradaEn: item.cerradaEn ?? null,
    reaperturaHabilitadaEn: null,
  });
  if (status.allowed) {
    return <p className="font-body text-[13px] text-text-secondary">Ya puede volver a solicitar</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {status.availableFrom ? (
        <p className="font-body text-[13px] text-text-secondary">
          Puede volver a solicitar desde el {formatReapplyDate(status.availableFrom)}
        </p>
      ) : null}
      <EnableReapplicationButton requestId={item.id} />
    </div>
  );
}

function HistoryCard({ item }: { item: RequestHistoryItem }) {
  const closing = closingEvent(item.events, item.estado);
  const changes = item.events.filter((event) => event.from !== null);

  return (
    <li className="rounded-[24px] bg-surface border border-border p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={item.name || "??"} src={item.avatarUrl} size="md" className="size-12" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-display text-[16px] font-medium text-text-primary truncate">
            {item.name || "Sin nombre"}
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5">
            <MembershipEstadoChip estado={item.estado} />
            <span className="font-body text-[11px] text-text-muted whitespace-nowrap">
              Solicitó el {formatDate(item.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {closing ? (
        <p className="font-body text-[13px] text-text-secondary">
          {CLOSING_VERB[item.estado] ?? "Cambiada por"}{" "}
          <span className="font-medium text-text-primary">{closing.actorName}</span> ·{" "}
          {formatDateTime(closing.at)}
        </p>
      ) : (
        <p className="font-body text-[13px] text-text-muted">Sin registro del cierre</p>
      )}
      {closing?.motivo ? <Motivo text={closing.motivo} /> : null}
      {item.estado === "cerrada" ? <Reapply item={item} /> : null}

      {changes.length > 0 ? (
        <details className="group">
          <summary className="cursor-pointer font-body text-[13px] font-medium text-text-secondary min-h-[44px] flex items-center">
            Ver línea de tiempo ({changes.length} {changes.length === 1 ? "cambio" : "cambios"})
          </summary>
          <ol className="flex flex-col gap-3 border-l-2 border-border pl-3 mt-1">
            {item.events.map((event) => (
              <li key={event.id} className="flex flex-col gap-1">
                <span className="font-body text-[13px] text-text-primary">
                  {event.from
                    ? `${estadoLabel(event.from)} → ${estadoLabel(event.to)}`
                    : "Solicitud enviada"}
                </span>
                <span className="font-body text-[11px] text-text-muted">
                  {event.actorName} · {formatDateTime(event.at)}
                </span>
                {event.motivo ? (
                  <span className="font-body text-[12px] text-text-secondary whitespace-pre-wrap">
                    «{event.motivo}»
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </li>
  );
}

export function RequestHistoryList({
  items,
  filter,
  eventsError,
  limit,
}: {
  items: RequestHistoryItem[];
  filter: HistoryFilter;
  eventsError: boolean;
  /** Max rows the page loads; reaching it means older requests are not listed. */
  limit: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Filtrar historial" className="flex flex-wrap gap-2">
        {HISTORY_FILTERS.map((option) => {
          const active = option === filter;
          return (
            <Link
              key={option}
              href={
                option === "todas"
                  ? "/admin/membresias?vista=historial"
                  : `/admin/membresias?vista=historial&estado=${option}`
              }
              aria-current={active ? "page" : undefined}
              className={`rounded-pill border px-4 min-h-[36px] flex items-center font-display text-[13px] font-medium ${
                active
                  ? "bg-text-primary border-text-primary text-bg"
                  : "bg-surface border-border text-text-secondary"
              }`}
            >
              {FILTER_LABELS[option]}
            </Link>
          );
        })}
      </nav>

      {eventsError ? (
        <p className="font-body text-[13px] text-coral">No pudimos cargar quién hizo cada cambio</p>
      ) : null}

      {items.length >= limit ? (
        <p className="font-body text-[13px] text-text-secondary">
          Se muestran las {limit} más recientes. Las anteriores no aparecen en esta lista.
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="font-body text-[14px] text-text-muted text-center py-8">
          No hay solicitudes en el historial
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
