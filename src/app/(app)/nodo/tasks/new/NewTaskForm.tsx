"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { TaskForm } from "@/features/tasks/TaskForm";
import { createTask } from "@/features/tasks/actions";

export function NewTaskForm() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Cerrar"
          // `back()` respeta de dónde vino el usuario, pero si esta pantalla es
          // la primera del historial (deep link, atajo de la PWA, pestaña nueva
          // o recarga) no tiene a dónde volver: quedaría muerto, o en una PWA
          // standalone saldría de la app.
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/nodo/tasks"))}
          className="rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="size-6 text-text-primary" />
        </button>
        <h1 className="font-display text-base font-medium text-text-primary">Nueva tarea</h1>
        {/* Contrapeso del ícono: mantiene el título ópticamente centrado. */}
        <span aria-hidden="true" className="size-6" />
      </div>

      <TaskForm action={createTask} submitLabel="Publicar tarea" pendingLabel="Publicando..." />
    </div>
  );
}
