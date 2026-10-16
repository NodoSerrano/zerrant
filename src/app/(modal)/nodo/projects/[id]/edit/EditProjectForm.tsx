"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProjectForm } from "@/features/projects/ProjectForm";
import { archiveProject, updateProject } from "@/features/projects/actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

interface EditProjectFormProps {
  projectId: string;
  defaults: {
    nombre: string;
    descripcion: string;
    estado: string;
    ingreso: string;
  };
}

export function EditProjectForm({ projectId, defaults }: EditProjectFormProps) {
  const [confirming, setConfirming] = useState(false);
  const [archiveState, archiveAction, archivePending] = useGuardedActionState(archiveProject, null);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/nodo/projects/${projectId}`}
          aria-label="Volver al proyecto"
          className="flex items-center justify-center rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ChevronLeft className="size-6 text-text-primary" />
        </Link>
        <h1 className="font-display text-base font-medium text-text-primary">Editar proyecto</h1>
        <span aria-hidden="true" className="size-6" />
      </div>

      <ProjectForm
        action={updateProject}
        submitLabel="Guardar cambios"
        pendingLabel="Guardando..."
        defaults={defaults}
        hiddenFields={{ projectId }}
      />

      <div className="flex w-full flex-col items-center gap-3 pt-1">
        <button
          type="button"
          aria-expanded={confirming}
          aria-controls="archive-confirm"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center justify-center font-display text-[15px] font-medium text-coral focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Archivar proyecto
        </button>
        {confirming ? (
          <form
            id="archive-confirm"
            action={archiveAction}
            className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <p className="font-body text-sm text-text-primary">
              El proyecto queda como Terminado. Los miembros y las solicitudes de ingreso siguen en
              este proyecto. Terminado no bloquea el proyecto: un admin puede volver a Idea o En
              curso.
            </p>
            {archiveState?.error ? (
              <p role="alert" className="font-body text-xs text-coral">
                {archiveState.error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={archivePending}
                className="flex-1 whitespace-nowrap rounded-pill bg-coral/10 px-3 py-2 font-display text-[13px] font-semibold text-coral focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
              >
                {archivePending ? "Archivando..." : "Sí, archivar"}
              </button>
              <button
                type="button"
                disabled={archivePending}
                onClick={() => setConfirming(false)}
                className="flex-1 whitespace-nowrap rounded-pill border border-border px-3 py-2 font-display text-[13px] font-semibold text-text-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
              >
                Volver
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
