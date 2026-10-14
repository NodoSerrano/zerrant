"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Input } from "@/components/Input";
import { PipelineProgress } from "@/components/PipelineProgress";
import { PrimaryButton } from "@/components/PrimaryButton";
import type { PipelineProgress as PipelineProgressData } from "@/features/membership/pipeline";
import { saveOnboardingStep2 } from "@/features/profile/actions";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";

export interface Step2Defaults {
  bio?: string | null;
  contacto_telegram?: string | null;
  sitio_url?: string | null;
}

interface Step2FormProps {
  defaults?: Step2Defaults;
  /** Membership flow (ZER-136): replaces "Paso 2 de 2" with the pipeline progress. */
  progress?: PipelineProgressData;
}

export function Step2Form({ defaults, progress }: Step2FormProps) {
  const [state, action, pending] = useGuardedActionState(saveOnboardingStep2, null);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className={progress ? "flex items-center gap-4" : "flex justify-between items-center"}>
        <Link
          href="/onboarding/step1"
          aria-label="Volver al paso 1"
          className="-ml-2.5 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ChevronLeft className="w-6 h-6" aria-hidden />
        </Link>
        {progress ? (
          <PipelineProgress progress={progress} className="flex-1" />
        ) : (
          <p className="text-[13px] font-medium text-text-muted">Paso 2 de 2</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold text-text-primary">Contá un poco más</h1>
        <p className="text-sm text-text-secondary">Sumá tu bio y cómo te contactan.</p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-[7px]">
          <label htmlFor="bio" className="text-[13px] font-medium text-text-secondary">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            placeholder="Contanos quién sos y qué hacés..."
            defaultValue={defaults?.bio ?? ""}
            className="h-[100px] rounded-2xl border border-border bg-surface px-4 py-4 text-[15px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        <Input
          name="contacto_telegram"
          label="Telegram / contacto"
          placeholder="@usuario"
          defaultValue={defaults?.contacto_telegram ?? ""}
        />

        <Input
          name="sitio_url"
          label="Sitio o portfolio (opcional)"
          type="url"
          placeholder="https://tusitio.com"
          defaultValue={defaults?.sitio_url ?? ""}
        />

        {state?.error && (
          <p role="alert" className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={pending} className="mt-2">
          {pending ? "Guardando..." : "Finalizar"}
        </PrimaryButton>
      </form>
    </div>
  );
}
