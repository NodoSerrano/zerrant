"use client";

import { useMemo, useState } from "react";
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
  APORTE_REFERENCIA_PARAGRAPHS,
  APORTE_REFERENCIA_TITLE,
  DURACION_VISITA_LABELS,
  DURACION_VISITA_VALUES,
  FRECUENCIA_USO_LABELS,
  FRECUENCIA_USO_VALUES,
  SITUACION_ACTUAL_LABELS,
  SITUACION_ACTUAL_VALUES,
} from "@/features/membership/screening";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";
import { BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";

const TOTAL_STEPS = 3;

const GROUP_LABEL = "font-body text-[13px] font-medium text-text-secondary";
const FOCUS_RING = "focus-within:ring-2 focus-within:ring-primary/40";

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-[13px] font-medium text-coral">
      *
    </span>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
  optional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={GROUP_LABEL}>
          {children}
        </label>
      ) : (
        <span className={GROUP_LABEL}>{children}</span>
      )}
      {required ? <RequiredMark /> : null}
      {optional ? (
        <span className="font-body text-[13px] font-medium text-text-muted">(opcional)</span>
      ) : null}
    </div>
  );
}

function ChoiceField({
  name,
  label,
  required,
  options,
}: {
  name: string;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-0">
        <span className="flex items-center gap-1">
          <span className={GROUP_LABEL}>{label}</span>
          {required ? <RequiredMark /> : null}
          {!required ? (
            <span className="font-body text-[13px] font-medium text-text-muted">(opcional)</span>
          ) : null}
        </span>
      </legend>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3",
              "text-[15px] leading-[1.35] text-text-primary transition-colors",
              "has-checked:border-primary has-checked:bg-primary/10",
              FOCUS_RING,
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              required={required}
              className="size-5 shrink-0 accent-primary"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      aria-label={`Paso ${step} de ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const n = i + 1;
        return (
          <span
            key={n}
            aria-hidden="true"
            className={cn(
              "h-2 rounded-full transition-all",
              n === step ? "w-6 bg-primary" : "w-2 bg-border",
            )}
          />
        );
      })}
    </div>
  );
}

export function SolicitarForm() {
  const [state, action, pending] = useGuardedActionState(createMembershipRequest, null);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const goBackChrome = () =>
    window.history.length > 1 ? router.back() : router.push("/nodo/tasks");

  const onBack = () => {
    setStepError(null);
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    goBackChrome();
  };

  const validateStep = (form: HTMLFormElement, current: number): boolean => {
    if (current === 1) {
      const whatsapp = String(new FormData(form).get("contacto_whatsapp") ?? "").trim();
      const freq = form.querySelector<HTMLInputElement>('input[name="frecuencia_uso"]:checked');
      const dur = form.querySelector<HTMLInputElement>('input[name="duracion_visita"]:checked');
      if (!whatsapp || !freq || !dur) {
        setStepError("Completá WhatsApp, frecuencia y duración para seguir.");
        return false;
      }
    }
    if (current === 2) {
      const attitude = form.querySelector<HTMLInputElement>('input[name="aporte_actitud"]:checked');
      const reunion = String(new FormData(form).get("reunion_disponibilidad") ?? "").trim();
      if (!attitude || !reunion) {
        setStepError("Completá el aporte de referencia y el horario de reunión.");
        return false;
      }
    }
    setStepError(null);
    return true;
  };

  const onNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = e.currentTarget.form;
    if (!form) return;
    if (!validateStep(form, step)) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const stepTitle = useMemo(() => {
    if (step === 1) return "Uso del espacio";
    if (step === 2) return "Aporte y reunión";
    return "Contanos un poco más";
  }, [step]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Volver"
          onClick={onBack}
          className="rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ChevronLeft className="size-6 text-text-primary" />
        </button>
        <p className="font-display text-[13px] font-medium text-text-muted">{stepTitle}</p>
        <span aria-hidden="true" className="size-6" />
      </div>

      <StepDots step={step} />

      {step === 1 ? (
        <div className="flex flex-col gap-2">
          <div className="flex justify-center">
            <div
              className={cn(
                "flex size-[84px] items-center justify-center rounded-full",
                BRAND_GRADIENT_CLASS,
              )}
            >
              <UserPlus className="size-9 text-on-primary" />
            </div>
          </div>
          <h1 className="font-display text-[24px] font-bold text-text-primary">
            Sumate como Serrano
          </h1>
          <p className="font-body text-[14px] leading-[1.5] text-text-secondary">
            Completá estos datos para que un admin revise tu solicitud y coordine una breve reunión
            con el horario que indiques.
          </p>
        </div>
      ) : null}

      <form action={action} className="flex flex-col gap-5">
        {/* Step panels stay mounted so FormData keeps prior answers. */}
        <div className={cn("flex flex-col gap-5", step !== 1 && "hidden")} data-step="1">
          <Input
            name="contacto_whatsapp"
            label="Teléfono / WhatsApp"
            placeholder="+54 9 11 1234-5678"
            required
          />

          <ChoiceField
            name="frecuencia_uso"
            label="¿Con qué frecuencia pensás venir a Nodo?"
            required
            options={FRECUENCIA_USO_VALUES.map((value) => ({
              value,
              label: FRECUENCIA_USO_LABELS[value],
            }))}
          />

          <ChoiceField
            name="duracion_visita"
            label="¿Cuánto tiempo estimás quedarte cada vez?"
            required
            options={DURACION_VISITA_VALUES.map((value) => ({
              value,
              label: DURACION_VISITA_LABELS[value],
            }))}
          />
        </div>

        <div className={cn("flex flex-col gap-5", step !== 2 && "hidden")} data-step="2">
          <div
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-inset p-4"
            data-testid="aporte-referencia"
          >
            <p className="font-display text-[15px] font-medium text-text-primary">
              {APORTE_REFERENCIA_TITLE}
            </p>
            <div className="flex flex-col gap-3">
              {APORTE_REFERENCIA_PARAGRAPHS.map((paragraph) => (
                <p
                  key={paragraph}
                  className="font-body text-[13px] leading-[1.45] text-text-secondary"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <ChoiceField
            name="aporte_actitud"
            label="¿Cómo te resulta el aporte de referencia?"
            required
            options={APORTE_ACTITUD_VALUES.map((value) => ({
              value,
              label: APORTE_ACTITUD_LABELS[value],
            }))}
          />

          <div className="flex flex-col gap-[7px]">
            <FieldLabel htmlFor="reunion_disponibilidad" required>
              Día/horario fácil para la reunión
            </FieldLabel>
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

          <ChoiceField
            name="aporte_mayor"
            label="¿Aporte mayor al de referencia para ayudar a otros?"
            options={APORTE_MAYOR_VALUES.map((value) => ({
              value,
              label: APORTE_MAYOR_LABELS[value],
            }))}
          />

          <div className="flex flex-col gap-[7px]">
            <FieldLabel htmlFor="aporte_otro" optional>
              ¿Podés aportar de otra manera?
            </FieldLabel>
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
        </div>

        <div className={cn("flex flex-col gap-5", step !== 3 && "hidden")} data-step="3">
          <ChoiceField
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
            <FieldLabel htmlFor="entrevista_items" optional>
              Tres ítems para la entrevista
            </FieldLabel>
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
            <FieldLabel htmlFor="mensaje" optional>
              Mensaje
            </FieldLabel>
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
        </div>

        {(stepError || state?.error) && (
          <p role="alert" className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
            {stepError ?? state?.error}
          </p>
        )}

        {step < TOTAL_STEPS ? (
          <PrimaryButton type="button" onClick={onNext} className="w-full">
            Siguiente
          </PrimaryButton>
        ) : (
          <PrimaryButton type="submit" disabled={pending} className="w-full">
            {pending ? "Enviando..." : "Enviar solicitud"}
          </PrimaryButton>
        )}
      </form>

      <button
        type="button"
        onClick={goBackChrome}
        className="font-display text-[15px] font-medium text-text-muted text-center"
      >
        Ahora no
      </button>
    </div>
  );
}
