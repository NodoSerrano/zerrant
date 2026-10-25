import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlantelList } from "@/features/plantel/PlantelList";
import { buildSerranoMembers } from "@/features/plantel/transform";
import { SerSerranoCta } from "@/features/membership/SerSerranoCta";
import { resolveSerSerranoCtaVisibility } from "@/features/membership/ser-serrano-cta-server";

const PLANTEL_PROFILE_COLUMNS =
  "id, nombre, apellido, apodo, nombre_visible, avatar_url, tier, is_platform_admin";

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
    showSerSerranoCta,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(PLANTEL_PROFILE_COLUMNS)
      .neq("tier", "tourist")
      .order("nombre", { ascending: true }),
    supabase.from("profile_roles").select("profile_id, roles(nombre)").eq("confirmado", true),
    supabase.from("profile_skills").select("profile_id, skills(nombre)"),
    supabase.from("roles").select("nombre").order("nombre", { ascending: true }),
    // Approved catalog only: pending proposals (ZER-163) are not filter options.
    supabase
      .from("skills")
      .select("nombre")
      .eq("estado", "aprobada")
      .order("nombre", { ascending: true }),
    supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) =>
        resolveSerSerranoCtaVisibility(user.id, {
          client: supabase,
          tier: data?.tier ?? null,
        }),
      ),
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

  const list = (
    <PlantelList members={members} roleOptions={roleOptions} skillOptions={skillOptions} />
  );
  if (!showSerSerranoCta) return list;

  return (
    <div className="flex flex-col gap-4">
      <SerSerranoCta />
      {list}
    </div>
  );
}
