import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlantelList } from "@/features/plantel/PlantelList";
import { buildSerranoMembers } from "@/features/plantel/transform";

const PLANTEL_PROFILE_COLUMNS =
  "id, nombre, apellido, apodo, nombre_visible, avatar_url, tier, disponibilidad, is_platform_admin";

export default async function PlantelPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { data: profiles },
    { data: roleAssignments },
    { data: skillAssignments },
    { data: roleCatalog },
    { data: skillCatalog },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(PLANTEL_PROFILE_COLUMNS)
      .neq("tier", "tourist")
      .order("nombre", { ascending: true }),
    supabase.from("profile_roles").select("profile_id, roles(nombre)").eq("confirmado", true),
    supabase.from("profile_skills").select("profile_id, skills(nombre)"),
    supabase.from("roles").select("nombre").order("nombre", { ascending: true }),
    supabase.from("skills").select("nombre").order("nombre", { ascending: true }),
  ]);

  const members = buildSerranoMembers(
    profiles ?? [],
    roleAssignments ?? [],
    skillAssignments ?? [],
  );

  const roleOptions = (roleCatalog ?? [])
    .map((row) => row.nombre)
    .filter((nombre): nombre is string => Boolean(nombre));
  const skillOptions = (skillCatalog ?? [])
    .map((row) => row.nombre)
    .filter((nombre): nombre is string => Boolean(nombre));

  return <PlantelList members={members} roleOptions={roleOptions} skillOptions={skillOptions} />;
}
