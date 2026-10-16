"use client";

import { useState } from "react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
import { DateField } from "./DateField";
import { TimeField } from "./TimeField";
import { clampEnd, formatDuration } from "./timeOptions";
import type { EventFormDefaults } from "./types";

const GROUP_LABEL = "text-[13px] font-medium text-text-secondary";

type EventFormState = { error: string } | null;
type EventFormAction = (state: EventFormState, formData: FormData) => Promise<EventFormState>;

interface EventFormProps {
  action: EventFormAction;
  submitLabel?: string;
  pendingLabel?: string;
  defaults?: EventFormDefaults;
  hiddenFields?: Record<string, string>;
}

export function EventForm({
  action,
  submitLabel = "Publicar evento",
  pendingLabel = "Publicando...",
  defaults,
  hiddenFields,
}: EventFormProps) {
  const [state, formAction, pending] = useGuardedActionState(action, null);
  const [titulo, setTitulo] = useState(defaults?.titulo ?? "");
  const [fecha, setFecha] = useState(defaults?.fecha ?? "");
  const [inicio, setInicio] = useState(defaults?.inicio ?? "");
  const [fin, setFin] = useState(defaults?.fin ?? "");
  const [lugar, setLugar] = useState(defaults?.lugar ?? "");
  const ready = [titulo, fecha, inicio, fin, lugar].every((field) => field.trim() !== "");
  const duration = formatDuration(inicio, fin);

  function changeInicio(next: string) {
    setInicio(next);
    setFin((current) => clampEnd(next, current));
  }

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <div className="flex flex-col gap-4">
        <Input
          name="titulo"
          label="Título"
          placeholder="Ej: Charla sobre ZK Proofs"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          required
        />

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="descripcion" className={GROUP_LABEL}>
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            placeholder="¿De qué se trata el evento?"
            defaultValue={defaults?.descripcion ?? ""}
            className={cn(
              "h-[88px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[18px] border border-border bg-surface-inset p-3">
          <p className="font-display text-[13px] font-medium text-text-secondary">Cuándo</p>
          <DateField name="fecha" label="Fecha" value={fecha} onChange={setFecha} required />
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <TimeField
                name="inicio"
                label="Inicio"
                value={inicio}
                onChange={changeInicio}
                required
              />
            </div>
            <div className="min-w-0 flex-1">
              <TimeField name="fin" label="Fin" value={fin} onChange={setFin} notBefore={inicio} />
            </div>
          </div>
          {duration ? (
            <p className="text-right font-display text-[13px] font-medium text-text-primary">
              Dura {duration}
            </p>
          ) : null}
        </div>

        <Input
          name="lugar"
          label="Lugar"
          placeholder="¿Dónde?"
          value={lugar}
          onChange={(event) => setLugar(event.target.value)}
          required
        />

        <Input
          name="cover_url"
          label="Imagen"
          type="url"
          inputMode="url"
          placeholder="https://..."
          defaultValue={defaults?.coverUrl}
        />
      </div>

      {state?.error ? (
        <p role="alert" className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}

      <PrimaryButton
        type="submit"
        disabled={pending || !ready}
        className="w-full disabled:bg-surface disabled:text-text-muted disabled:opacity-100 disabled:shadow-none disabled:[background-image:none]"
      >
        {pending ? pendingLabel : submitLabel}
      </PrimaryButton>
    </form>
  );
}
