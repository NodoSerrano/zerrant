"use client";

import { useState } from "react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
import {
  DONACION_TIPOS_UI,
  DONACION_TIPO_UI_LABELS,
  type DonacionTipoUi,
} from "@/lib/db/donaciones-schema";

const GROUP_LABEL = "text-[13px] font-medium text-text-secondary";
const FOCUS_RING = "has-focus-visible:ring-2 has-focus-visible:ring-primary/40";

type FormState = { error: string } | null;
type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

interface DonacionFormProps {
  action: FormAction;
}

function defaultFecha(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DonacionForm({ action }: DonacionFormProps) {
  const [state, formAction, pending] = useGuardedActionState(action, null);
  const defaultTipo: DonacionTipoUi = "regalo";
  const [tipoUi, setTipoUi] = useState<DonacionTipoUi>(defaultTipo);

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-4">
        <Input
          name="titulo"
          label="Título"
          type="text"
          required
          placeholder='Ej: Televisor 32" living'
        />

        <fieldset className="flex flex-col gap-2">
          <legend className={GROUP_LABEL}>Tipo</legend>
          <div className="flex flex-wrap gap-2">
            {DONACION_TIPOS_UI.map((value) => (
              <label
                key={value}
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
                  name="tipo_ui"
                  value={value}
                  checked={tipoUi === value}
                  onChange={() => setTipoUi(value)}
                  className="sr-only"
                />
                {DONACION_TIPO_UI_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>

        {tipoUi === "por_un_tiempo" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Input name="prestamo_desde" label="Desde (opcional)" type="date" />
            <Input name="prestamo_hasta" label="Hasta (opcional)" type="date" />
          </div>
        ) : null}

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="descripcion" className={GROUP_LABEL}>
            Descripción (opcional)
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            placeholder="Detalle del bien o condiciones del préstamo"
            className={cn(
              "h-[76px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <Input name="fecha" label="Fecha" type="date" required defaultValue={defaultFecha()} />

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="imagen" className={GROUP_LABEL}>
            Foto (opcional)
          </label>
          <input
            id="imagen"
            name="imagen"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={cn(
              "rounded-2xl border border-border bg-surface px-4 py-3",
              "text-[14px] text-text-primary file:mr-3 file:rounded-pill file:border-0",
              "file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary",
            )}
          />
        </div>
      </div>

      {state?.error ? (
        <p role="alert" className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}

      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Registrando..." : "Registrar donación"}
      </PrimaryButton>
    </form>
  );
}
