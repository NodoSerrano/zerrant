import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/features/profile/displayName";
import { TaskDetailView } from "@/features/tasks/TaskDetailView";
import type { Profile } from "@/features/profile/types";

// Since ZER-43 `authenticated` can only read some profile columns (tarifa_hora
// is masked), so `*` on profiles fails with 42501. Name the columns (ZER-194).
const PERSON_COLUMNS = "id, nombre, apellido, apodo, nombre_visible";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: task } = await supabase
    .from("tasks")
    // Named columns only, like the profiles join: `*` breaks with column-level grants (ZER-194, ZER-220).
    .select(
      `id, titulo, descripcion, categoria, urgencia, estado, creado_por, tomada_por, created_at, creador:creado_por(${PERSON_COLUMNS}), tomador:tomada_por(${PERSON_COLUMNS})`,
    )
    .eq("id", id)
    .single();

  if (!task) notFound();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, tier, is_platform_admin")
    .eq("id", user.id)
    .single();

  type Person = Pick<Profile, "id" | "nombre" | "apellido" | "apodo" | "nombre_visible">;
  const creador = task.creador as unknown as Person | null;
  const tomador = task.tomador as unknown as Person | null;

  const canAssign =
    (task.creado_por === user.id || Boolean(currentProfile?.is_platform_admin)) &&
    (task.estado === "abierta" || task.estado === "tomada") &&
    Boolean(
      currentProfile && (currentProfile.tier !== "tourist" || currentProfile.is_platform_admin),
    );

  let assignees: { id: string; name: string }[] = [];
  if (canAssign) {
    const { data: people } = await supabase
      .from("profiles")
      .select(PERSON_COLUMNS)
      .neq("tier", "tourist");
    assignees = (people ?? []).flatMap((person) => {
      const name = displayName(person);
      return name ? [{ id: person.id, name }] : [];
    });
  }

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
      tomador={tomador ? displayName(tomador) : null}
      isOwner={task.creado_por === user.id}
      isTaker={task.tomada_por === user.id}
      isAdmin={currentProfile?.is_platform_admin ?? false}
      isSerrano={Boolean(currentProfile && currentProfile.tier !== "tourist")}
      assignees={assignees}
    />
  );
}
