import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/features/profile/displayName";
import {
  RolesConfirmationPanel,
  type PendingProfile,
} from "@/features/roles/roles-confirmation-panel";
import type { Profile } from "@/features/profile/types";

export const dynamic = "force-dynamic";

type ProfileEmbed = Pick<Profile, "id" | "nombre" | "apellido" | "apodo" | "nombre_visible">;

type PendingRoleRow = {
  profile_id: string;
  role_id: string;
  profiles: ProfileEmbed | null;
  roles: { nombre: string } | null;
};

export default async function AdminRolesPage() {
  const supabase = await createClient();

  const [{ count: membershipCount }, { data: pendingRows }] = await Promise.all([
    supabase
      .from("membership_requests")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente"),
    supabase
      .from("profile_roles")
      .select(
        "profile_id, role_id, profiles!profile_roles_profile_id_fkey(id, nombre, apellido, apodo, nombre_visible), roles!profile_roles_role_id_fkey(nombre)",
      )
      .eq("confirmado", false)
      .order("profile_id"),
  ]);

  const rows = Array.isArray(pendingRows) ? pendingRows : [];

  const profileMap = new Map<string, PendingProfile>();

  for (const raw of rows) {
    const row = raw as PendingRoleRow;
    if (!row || typeof row !== "object") continue;
    if (!row.profiles || typeof row.profiles !== "object") continue;

    if (!profileMap.has(row.profile_id)) {
      profileMap.set(row.profile_id, {
        profileId: row.profile_id,
        profileName: displayName(row.profiles as Profile) || row.profile_id.slice(0, 8),
        roles: [],
      });
    }

    profileMap.get(row.profile_id)!.roles.push({
      roleId: row.role_id,
      roleName: row.roles?.nombre || row.role_id.slice(0, 8),
    });
  }

  const pendingProfiles = Array.from(profileMap.values());
  const rolesCount = pendingProfiles.reduce((n, p) => n + p.roles.length, 0);

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
              Roles pendientes
            </h1>
            <p className="font-body text-[13px] text-text-secondary">
              Confirmá roles autoasignados por la comunidad
            </p>
          </div>
          <div className="rounded-pill bg-coral px-[13px] py-[7px]">
            <span className="font-display text-[14px] font-bold text-white">{rolesCount}</span>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-[14px] bg-surface-inset">
          <Link
            href="/admin/membresias"
            className="rounded-[11px] h-[38px] flex-1 flex items-center justify-center"
          >
            <span className="font-display text-[13px] font-medium text-text-muted">
              Membresías · {membershipCount ?? 0}
            </span>
          </Link>
          <div className="rounded-[11px] bg-surface h-[38px] flex-1 flex items-center justify-center shadow-[0_2px_6px_#1a161418]">
            <span className="font-display text-[13px] font-semibold text-text-primary">
              Roles · {rolesCount}
            </span>
          </div>
        </div>

        <RolesConfirmationPanel data={pendingProfiles} />
      </div>
    </div>
  );
}
