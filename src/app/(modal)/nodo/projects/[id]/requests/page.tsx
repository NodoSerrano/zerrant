import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinRequestQueue } from "@/features/projects/JoinRequestQueue";
import {
  toJoinRequestQueue,
  type RawJoinRequestRow,
} from "@/features/projects/join-request-transform";
import { isProjectAdmin, type ViewerMembership } from "@/features/projects/membership";
import type { ProjectMemberEstado, ProjectMemberRol } from "@/lib/db/projects-schema";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ProjectRow = {
  id: string;
  nombre: string;
};

export default async function ProjectJoinRequestsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, nombre")
    .eq("id", id)
    .maybeSingle();

  if (!project?.id) notFound();
  const row = project as ProjectRow;

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

  // Route guard is ergonomics only — RLS still guards every write.
  if (!isProjectAdmin({ viewerMembership })) {
    redirect(`/nodo/projects/${id}`);
  }

  const { data: pendingRows } = await supabase
    .from("project_members")
    .select(
      "profile_id, estado, created_at, profiles:profile_id(id, nombre, apellido, apodo, nombre_visible, avatar_url)",
    )
    .eq("project_id", id)
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  const requests = toJoinRequestQueue((pendingRows ?? []) as unknown as RawJoinRequestRow[]);

  return <JoinRequestQueue projectId={row.id} projectName={row.nombre} requests={requests} />;
}
