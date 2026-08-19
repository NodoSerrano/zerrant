import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberDetail } from "@/features/plantel/MemberDetail";
import { buildSerranoMemberDetail } from "@/features/plantel/transform";

const DETAIL_PROFILE_COLUMNS =
  "id, nombre, apellido, apodo, nombre_visible, avatar_url, tier, disponibilidad, bio, contacto_telegram, tarifa_hora, visibilidad_tarifa";

export default async function PlantelMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(DETAIL_PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  if (profile.tier === "tourist") redirect("/plantel");

  const [{ data: roleAssignments }, { data: skillAssignments }, { data: viewerProfile }] =
    await Promise.all([
      supabase
        .from("profile_roles")
        .select("roles(nombre)")
        .eq("profile_id", id)
        .eq("confirmado", true),
      supabase.from("profile_skills").select("skills(nombre)").eq("profile_id", id),
      supabase.from("profiles").select("id, is_platform_admin").eq("id", user.id).single(),
    ]);

  const roles = (roleAssignments ?? [])
    .map((assignment) => assignment.roles?.nombre)
    .filter((name): name is string => Boolean(name));

  const skills = (skillAssignments ?? [])
    .map((assignment) => assignment.skills?.nombre)
    .filter((name): name is string => Boolean(name));

  const member = buildSerranoMemberDetail(profile, roles, skills, {
    isSelf: user.id === id,
    isAdmin: viewerProfile?.is_platform_admin ?? false,
  });

  return <MemberDetail member={member} />;
}
