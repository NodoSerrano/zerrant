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

  // Defensa en profundidad: este redirect es UX, para no mostrar un formulario
  // que no se va a poder enviar. La guarda de verdad vive en `updateTask`,
  // porque un POST directo se saltea el render.
  if (task.creado_por !== user.id) redirect(`/nodo/tasks/${id}`);

  // Editar sólo mientras nadie se comprometió con la tarea. `updateTask` repite
  // el filtro, porque un POST directo se saltea este render.
  if (task.estado !== "abierta") redirect(`/nodo/tasks/${id}`);

  return (
    <div className="flex w-full flex-col gap-[18px]">
      <div className="flex flex-row items-center justify-between w-full">
        {/* El frame usa chevron-left, no la `x` de crear tarea: editar es una
            navegación hacia atrás, no el cierre de un modal. */}
        <Link href={`/nodo/tasks/${id}`} aria-label="Volver a la tarea">
          <ChevronLeft className="size-6 text-text-primary" />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Editar tarea</h1>
        {/* La guarda de arriba ya deja pasar sólo tareas abiertas, así que el
            menú siempre se dibuja. El contrapeso queda por si esa guarda cambia:
            sin él, `justify-between` colapsa a dos hijos y el título se corre. */}
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
