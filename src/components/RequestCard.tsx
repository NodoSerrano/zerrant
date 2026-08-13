"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { approveRequest, rejectRequest } from "@/features/admin/actions";
import { Avatar } from "./Avatar";
import { type Profile } from "@/features/profile/types";

export interface RequestProfileData {
  id: string;
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: Profile["nombre_visible"];
  avatar_url: string | null;
}

export interface RequestCardData {
  id: string;
  profile: RequestProfileData;
  mensaje: string | null;
  created_at: string;
}

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 7)
    return `hace ${days} ${days === 1 ? "día" : "días"}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
}

function displayName(profile: RequestProfileData): string {
  switch (profile.nombre_visible) {
    case "apodo":
      if (profile.apodo) return profile.apodo;
      return [profile.nombre, profile.apellido]
        .filter(Boolean)
        .join(" ");
    case "apellido_nombre":
      return [profile.apellido, profile.nombre]
        .filter(Boolean)
        .join(" ");
    case "nombre_apellido":
    default:
      return [profile.nombre, profile.apellido]
        .filter(Boolean)
        .join(" ");
  }
}

type ActionState = { error?: string } | null;

function RequestCardActions({ requestId }: { requestId: string }) {
  const [approveState, approveAction] = useActionState(approveRequest, null);
  const [rejectState, rejectAction] = useActionState(rejectRequest, null);

  const approveError = (approveState as ActionState)?.error;
  const rejectError = (rejectState as ActionState)?.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2.5">
        <form action={approveAction} className="flex-1">
          <input type="hidden" name="requestId" value={requestId} />
          <button
            type="submit"
            className="rounded-pill bg-primary h-[44px] flex items-center justify-center gap-1.5 w-full"
          >
            <Check className="size-[17px] text-on-primary" />
            <span className="font-display text-[15px] font-medium text-on-primary">
              Aprobar
            </span>
          </button>
        </form>
        <form action={rejectAction} className="flex-1">
          <input type="hidden" name="requestId" value={requestId} />
          <button
            type="submit"
            className="rounded-pill bg-surface border border-border h-[44px] flex items-center justify-center w-full"
          >
            <span className="font-display text-[15px] font-medium text-text-secondary">
              Rechazar
            </span>
          </button>
        </form>
      </div>
      {(approveError || rejectError) && (
        <p className="font-body text-xs text-coral text-center">
          {approveError || rejectError}
        </p>
      )}
    </div>
  );
}

export function RequestCard({ request }: { request: RequestCardData }) {
  const name = displayName(request.profile);

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

      {request.mensaje && (
        <p className="font-body text-[13px] text-text-secondary leading-relaxed">
          {request.mensaje}
        </p>
      )}

      <RequestCardActions requestId={request.id} />
    </div>
  );
}
