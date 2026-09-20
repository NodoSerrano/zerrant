"use client";

import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
import { PROJECT_ESTADO_OPTIONS, PROJECT_INGRESO_OPTIONS } from "./types";

const GROUP_LABEL = "text-[13px] font-medium text-text-secondary";
const FOCUS_RING = "has-focus-visible:ring-2 has-focus-visible:ring-primary/40";

type ProjectFormState = { error: string } | null;
type ProjectFormAction = (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;

interface ProjectFormDefaults {
  nombre?: string;
  descripcion?: string;
  estado?: string;
  ingreso?: string;
}

interface ProjectFormProps {
  action: ProjectFormAction;
  submitLabel: string;
  pendingLabel: string;
  defaults?: ProjectFormDefaults;
}

export function ProjectForm({ action, submitLabel, pendingLabel, defaults }: ProjectFormProps) {
  const [state, formAction, pending] = useGuardedActionState(action, null);

  const estado = defaults?.estado ?? "idea";
  const ingreso = defaults?.ingreso ?? "aprobacion";

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-4">
        <Input
          name="nombre"
          label="Nombre"
          placeholder="Ej: Sitio web de Nodo"
          defaultValue={defaults?.nombre}
          required
        />

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="descripcion" className={GROUP_LABEL}>
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            placeholder="¿De qué se trata? ¿Qué buscás?"
            defaultValue={defaults?.descripcion ?? ""}
            className={cn(
              "h-[84px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={GROUP_LABEL}>Estado</legend>
          <div className="flex flex-wrap gap-2">
            {PROJECT_ESTADO_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "inline-flex cursor-pointer items-center rounded-pill border px-[14px] py-2",
                  "font-display text-[13px] font-medium transition-colors",
                  "border-border bg-surface text-text-secondary",
                  "has-checked:border-primary has-checked:bg-primary has-checked:text-on-primary",
                  FOCUS_RING,
                )}
              >
                <input
                  type="radio"
                  name="estado"
                  value={option.value}
                  defaultChecked={option.value === estado}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={GROUP_LABEL}>¿Quién puede unirse?</legend>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {PROJECT_INGRESO_OPTIONS.map((option, index) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-[13px] py-4",
                  index > 0 && "border-t border-border",
                  FOCUS_RING,
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border",
                    "has-[:checked]:border-primary has-[:checked]:bg-primary",
                  )}
                >
                  <input
                    type="radio"
                    name="ingreso"
                    value={option.value}
                    aria-label={option.label}
                    defaultChecked={option.value === ingreso}
                    className="peer sr-only"
                  />
                  <span className="size-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-display text-[13px] font-medium text-text-primary">
                    {option.label}
                  </span>
                  <span className="font-body text-[12px] text-text-secondary">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {state?.error ? (
        <p role="alert" className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}

      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? pendingLabel : submitLabel}
      </PrimaryButton>
    </form>
  );
}
