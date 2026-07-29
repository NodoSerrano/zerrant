"use client";

import { useActionState } from "react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { cn } from "@/lib/utils";

// Crear y editar comparten el mismo formulario: los frames `V0ODk` y `H3BY0u`
// sólo se diferencian en el header y en la etiqueta del CTA. Vive acá para que
// un cambio de diseño en los campos no haya que aplicarlo dos veces.

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

type TaskFormState = { error: string } | null;

type TaskFormAction = (state: TaskFormState, formData: FormData) => Promise<TaskFormState>;

interface TaskFormDefaults {
  titulo?: string;
  descripcion?: string;
  categoria?: string;
  urgencia?: string;
}

interface TaskFormProps {
  action: TaskFormAction;
  submitLabel: string;
  pendingLabel: string;
  defaults?: TaskFormDefaults;
  /** Campos que viajan en el submit sin que el usuario los vea, como `taskId`. */
  hiddenFields?: Record<string, string>;
}

export function TaskForm({
  action,
  submitLabel,
  pendingLabel,
  defaults,
  hiddenFields,
}: TaskFormProps) {
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(action, null);

  const categoria = defaults?.categoria ?? "reparacion";
  const urgencia = defaults?.urgencia ?? "media";

  return (
    // El CTA es hermano del grupo de campos, no hijo: en Pencil el form
    // (gap 16) y el botón cuelgan los dos del wrapper con gap 18.
    <form action={formAction} className="flex flex-col gap-[18px]">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <div className="flex flex-col gap-4">
        <Input
          name="titulo"
          label="Título"
          placeholder="Ej: Reparar el caño del baño"
          defaultValue={defaults?.titulo}
          required
        />

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="descripcion" className={GROUP_LABEL}>
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            placeholder="¿Qué hay que hacer y dónde?"
            defaultValue={defaults?.descripcion ?? ""}
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
                  defaultChecked={c.value === categoria}
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
                  defaultChecked={u.value === urgencia}
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
        {pending ? pendingLabel : submitLabel}
      </PrimaryButton>
    </form>
  );
}
