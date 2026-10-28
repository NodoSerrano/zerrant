"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";
import { ProjectForm } from "@/features/projects/ProjectForm";
import { archiveProject, updateProject } from "@/features/projects/actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { FormFeedback } from "@/components/FormFeedback";

interface EditProjectFormProps {
  projectId: string;
  /** Already archived: nothing left to archive (ZER-201). */
  archived?: boolean;
  defaults: {
    nombre: string;
    descripcion: string;
    estado: string;
    ingreso: string;
  };
}

export function EditProjectForm({ projectId, archived = false, defaults }: EditProjectFormProps) {
  const [confirming, setConfirming] = useState(false);
  const [archiveState, archiveAction, archivePending] = useGuardedActionState(archiveProject, null);

  // Cancel = X, tap outside or Escape; the only button is "Sí, archivar" (ZER-201).
  const cancel = () => {
    if (!archivePending) setConfirming(false);
  };

  useEffect(() => {
    if (!confirming) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !archivePending) setConfirming(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirming, archivePending]);

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

      {archived ? null : (
        <div className="flex w-full flex-col items-center gap-3 pt-1">
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center justify-center font-display text-[15px] font-medium text-coral focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Archivar proyecto
          </button>
        </div>
      )}

      {confirming ? (
        <div
          data-testid="archive-backdrop"
          onClick={cancel}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5"
        >
          <form
            action={archiveAction}
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-confirm-title"
            onClick={(event) => event.stopPropagation()}
            className="relative flex w-full max-w-lg flex-col gap-3 rounded-2xl border border-border bg-surface p-4 pr-12"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="button"
              aria-label="Cancelar"
              disabled={archivePending}
              onClick={cancel}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-text-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <h2
              id="archive-confirm-title"
              className="font-display text-[15px] font-semibold text-text-primary"
            >
              Archivar proyecto
            </h2>
            <p className="font-body text-sm text-text-primary">
              Queda Pausado, deja de aparecer en Proyectos y pasa a Archivados. Los miembros y las
              solicitudes de ingreso siguen en este proyecto.
            </p>
            <FormFeedback error={archiveState?.error} />
            <button
              type="submit"
              disabled={archivePending}
              className="w-full whitespace-nowrap rounded-pill bg-coral/10 px-3 py-2 font-display text-[13px] font-semibold text-on-coral-tint focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
            >
              {archivePending ? "Archivando..." : "Sí, archivar"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
