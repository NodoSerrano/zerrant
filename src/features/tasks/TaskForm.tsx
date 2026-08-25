"use client";

import { useActionState } from "react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { cn } from "@/lib/utils";

// Create and edit share the same form: Pencil frames `V0ODk` and `H3BY0u`
// differ only in the header and the CTA label. It lives here so a design
// change to the fields doesn't have to be applied twice.

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

// The radio is visually hidden but remains the real control: this way the
// form works without JS, FormData still carries the value and keyboard focus
// is preserved. The "selected" styling comes from `has-checked:` on the label.
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
  /** Fields that travel with the submit without the user seeing them, like `taskId`. */
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
    // The CTA is a sibling of the field group, not a child: in Pencil the
    // form (gap 16) and the button both hang from the wrapper with gap 18.
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
                  // Pencil removes the stroke on the active chip. We use a
                  // border the same color as the background: it looks the same
                  // and doesn't shift anything.
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
