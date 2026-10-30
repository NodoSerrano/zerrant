import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberDetail } from "@/features/plantel/MemberDetail";
import { buildSerranoMemberDetail } from "@/features/plantel/transform";
import type { AporteListItem } from "@/features/aportes/types";
import type { MemberProjectPreview } from "@/features/plantel/types";

const DETAIL_PROFILE_COLUMNS =
  "id, nombre, apellido, apodo, nombre_visible, avatar_url, tier, bio, contacto_telegram, is_platform_admin";

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

  if (!profile?.id || !profile.tier || !profile.nombre_visible) {
    notFound();
  }

  if (profile.tier === "tourist") redirect("/plantel");

  const [
    { data: roleAssignments },
    { data: skillAssignments },
    { data: aporteRows },
    { data: projectMemberRows },
  ] = await Promise.all([
    supabase
      .from("profile_roles")
      .select("roles(nombre)")
      .eq("profile_id", id)
      .eq("confirmado", true),
    supabase.from("profile_skills").select("skills(nombre)").eq("profile_id", id),
    // Serrano-only SELECT: refused/empty → empty list (no crash, no sample rows).
    supabase
      .from("aportes")
      .select("id, tipo, descripcion, monto, fecha")
      .eq("profile_id", id)
      .order("fecha", { ascending: false }),
    // Only aprobado memberships — pendiente must never leak into the list.
    supabase
      .from("project_members")
      .select("project_id, projects:project_id(id, nombre, archivado_en)")
      .eq("profile_id", id)
      .eq("estado", "aprobado")
      .order("created_at", { ascending: false }),
  ]);

  const aportes = (aporteRows ?? []) as AporteListItem[];

  type MemberProjectRow = { id: string; nombre: string; archivado_en: string | null };
  type ProjectMemberJoin = {
    project_id: string;
    projects: MemberProjectRow | MemberProjectRow[] | null;
  };

  const proyectos: MemberProjectPreview[] = ((projectMemberRows ?? []) as ProjectMemberJoin[])
    .map((row) => {
      const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
      // Archived projects leave every list but Proyectos > Archivados (ZER-201).
      if (!project?.id || !project.nombre || project.archivado_en) return null;
      return { id: project.id, nombre: project.nombre };
    })
    .filter((row): row is MemberProjectPreview => row !== null);

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
      bio: profile.bio,
      contacto_telegram: profile.contacto_telegram,
      is_platform_admin: profile.is_platform_admin === true,
    },
    roles,
    skills,
    {
      aportes,
      proyectos,
    },
  );

  return <MemberDetail member={member} />;
}
