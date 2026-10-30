import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isProjectAdmin, type ViewerMembership } from "@/features/projects/membership";
import type { ProjectMemberEstado, ProjectMemberRol } from "@/lib/db/projects-schema";
import { EditProjectForm } from "./EditProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, nombre, descripcion, estado, ingreso, archivado_en")
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();

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

  if (!isProjectAdmin({ viewerMembership })) {
    redirect(`/nodo/projects/${id}`);
  }

  return (
    <EditProjectForm
      projectId={project.id}
      archived={Boolean(project.archivado_en)}
      defaults={{
        nombre: project.nombre,
        descripcion: project.descripcion ?? "",
        estado: project.estado,
        ingreso: project.ingreso,
      }}
    />
  );
}
