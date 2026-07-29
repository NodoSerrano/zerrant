import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/features/profile/displayName";
import { TaskDetailView } from "@/features/tasks/TaskDetailView";
import type { Profile } from "@/features/profile/types";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: task } = await supabase
    .from("tasks")
    .select("*, creador:creado_por(*), tomador:tomada_por(*)")
    .eq("id", id)
    .single();

  if (!task) notFound();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const creador = task.creador as unknown as Profile | null;

  return (
    <TaskDetailView
      taskId={task.id}
      titulo={task.titulo}
      descripcion={task.descripcion}
      categoria={task.categoria}
      urgencia={task.urgencia ?? "media"}
      estado={task.estado ?? "abierta"}
      createdAt={task.created_at}
      autor={creador ? displayName(creador) : null}
      isOwner={task.creado_por === user.id}
      isTaker={task.tomada_por === user.id}
      isAdmin={currentProfile?.is_platform_admin ?? false}
      isSerrano={Boolean(currentProfile && currentProfile.tier !== "tourist")}
    />
  );
}
