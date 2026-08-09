import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { displayName } from "@/features/profile/displayName";
import { RolesConfirmationPanel } from "@/features/roles/roles-confirmation-panel";
import type { PendingProfile } from "@/features/roles/roles-confirmation-panel";

interface ProfileJoined {
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: "apodo" | "nombre_apellido" | "apellido_nombre";
}

interface RoleJoined {
  nombre: string;
}

type PendingRoleRow = {
  profile_id: string;
  role_id: string;
  profiles: ProfileJoined | null;
  roles: RoleJoined | null;
};

function profileName(p: ProfileJoined | null, fallback: string): string {
  if (!p) return fallback;
  return (
    displayName({
      id: "",
      nombre: p.nombre,
      apellido: p.apellido,
      apodo: p.apodo,
      nombre_visible: p.nombre_visible,
    } as Parameters<typeof displayName>[0]) || fallback
  );
}

export default async function AdminRolesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) {
    redirect("/");
  }

  const { data } = await supabase
    .from("profile_roles")
    .select(
      "profile_id, role_id, profiles:profile_id(nombre, apellido, apodo, nombre_visible), roles:role_id(nombre)",
    )
    .eq("confirmado", false)
    .order("profile_id");

  if (!data) {
    return <RolesConfirmationPanel data={[]} />;
  }

  const pendingRoles = data as unknown as PendingRoleRow[];

  const profileMap = new Map<string, PendingProfile>();

  for (const pr of pendingRoles) {
    if (!profileMap.has(pr.profile_id)) {
      profileMap.set(pr.profile_id, {
        profileId: pr.profile_id,
        profileName: profileName(pr.profiles, pr.profile_id.slice(0, 8)),
        roles: [],
      });
    }
    profileMap.get(pr.profile_id)!.roles.push({
      roleId: pr.role_id,
      roleName: pr.roles?.nombre || pr.role_id.slice(0, 8),
    });
  }

  return <RolesConfirmationPanel data={Array.from(profileMap.values())} />;
}
