"use client";

import { useState } from "react";
import { AvatarPicker } from "@/components/AvatarPicker";
import { Input } from "@/components/Input";
import { PipelineProgress } from "@/components/PipelineProgress";
import { PrimaryButton } from "@/components/PrimaryButton";
import type { PipelineProgress as PipelineProgressData } from "@/features/membership/pipeline";
import { saveOnboardingStep1, uploadAvatar } from "@/features/profile/actions";
import { todayIsoDate } from "@/features/profile/birthdate";
import { formatPersonName } from "@/features/profile/person-name";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { FormFeedback } from "@/components/FormFeedback";

export interface Step1Defaults {
  nombre?: string | null;
  apellido?: string | null;
  apodo?: string | null;
  fecha_nacimiento?: string | null;
  bio?: string | null;
  contacto_telegram?: string | null;
  sitio_url?: string | null;
}

interface Step1FormProps {
  defaults?: Step1Defaults;
  avatarUrl?: string | null;
  /** Membership flow (ZER-136): replaces "Paso 1 de 2" with the pipeline progress. */
  progress?: PipelineProgressData;
}

export function Step1Form({ defaults, avatarUrl, progress }: Step1FormProps) {
  const [state, action, pending] = useGuardedActionState(saveOnboardingStep1, null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  return (
    <div className="flex flex-col gap-[22px]">
      {progress ? (
        <PipelineProgress progress={progress} />
      ) : (
        <div className="flex justify-end">
          <p className="text-[13px] font-medium text-text-muted">Paso 1 de 2</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold text-text-primary">Creá tu perfil</h1>
        <p className="text-sm text-text-secondary">Así el resto de la comunidad te conoce.</p>
      </div>

      {/* Fuera del <form> de identidad: la foto se sube sola contra su propia
          action y no puede ir anidada en otro form. */}
      <AvatarPicker
        action={uploadAvatar}
        initialUrl={avatarUrl}
        onUploadingChange={setUploadingPhoto}
        hint="Necesitamos una foto clara para poder reconocerte."
      />

      <form action={action} className="flex flex-col gap-4">
        <Input
          name="nombre"
          label="Nombre"
          placeholder="Tu nombre"
          defaultValue={defaults?.nombre ?? ""}
          required
          autoComplete="given-name"
          onBlur={(e) => {
            e.currentTarget.value = formatPersonName(e.currentTarget.value);
          }}
        />
        <Input
          name="apellido"
          label="Apellido"
          placeholder="Tu apellido"
          defaultValue={defaults?.apellido ?? ""}
          required
          autoComplete="family-name"
          onBlur={(e) => {
            e.currentTarget.value = formatPersonName(e.currentTarget.value);
          }}
        />
        <Input
          name="apodo"
          label="Apodo (opcional)"
          placeholder="Cómo te dicen en Nodo"
          defaultValue={defaults?.apodo ?? ""}
          autoComplete="nickname"
        />
        <Input
          name="fecha_nacimiento"
          type="date"
          label="Fecha de nacimiento"
          defaultValue={defaults?.fecha_nacimiento ?? ""}
          required
          min="1900-01-01"
          max={todayIsoDate()}
          autoComplete="bday"
        />

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

        <FormFeedback error={state?.error} />

        {/* Submitting while the upload is in flight would unmount the picker
            before knowing whether the photo got in: the user would believe
            they have it and they don't. */}
        <PrimaryButton type="submit" disabled={pending || uploadingPhoto} className="mt-2">
          {uploadingPhoto
            ? "Subiendo foto..."
            : pending
              ? "Guardando..."
              : progress
                ? "Continuar a la solicitud"
                : "Guardar perfil"}
        </PrimaryButton>
      </form>
    </div>
  );
}
