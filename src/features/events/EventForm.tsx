"use client";

import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
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
            placeholder="¿De qué se trata el evento?"
            defaultValue={defaults?.descripcion ?? ""}
            className={cn(
              "h-[88px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <Input name="fecha" label="Fecha" type="date" defaultValue={defaults?.fecha} required />

        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Input
              name="inicio"
              label="Inicio"
              type="time"
              defaultValue={defaults?.inicio}
              required
            />
          </div>
          <div className="min-w-0 flex-1">
            <Input name="fin" label="Fin" type="time" defaultValue={defaults?.fin} />
          </div>
        </div>

        <Input
          name="lugar"
          label="Lugar"
          placeholder="Espacio Nodo"
          defaultValue={defaults?.lugar}
        />
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
