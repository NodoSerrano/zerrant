import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberDetail } from "@/features/plantel/MemberDetail";
import { buildSerranoMemberDetail } from "@/features/plantel/transform";
import type { AporteListItem } from "@/features/aportes/types";

const DETAIL_PROFILE_COLUMNS =
  "id, nombre, apellido, apodo, nombre_visible, avatar_url, tier, disponibilidad, bio, contacto_telegram, tarifa_hora, visibilidad_tarifa";

export default async function PlantelMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // ZER-43: rate-bearing reads use profiles_with_rate (DB-masked tarifa_hora).
  const { data: profile } = await supabase
    .from("profiles_with_rate")
    .select(DETAIL_PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (!profile?.id || !profile.tier || !profile.nombre_visible || !profile.visibilidad_tarifa) {
    notFound();
  }

  if (profile.tier === "tourist") redirect("/plantel");

  const [
    { data: roleAssignments },
    { data: skillAssignments },
    { data: viewerProfile },
    { data: aporteRows },
  ] = await Promise.all([
    supabase
      .from("profile_roles")
      .select("roles(nombre)")
      .eq("profile_id", id)
      .eq("confirmado", true),
    supabase.from("profile_skills").select("skills(nombre)").eq("profile_id", id),
    supabase.from("profiles").select("id, is_platform_admin, tier").eq("id", user.id).single(),
    // Serrano-only SELECT: refused/empty → empty list (no crash, no sample rows).
    supabase
      .from("aportes")
      .select("id, tipo, descripcion, monto, fecha")
      .eq("profile_id", id)
      .order("fecha", { ascending: false }),
  ]);

  const aportes = (aporteRows ?? []) as AporteListItem[];

  const roles = (roleAssignments ?? [])
    .map((assignment) => assignment.roles?.nombre)
    .filter((name): name is string => Boolean(name));

  const skills = (skillAssignments ?? [])
    .map((assignment) => assignment.skills?.nombre)
    .filter((name): name is string => Boolean(name));

  const member = buildSerranoMemberDetail(
    {
      id: profile.id,
      nombre: profile.nombre,
      apellido: profile.apellido,
      apodo: profile.apodo,
      nombre_visible: profile.nombre_visible,
      avatar_url: profile.avatar_url,
      tier: profile.tier,
      disponibilidad: profile.disponibilidad,
      bio: profile.bio,
      contacto_telegram: profile.contacto_telegram,
      tarifa_hora: profile.tarifa_hora,
      visibilidad_tarifa: profile.visibilidad_tarifa,
    },
    roles,
    skills,
    {
      isSelf: user.id === id,
      isAdmin: viewerProfile?.is_platform_admin ?? false,
      isTourist: viewerProfile?.tier === "tourist",
      aportes,
    },
  );

  return <MemberDetail member={member} />;
}
