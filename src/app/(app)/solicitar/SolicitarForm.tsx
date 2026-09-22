"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Info, UserPlus } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Input } from "@/components/Input";
import { createMembershipRequest } from "@/features/membership/actions";
import {
  APORTE_ACTITUD_LABELS,
  APORTE_ACTITUD_VALUES,
  APORTE_MAYOR_LABELS,
  APORTE_MAYOR_VALUES,
  DURACION_VISITA_LABELS,
  DURACION_VISITA_VALUES,
  FRECUENCIA_USO_LABELS,
  FRECUENCIA_USO_VALUES,
  SITUACION_ACTUAL_LABELS,
  SITUACION_ACTUAL_VALUES,
} from "@/features/membership/screening";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";

function SelectField({
  id,
  name,
  label,
  required,
  options,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="font-body text-[13px] font-medium text-text-secondary">
        {label}
        {required ? "" : " (opcional)"}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue=""
        className={cn(
          "h-12 rounded-2xl border border-border bg-surface px-4",
          "text-[15px] text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/40",
        )}
      >
        <option value="" disabled>
          Elegí una opción
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SolicitarForm() {
  const [state, action, pending] = useGuardedActionState(createMembershipRequest, null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          aria-label="Volver"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/nodo/tasks"))}
          className="rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ChevronLeft className="size-6 text-text-primary" />
        </button>
      </div>

      <div className="flex justify-center">
        <div className="flex size-[84px] items-center justify-center rounded-full bg-linear-to-br from-brand-mint to-brand-blue">
          <UserPlus className="size-9 text-on-primary" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[24px] font-bold text-text-primary">
          Sumate como Serrano
        </h1>
        <p className="font-body text-[14px] leading-[1.5] text-text-secondary">
          Completá estos datos para que un admin revise tu solicitud y coordine una breve reunión
          con el horario que indiques.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <Input
          name="contacto_whatsapp"
          label="Teléfono / WhatsApp"
          placeholder="+54 9 11 1234-5678"
          required
        />

        <SelectField
          id="frecuencia_uso"
          name="frecuencia_uso"
          label="¿Con qué frecuencia pensás venir a Nodo?"
          required
          options={FRECUENCIA_USO_VALUES.map((value) => ({
            value,
            label: FRECUENCIA_USO_LABELS[value],
          }))}
        />

        <SelectField
          id="duracion_visita"
          name="duracion_visita"
          label="¿Cuánto tiempo estimás quedarte cada vez?"
          required
          options={DURACION_VISITA_VALUES.map((value) => ({
            value,
            label: DURACION_VISITA_LABELS[value],
          }))}
        />

        <SelectField
          id="aporte_actitud"
          name="aporte_actitud"
          label="¿Cómo te resulta el aporte de referencia?"
          required
          options={APORTE_ACTITUD_VALUES.map((value) => ({
            value,
            label: APORTE_ACTITUD_LABELS[value],
          }))}
        />

        <div className="flex flex-col gap-[7px]">
          <label
            htmlFor="reunion_disponibilidad"
            className="font-body text-[13px] font-medium text-text-secondary"
          >
            Día/horario fácil para la reunión
          </label>
          <textarea
            id="reunion_disponibilidad"
            name="reunion_disponibilidad"
            required
            placeholder="Ej: martes o jueves después de las 18"
            className={cn(
              "h-[90px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <SelectField
          id="situacion_actual"
          name="situacion_actual"
          label="¿Cuál describe mejor tu situación actual?"
          options={SITUACION_ACTUAL_VALUES.map((value) => ({
            value,
            label: SITUACION_ACTUAL_LABELS[value],
          }))}
        />

        <Input
          name="ocupacion_detalle"
          label="¿Qué estudias o en qué trabajás? (opcional)"
          placeholder="Carrera, oficio, rol…"
        />

        <div className="flex flex-col gap-[7px]">
          <label
            htmlFor="entrevista_items"
            className="font-body text-[13px] font-medium text-text-secondary"
          >
            Tres ítems para la entrevista (opcional)
          </label>
          <textarea
            id="entrevista_items"
            name="entrevista_items"
            placeholder="Intereses, dudas o temas que quieras charlar…"
            className={cn(
              "h-[90px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <div className="flex flex-col gap-[7px]">
          <label
            htmlFor="aporte_otro"
            className="font-body text-[13px] font-medium text-text-secondary"
          >
            ¿Podés aportar de otra manera? (opcional)
          </label>
          <textarea
            id="aporte_otro"
            name="aporte_otro"
            placeholder="Charlas, infra, limpieza, organización…"
            className={cn(
              "h-[90px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <SelectField
          id="aporte_mayor"
          name="aporte_mayor"
          label="¿Aporte mayor al de referencia para ayudar a otros?"
          options={APORTE_MAYOR_VALUES.map((value) => ({
            value,
            label: APORTE_MAYOR_LABELS[value],
          }))}
        />

        <div className="flex flex-col gap-[7px]">
          <label
            htmlFor="mensaje"
            className="font-body text-[13px] font-medium text-text-secondary"
          >
            Mensaje (opcional)
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            placeholder="Ej: Soy dev, me copa la infra y quiero ayudar con el sitio y las charlas..."
            className={cn(
              "h-[110px] rounded-2xl border border-border bg-surface p-4",
              "text-[15px] leading-[1.4] text-text-primary placeholder:text-text-muted",
              "resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            )}
          />
        </div>

        <div className="flex items-center gap-[10px] rounded-2xl bg-surface-inset p-[14px]">
          <Info className="size-[18px] shrink-0 text-brand-blue" />
          <p className="font-body text-[12px] leading-[1.4] text-text-secondary">
            Un admin va a revisar tu solicitud, coordinar la reunión con el horario que indiques y
            asignarte un tier.
          </p>
        </div>

        {state?.error && (
          <p role="alert" className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={pending} className="w-full">
          {pending ? "Enviando..." : "Enviar solicitud"}
        </PrimaryButton>
      </form>

      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/nodo/tasks"))}
        className="font-display text-[15px] font-medium text-text-muted text-center"
      >
        Ahora no
      </button>
    </div>
  );
}
