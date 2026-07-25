"use client";

import { useActionState, useState } from "react";
import { AvatarPicker } from "@/components/AvatarPicker";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { saveOnboardingStep1, uploadAvatar } from "@/features/profile/actions";

export interface Step1Defaults {
  nombre?: string | null;
  apellido?: string | null;
  apodo?: string | null;
  fecha_nacimiento?: string | null;
}

interface Step1FormProps {
  defaults?: Step1Defaults;
  avatarUrl?: string | null;
}

export function Step1Form({ defaults, avatarUrl }: Step1FormProps) {
  const [state, action, pending] = useActionState(saveOnboardingStep1, null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex justify-end">
        <p className="text-[13px] font-medium text-text-muted">Paso 1 de 2</p>
      </div>

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
      />

      <form action={action} className="flex flex-col gap-4">
        <Input
          name="nombre"
          label="Nombre"
          placeholder="Tu nombre"
          defaultValue={defaults?.nombre ?? ""}
          required
        />
        <Input
          name="apellido"
          label="Apellido"
          placeholder="Tu apellido"
          defaultValue={defaults?.apellido ?? ""}
          required
        />
        <Input
          name="apodo"
          label="Apodo (opcional)"
          placeholder="Cómo te dicen en Nodo"
          defaultValue={defaults?.apodo ?? ""}
        />
        <Input
          name="fecha_nacimiento"
          type="date"
          label="Fecha de nacimiento"
          defaultValue={defaults?.fecha_nacimiento ?? ""}
          required
        />

        {state?.error && (
          <p role="alert" className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}

        {/* Enviar con la subida en vuelo desmontaría el picker antes de saber si
            la foto entró: el usuario creería que la tiene y no. */}
        <PrimaryButton type="submit" disabled={pending || uploadingPhoto} className="mt-2">
          {uploadingPhoto ? "Subiendo foto..." : pending ? "Guardando..." : "Guardar y continuar"}
        </PrimaryButton>
      </form>
    </div>
  );
}
