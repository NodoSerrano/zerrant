import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  RequestCard,
  type RequestCardData,
  type RequestProfileData,
  type RequestScreeningData,
} from "@/components/RequestCard";
import type { Tier } from "@/features/profile/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SCREENING_SELECT =
  "id, mensaje, created_at, contacto_whatsapp, frecuencia_uso, duracion_visita, aporte_actitud, reunion_disponibilidad, situacion_actual, ocupacion_detalle, entrevista_items, aporte_otro, aporte_mayor, profiles!membership_requests_profile_id_fkey(nombre, apellido, apodo, nombre_visible, avatar_url, tier, id)";

type RequestRow = {
  id: string;
  mensaje: string | null;
  created_at: string;
  contacto_whatsapp: string | null;
  frecuencia_uso: RequestScreeningData["frecuencia_uso"];
  duracion_visita: RequestScreeningData["duracion_visita"];
  aporte_actitud: RequestScreeningData["aporte_actitud"];
  reunion_disponibilidad: string | null;
  situacion_actual: RequestScreeningData["situacion_actual"];
  ocupacion_detalle: string | null;
  entrevista_items: string | null;
  aporte_otro: string | null;
  aporte_mayor: RequestScreeningData["aporte_mayor"];
  profiles: RequestProfileData & { tier: Tier };
};

function toScreening(row: RequestRow): RequestScreeningData {
  return {
    contacto_whatsapp: row.contacto_whatsapp,
    frecuencia_uso: row.frecuencia_uso,
    duracion_visita: row.duracion_visita,
    aporte_actitud: row.aporte_actitud,
    reunion_disponibilidad: row.reunion_disponibilidad,
    situacion_actual: row.situacion_actual,
    ocupacion_detalle: row.ocupacion_detalle,
    entrevista_items: row.entrevista_items,
    aporte_otro: row.aporte_otro,
    aporte_mayor: row.aporte_mayor,
    mensaje: row.mensaje,
  };
}

export default async function AdminMembresiasPage() {
  const supabase = await createClient();

  const [{ count: pendingCount, data: pendingRequests }, { count: rolesCount }] = await Promise.all(
    [
      supabase
        .from("membership_requests")
        .select(SCREENING_SELECT, { count: "exact" })
        .eq("estado", "pendiente")
        .order("created_at", { ascending: false }),
      supabase
        .from("profile_roles")
        .select("id", { count: "exact", head: true })
        .eq("confirmado", false),
    ],
  );

  const requests: RequestCardData[] = (Array.isArray(pendingRequests) ? pendingRequests : [])
    .filter(
      (row): row is RequestRow =>
        row !== null &&
        typeof row === "object" &&
        "profiles" in row &&
        row.profiles !== null &&
        typeof row.profiles === "object",
    )
    .map((row) => ({
      id: row.id,
      mensaje: row.mensaje,
      created_at: row.created_at,
      screening: toScreening(row),
      profile: {
        id: row.profiles.id,
        nombre: row.profiles.nombre,
        apellido: row.profiles.apellido,
        apodo: row.profiles.apodo,
        nombre_visible: row.profiles.nombre_visible,
        avatar_url: row.profiles.avatar_url,
      } satisfies RequestProfileData,
    }));

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-center gap-3">
          <Link href="/profile" aria-label="Volver al perfil">
            <ChevronLeft className="size-6 text-text-primary" />
          </Link>
          <span className="font-display text-[16px] font-medium text-text-primary">
            Panel de admin
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[3px]">
            <h1 className="font-display text-[22px] font-bold text-text-primary">
              Solicitudes pendientes
            </h1>
            <p className="font-body text-[13px] text-text-secondary">
              Turistas esperando ser Serranos
            </p>
          </div>
          <div className="rounded-pill bg-coral px-[13px] py-[7px]">
            <span className="font-display text-[14px] font-bold text-on-primary">
              {pendingCount ?? 0}
            </span>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-[14px] bg-surface-inset">
          <div className="rounded-[11px] bg-surface h-[38px] flex-1 flex items-center justify-center shadow-[0_2px_6px_#1a161418]">
            <span className="font-display text-[13px] font-semibold text-text-primary">
              Membresías · {pendingCount ?? 0}
            </span>
          </div>
          <Link
            href="/admin/roles"
            className="rounded-[11px] h-[38px] flex-1 flex items-center justify-center"
          >
            <span className="font-display text-[13px] font-medium text-text-muted">
              Roles · {rolesCount ?? 0}
            </span>
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {requests.length === 0 ? (
            <p className="font-body text-[14px] text-text-muted text-center py-8">
              No hay solicitudes pendientes
            </p>
          ) : (
            requests.map((r) => <RequestCard key={r.id} request={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
