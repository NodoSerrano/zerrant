"use client";

import { ChevronLeft } from "lucide-react";
import { useActionState } from "react";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { saveOnboardingStep2 } from "@/features/profile/actions";

export const dynamic = "force-dynamic";

export default function OnboardingStep2() {
  const [state, action, pending] = useActionState(saveOnboardingStep2, null);

  return (
    <div className="flex flex-col gap-[22px] pt-[6px] px-6 pb-6">
      <div className="flex justify-between items-center">
        <ChevronLeft className="w-6 h-6 text-text-primary" />
        <p className="text-[13px] font-medium text-text-muted">Paso 2 de 2</p>
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
            className="h-[100px] rounded-2xl border border-border bg-surface px-4 py-4 text-[15px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        <Input name="contacto_telegram" label="Telegram / contacto" placeholder="@usuario" />

        <Input
          name="sitio_url"
          label="Sitio o portfolio (opcional)"
          type="url"
          placeholder="https://tusitio.com"
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
