import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "@/features/tasks/TaskForm";
import { TaskMenu } from "@/features/tasks/TaskMenu";
import { updateTask } from "@/features/tasks/actions";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).single();

  if (!task) notFound();

  // Defense in depth: this redirect is UX, so we don't show a form that
  // couldn't be submitted. The real guard lives in `updateTask`, because a
  // direct POST skips this render.
  if (task.creado_por !== user.id) redirect(`/nodo/tasks/${id}`);

  // Edit only while nobody has committed to the task. `updateTask` repeats
  // the filter, because a direct POST skips this render.
  if (task.estado !== "abierta") redirect(`/nodo/tasks/${id}`);

  return (
    <div className="flex w-full flex-col gap-[18px]">
      <div className="flex flex-row items-center justify-between w-full">
        {/* The frame uses chevron-left, not the `x` from create task: editing
            is backward navigation, not the closing of a modal. */}
        <Link href={`/nodo/tasks/${id}`} aria-label="Volver a la tarea">
          <ChevronLeft className="size-6 text-text-primary" />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Editar tarea</h1>
        {/* The guard above only lets open tasks through, so the menu always
            renders. The counterweight stays in case that guard changes:
            without it, `justify-between` collapses to two children and the
            title shifts. */}
        {task.estado === "abierta" ? (
          <TaskMenu taskId={task.id} estado={task.estado} isOwner showEditItem={false} />
        ) : (
          <span aria-hidden="true" className="size-[22px]" />
        )}
      </div>

      <TaskForm
        action={updateTask}
        submitLabel="Guardar cambios"
        pendingLabel="Guardando..."
        hiddenFields={{ taskId: task.id }}
        defaults={{
          titulo: task.titulo,
          descripcion: task.descripcion ?? "",
          categoria: task.categoria,
          urgencia: task.urgencia,
        }}
      />
    </div>
  );
}
