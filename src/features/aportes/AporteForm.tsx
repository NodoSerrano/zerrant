"use client";

import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
import { APORTE_TIPO_OPTIONS } from "./types";

const GROUP_LABEL = "text-[13px] font-medium text-text-secondary";
const FOCUS_RING = "has-focus-visible:ring-2 has-focus-visible:ring-primary/40";

type AporteFormState = { error: string } | null;
type AporteFormAction = (state: AporteFormState, formData: FormData) => Promise<AporteFormState>;

interface AporteFormProps {
  action: AporteFormAction;
  isPlatformAdmin?: boolean;
}

export function AporteForm({ action, isPlatformAdmin = false }: AporteFormProps) {
  const [state, formAction, pending] = useGuardedActionState(action, null);
  const defaultTipo = "donacion";

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className={GROUP_LABEL}>Tipo de aporte</legend>
          <div className="flex flex-wrap gap-2">
            {APORTE_TIPO_OPTIONS.map((option) => (
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
                  name="tipo"
                  value={option.value}
                  defaultChecked={option.value === defaultTipo}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="descripcion" className={GROUP_LABEL}>
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            placeholder="Ej: Doné un proyector Epson"
            required
            className={cn(
              "h-[76px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <Input name="fecha" label="Fecha" type="date" required />

        <Input
          name="monto"
          label="Monto (opcional · para aportes económicos)"
          type="text"
          inputMode="decimal"
          placeholder="—"
        />

        {isPlatformAdmin ? (
          <Input
            name="profile_id"
            label="ID de perfil (otro serrano)"
            type="text"
            placeholder="Dejá vacío para registrarlo a tu nombre"
          />
        ) : null}
      </div>

      {state?.error ? (
        <p role="alert" className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}

      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Registrando..." : "Registrar aporte"}
      </PrimaryButton>
    </form>
  );
}
