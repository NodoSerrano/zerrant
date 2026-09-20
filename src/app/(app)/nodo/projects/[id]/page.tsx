import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetail } from "@/features/projects/ProjectDetail";
import {
  toApprovedProjectMembers,
  type RawProjectMember,
} from "@/features/projects/detail-transform";
import {
  isProjectAdmin,
  resolveJoinAffordance,
  type ViewerMembership,
} from "@/features/projects/membership";
import type { ProjectDetailViewModel } from "@/features/projects/types";
import type { ProjectMemberEstado, ProjectMemberRol } from "@/lib/db/projects-schema";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ProjectRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  ingreso: string;
  creado_por: string | null;
  project_members: RawProjectMember[] | null;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, nombre, descripcion, estado, ingreso, creado_por, project_members(profile_id, estado, rol, profiles:profile_id(id, nombre, apellido, apodo, nombre_visible, avatar_url))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!project?.id) notFound();

  const row = project as unknown as ProjectRow;

  const { data: viewerRow } = await supabase
    .from("project_members")
    .select("estado, rol")
    .eq("project_id", id)
    .eq("profile_id", user.id)
    .maybeSingle();

  const viewerMembership: ViewerMembership | null = viewerRow
    ? {
        estado: viewerRow.estado as ProjectMemberEstado,
        rol: viewerRow.rol as ProjectMemberRol,
      }
    : null;

  const members = toApprovedProjectMembers(row.project_members, row.creado_por);
  const affordance = resolveJoinAffordance({
    ingreso: row.ingreso,
    viewerMembership,
  });

  const viewerIsAdmin = isProjectAdmin({ viewerMembership });

  const viewModel: ProjectDetailViewModel = {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    estado: row.estado,
    ingreso: row.ingreso,
    members,
    affordance,
    showRequestsQueue: viewerIsAdmin,
    canPromoteMembers: viewerIsAdmin,
  };

  return <ProjectDetail project={viewModel} />;
}
