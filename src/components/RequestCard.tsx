"use client";

import { useState } from "react";
import { Check, CalendarCheck, CalendarClock, CalendarPlus } from "lucide-react";
import { transitionRequest } from "@/features/admin/actions";
import { adminRequestActions } from "@/features/membership/admin-request-actions";
import { type MembershipRequestEstado } from "@/features/membership/request-state";
import { MembershipEstadoChip } from "./MembershipEstadoChip";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { Avatar } from "./Avatar";
import { type Profile } from "@/features/profile/types";
import {
  APORTE_ACTITUD_LABELS,
  APORTE_MAYOR_LABELS,
  DURACION_VISITA_LABELS,
  FRECUENCIA_USO_LABELS,
  SITUACION_ACTUAL_LABELS,
  type AporteActitud,
  type AporteMayor,
  type DuracionVisita,
  type FrecuenciaUso,
  type SituacionActual,
} from "@/features/membership/screening";

export interface RequestProfileData {
  id: string;
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: Profile["nombre_visible"];
  avatar_url: string | null;
}

export interface RequestScreeningData {
  contacto_whatsapp: string | null;
  frecuencia_uso: FrecuenciaUso | null;
  duracion_visita: DuracionVisita | null;
  aporte_actitud: AporteActitud | null;
  reunion_disponibilidad: string | null;
  situacion_actual: SituacionActual | null;
  ocupacion_detalle: string | null;
  entrevista_items: string | null;
  aporte_otro: string | null;
  aporte_mayor: AporteMayor | null;
  mensaje: string | null;
}

export interface RequestCardData {
  id: string;
  profile: RequestProfileData;
  mensaje: string | null;
  created_at: string;
  estado: MembershipRequestEstado;
  screening?: RequestScreeningData | null;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
}

function displayName(profile: RequestProfileData): string {
  switch (profile.nombre_visible) {
    case "apodo":
      if (profile.apodo) return profile.apodo;
      return [profile.nombre, profile.apellido].filter(Boolean).join(" ");
    case "apellido_nombre":
      return [profile.apellido, profile.nombre].filter(Boolean).join(" ");
    case "nombre_apellido":
    default:
      return [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  }
}

type ActionState = { error?: string; success?: string } | null;

const ACTION_ICONS = {
  "calendar-plus": CalendarPlus,
  "calendar-check": CalendarCheck,
  "calendar-clock": CalendarClock,
  check: Check,
} as const;

function RequestCardActions({
  requestId,
  estado,
  name,
}: {
  requestId: string;
  estado: MembershipRequestEstado;
  name: string;
}) {
  const [state, formAction, pending] = useGuardedActionState(
    transitionRequest as (s: ActionState, f: FormData) => Promise<ActionState>,
    null,
  );
  const [confirmingClose, setConfirmingClose] = useState(false);
  const { actions, canClose } = adminRequestActions(estado);

  if (actions.length === 0 && !canClose) {
    return null;
  }

  const feedback = state?.error ?? state?.success;

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        {!confirmingClose &&
          actions.map((action) => {
            const Icon = ACTION_ICONS[action.icon];
            const primary = action.variant === "primary";
            return (
              <button
                key={`${action.to}-${action.label}`}
                type="submit"
                name="to"
                value={action.to}
                disabled={pending}
                className={
                  primary
                    ? "rounded-pill bg-primary h-[44px] flex items-center justify-center gap-1.5 w-full disabled:opacity-50"
                    : "rounded-pill bg-surface border border-border h-[44px] flex items-center justify-center gap-1.5 w-full disabled:opacity-50"
                }
              >
                <Icon
                  aria-hidden
                  className={primary ? "size-[17px] text-on-primary" : "size-4 text-text-secondary"}
                />
                <span
                  className={`font-display text-[15px] font-medium ${primary ? "text-on-primary" : "text-text-secondary"}`}
                >
                  {action.label}
                </span>
              </button>
            );
          })}
        {canClose && !confirmingClose && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmingClose(true)}
            className="min-h-[44px] w-full flex items-center justify-center disabled:opacity-50"
          >
            <span className="font-display text-[13px] font-medium text-text-muted">
              Cerrar solicitud
            </span>
          </button>
        )}
        {canClose && confirmingClose && (
          <div className="flex flex-col gap-3 rounded-2xl bg-surface-inset p-3.5">
            <p className="font-display text-[15px] font-medium text-text-primary">
              ¿Cerrar la solicitud de {name}?
            </p>
            <p className="font-body text-xs leading-[1.4] text-text-secondary">
              Deja de estar en curso y queda en el historial. Si el problema es el horario, usá
              Reprogramar.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmingClose(false)}
                className="rounded-pill h-[44px] flex-1 flex items-center justify-center disabled:opacity-50"
              >
                <span className="font-display text-[15px] font-medium text-text-secondary">
                  Cancelar
                </span>
              </button>
              <button
                type="submit"
                name="to"
                value="cerrada"
                disabled={pending}
                className="rounded-pill bg-surface border border-text-primary h-[44px] flex-1 flex items-center justify-center disabled:opacity-50"
              >
                <span className="font-display text-[15px] font-medium text-text-primary">
                  Sí, cerrar
                </span>
              </button>
            </div>
          </div>
        )}
      </form>
      {feedback && (
        <p
          role="status"
          className={`font-body text-xs text-center ${state?.error ? "text-coral" : "text-text-secondary"}`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-body text-[11px] font-medium text-text-muted">{label}</span>
      <span className="font-body text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">
        {value}
      </span>
    </div>
  );
}

function ScreeningDetails({ screening }: { screening: RequestScreeningData }) {
  const rows: { label: string; value: string }[] = [];

  if (screening.contacto_whatsapp) {
    rows.push({ label: "WhatsApp", value: screening.contacto_whatsapp });
  }
  if (screening.frecuencia_uso) {
    rows.push({
      label: "Frecuencia",
      value: FRECUENCIA_USO_LABELS[screening.frecuencia_uso],
    });
  }
  if (screening.duracion_visita) {
    rows.push({
      label: "Duración por visita",
      value: DURACION_VISITA_LABELS[screening.duracion_visita],
    });
  }
  if (screening.aporte_actitud) {
    rows.push({
      label: "Aporte de referencia",
      value: APORTE_ACTITUD_LABELS[screening.aporte_actitud],
    });
  }
  if (screening.reunion_disponibilidad) {
    rows.push({ label: "Horario reunión", value: screening.reunion_disponibilidad });
  }
  if (screening.situacion_actual) {
    rows.push({
      label: "Situación",
      value: SITUACION_ACTUAL_LABELS[screening.situacion_actual],
    });
  }
  if (screening.ocupacion_detalle) {
    rows.push({ label: "Estudia / trabaja", value: screening.ocupacion_detalle });
  }
  if (screening.entrevista_items) {
    rows.push({ label: "Ítems entrevista", value: screening.entrevista_items });
  }
  if (screening.aporte_otro) {
    rows.push({ label: "Otro aporte", value: screening.aporte_otro });
  }
  if (screening.aporte_mayor) {
    rows.push({
      label: "Aporte mayor",
      value: APORTE_MAYOR_LABELS[screening.aporte_mayor],
    });
  }
  if (screening.mensaje) {
    rows.push({ label: "Mensaje", value: screening.mensaje });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-surface-inset p-3.5">
      {rows.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  );
}

export function RequestCard({ request }: { request: RequestCardData }) {
  const name = displayName(request.profile);
  const hasScreeningObject = request.screening != null;
  const screening: RequestScreeningData = request.screening ?? {
    contacto_whatsapp: null,
    frecuencia_uso: null,
    duracion_visita: null,
    aporte_actitud: null,
    reunion_disponibilidad: null,
    situacion_actual: null,
    ocupacion_detalle: null,
    entrevista_items: null,
    aporte_otro: null,
    aporte_mayor: null,
    mensaje: null,
  };

  return (
    <div className="rounded-[24px] bg-surface border border-border p-4 flex flex-col gap-3.5 shadow-[0_10px_30px_-12px_#1a161426]">
      <div className="flex items-center gap-3">
        <Avatar
          name={name || "??"}
          src={request.profile.avatar_url}
          size="md"
          className="size-12"
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-display text-[16px] font-medium text-text-primary truncate">
            {name || "Sin nombre"}
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5">
            <MembershipEstadoChip estado={request.estado} />
            <span className="font-body text-[11px] text-text-muted whitespace-nowrap">
              {timeAgo(request.created_at)}
            </span>
          </div>
        </div>
      </div>

      {hasScreeningObject ? (
        <ScreeningDetails screening={screening} />
      ) : (
        request.mensaje && (
          <p className="font-body text-[13px] text-text-secondary leading-relaxed">
            {request.mensaje}
          </p>
        )
      )}

      <RequestCardActions
        requestId={request.id}
        estado={request.estado}
        name={name || "Sin nombre"}
      />
    </div>
  );
}
