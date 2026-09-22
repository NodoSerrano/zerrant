"use client";

import { Check } from "lucide-react";
import { approveRequest, rejectRequest } from "@/features/admin/actions";
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

type ActionState = { error?: string } | null;

function RequestCardActions({ requestId }: { requestId: string }) {
  const [approveState, approveAction, approvePending] = useGuardedActionState(approveRequest, null);
  const [rejectState, rejectAction, rejectPending] = useGuardedActionState(rejectRequest, null);

  const approveError = (approveState as ActionState)?.error;
  const rejectError = (rejectState as ActionState)?.error;
  const busy = approvePending || rejectPending;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2.5">
        <form action={approveAction} className="flex-1">
          <input type="hidden" name="requestId" value={requestId} />
          <button
            type="submit"
            disabled={busy}
            className="rounded-pill bg-primary h-[44px] flex items-center justify-center gap-1.5 w-full disabled:opacity-50"
          >
            <Check className="size-[17px] text-on-primary" />
            <span className="font-display text-[15px] font-medium text-on-primary">
              {approvePending ? "Aprobando..." : "Aprobar"}
            </span>
          </button>
        </form>
        <form action={rejectAction} className="flex-1">
          <input type="hidden" name="requestId" value={requestId} />
          <button
            type="submit"
            disabled={busy}
            className="rounded-pill bg-surface border border-border h-[44px] flex items-center justify-center w-full disabled:opacity-50"
          >
            <span className="font-display text-[15px] font-medium text-text-secondary">
              {rejectPending ? "Rechazando..." : "Rechazar"}
            </span>
          </button>
        </form>
      </div>
      {(approveError || rejectError) && (
        <p className="font-body text-xs text-coral text-center">{approveError || rejectError}</p>
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
          <span className="font-body text-[11px] text-text-muted">
            Solicitó {timeAgo(request.created_at)}
          </span>
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

      <RequestCardActions requestId={request.id} />
    </div>
  );
}
