"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { createTask } from "@/features/tasks/actions";
import { cn } from "@/lib/utils";

const CATEGORIAS = [
  { value: "reparacion", label: "Reparación" },
  { value: "limpieza", label: "Limpieza" },
  { value: "compra", label: "Compra" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "otro", label: "Otro" },
];

const URGENCIAS = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

const GROUP_LABEL = "text-[13px] font-medium text-text-secondary";

// El radio va visualmente oculto pero sigue siendo el control real: así el form
// funciona sin JS, FormData sigue llevando el valor y el foco de teclado se
// conserva. El estilo del "seleccionado" sale de `has-checked:` sobre el label.
const FOCUS_RING = "has-focus-visible:ring-2 has-focus-visible:ring-primary/40";

export function NewTaskForm() {
  const [state, action, pending] = useActionState(createTask, null);
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

      {/* El CTA es hermano del grupo de campos, no hijo: en Pencil el form
          `MWvoK` (gap 16) y el botón cuelgan los dos del wrapper con gap 18. */}
      <form action={action} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-4">
          <Input name="titulo" label="Título" placeholder="Ej: Reparar el caño del baño" required />

          <div className="flex flex-col gap-[7px]">
            <label htmlFor="descripcion" className={GROUP_LABEL}>
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              placeholder="¿Qué hay que hacer y dónde?"
              className={cn(
                "h-[84px] rounded-2xl border border-border bg-surface p-4",
                "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
                "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
              )}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className={GROUP_LABEL}>Categoría</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((c) => (
                <label
                  key={c.value}
                  className={cn(
                    "inline-flex cursor-pointer items-center rounded-pill border px-[14px] py-2",
                    "font-display text-[13px] font-medium transition-colors",
                    "border-border bg-surface text-text-secondary",
                    // Pencil quita el stroke en el chip activo. Usamos un borde
                    // del mismo color que el fondo: se ve igual y no mueve nada.
                    "has-checked:border-primary has-checked:bg-primary has-checked:text-on-primary",
                    FOCUS_RING,
                  )}
                >
                  <input
                    type="radio"
                    name="categoria"
                    value={c.value}
                    defaultChecked={c.value === "reparacion"}
                    className="sr-only"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className={GROUP_LABEL}>Urgencia</legend>
            <div className="flex gap-1 rounded-2xl bg-surface-inset p-1">
              {URGENCIAS.map((u) => (
                <label
                  key={u.value}
                  className={cn(
                    "flex h-[38px] flex-1 cursor-pointer items-center justify-center rounded-xl",
                    "font-display text-[13px] font-medium transition-colors",
                    "text-text-muted",
                    "has-checked:bg-primary has-checked:text-on-primary",
                    FOCUS_RING,
                  )}
                >
                  <input
                    type="radio"
                    name="urgencia"
                    value={u.value}
                    defaultChecked={u.value === "media"}
                    className="sr-only"
                  />
                  {u.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {state?.error && (
          <p role="alert" className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={pending} className="w-full">
          {pending ? "Publicando..." : "Publicar tarea"}
        </PrimaryButton>
      </form>
    </div>
  );
}
