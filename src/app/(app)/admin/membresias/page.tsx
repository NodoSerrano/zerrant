import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RequestCard } from "@/components/RequestCard";
import type { Profile } from "@/features/profile/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminMembresiasPage() {
  const supabase = await createClient();

  const { count: pendingCount, data: pendingRequests } = await supabase
    .from("membership_requests")
    .select(
      "id, mensaje, created_at, profiles!membership_requests_profile_id_fkey(nombre, apellido, apodo, nombre_visible, avatar_url, tier, id)",
      { count: "exact" },
    )
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  type RequestWithProfile = {
    id: string;
    mensaje: string | null;
    created_at: string;
    profiles: Profile;
  };

  const requests: RequestWithProfile[] = Array.isArray(pendingRequests)
    ? (pendingRequests as unknown as RequestWithProfile[])
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="flex flex-col gap-[18px] px-5 pt-6 pb-6">
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
            <span className="font-display text-[14px] font-bold text-white">
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
          <div className="rounded-[11px] h-[38px] flex-1 flex items-center justify-center">
            <span className="font-display text-[13px] font-medium text-text-muted">
              Roles · 0
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {requests.length === 0 ? (
            <p className="font-body text-[14px] text-text-muted text-center py-8">
              No hay solicitudes pendientes
            </p>
          ) : (
            requests.map((r) => (
              <RequestCard
                key={r.id}
                request={{
                  id: r.id,
                  profile: r.profiles,
                  mensaje: r.mensaje,
                  created_at: r.created_at,
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
