"use client";

import { useActionState, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/Input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { AvatarPicker } from "@/components/AvatarPicker";
import { updateProfile, uploadAvatar } from "@/features/profile/actions";

const NOMBRE_VISIBLE_OPTIONS = [
  { value: "apodo", label: "Apodo" },
  { value: "nombre_apellido", label: "Nombre Apellido" },
  { value: "apellido_nombre", label: "Apellido Nombre" },
] as const;

const DISPONIBILIDAD_OPTIONS = [
  { value: "disponible", label: "Disponible" },
  { value: "ocupado", label: "Ocupado" },
  { value: "solo_eventos", label: "Solo eventos" },
] as const;

const VISIBILIDAD_OPTIONS = [
  { value: "publica", label: "Pública" },
  { value: "privada", label: "Privada" },
] as const;

interface EditProfileFormProps {
  defaults: {
    nombre?: string | null;
    apellido?: string | null;
    apodo?: string | null;
    nombre_visible?: string | null;
    fecha_nacimiento?: string | null;
    bio?: string | null;
    contacto_telegram?: string | null;
    sitio_url?: string | null;
    disponibilidad?: string | null;
    visibilidad_tarifa?: string | null;
    tarifa_hora?: number | null;
    avatar_url?: string | null;
  };
}

export function EditProfileForm({ defaults }: EditProfileFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateProfile, null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  return (
    <div className="flex flex-col gap-[18px] pt-[6px] px-5 pb-6">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-text-primary"
          aria-label="Volver"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="font-display text-base font-medium text-text-primary">Editar perfil</span>
        <button
          type="submit"
          form="edit-profile-form"
          className="font-display text-[15px] font-semibold text-brand-green"
        >
          Guardar
        </button>
      </div>

      <AvatarPicker
        action={uploadAvatar}
        initialUrl={defaults.avatar_url}
        onUploadingChange={setUploadingPhoto}
      />

      <form id="edit-profile-form" action={action} className="flex flex-col gap-4">
        <Input
          name="nombre"
          label="Nombre"
          placeholder="Tu nombre"
          defaultValue={defaults.nombre ?? ""}
          required
        />
        <Input
          name="apellido"
          label="Apellido"
          placeholder="Tu apellido"
          defaultValue={defaults.apellido ?? ""}
          required
        />
        <Input
          name="apodo"
          label="Apodo"
          placeholder="Cómo te dicen"
          defaultValue={defaults.apodo ?? ""}
        />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text-secondary">
            Nombre visible en el plantel
          </span>
          <div className="flex rounded-2xl bg-surface-inset p-1 gap-1">
            {NOMBRE_VISIBLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex-1 flex items-center justify-center rounded-xl py-2 text-sm font-medium cursor-pointer transition-colors has-checked:bg-surface has-checked:text-text-primary has-checked:shadow-sm text-text-muted"
              >
                <input
                  type="radio"
                  name="nombre_visible"
                  value={opt.value}
                  defaultChecked={opt.value === (defaults.nombre_visible ?? "nombre_apellido")}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text-secondary">Roles en el nodo</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-semibold font-display bg-surface-inset text-text-muted">
              Charlas
            </span>
            <span className="inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-semibold font-display bg-surface-inset text-text-muted">
              Proyectos
            </span>
          </div>
          <p className="text-xs text-text-muted">Los roles nuevos los confirma un admin.</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text-secondary">Disponibilidad</span>
          <div className="flex rounded-2xl bg-surface-inset p-1 gap-1">
            {DISPONIBILIDAD_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex-1 flex items-center justify-center rounded-xl py-2 text-sm font-medium cursor-pointer transition-colors has-checked:bg-surface has-checked:text-text-primary has-checked:shadow-sm text-text-muted"
              >
                <input
                  type="radio"
                  name="disponibilidad"
                  value={opt.value}
                  defaultChecked={opt.value === defaults.disponibilidad}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <Input
          name="tarifa_hora"
          type="number"
          label="Tarifa por hora"
          placeholder="0"
          defaultValue={defaults.tarifa_hora?.toString() ?? ""}
        />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text-secondary">Visibilidad de tarifa</span>
          <div className="flex rounded-2xl bg-surface-inset p-1 gap-1">
            {VISIBILIDAD_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex-1 flex items-center justify-center rounded-xl py-2 text-sm font-medium cursor-pointer transition-colors has-checked:bg-surface has-checked:text-text-primary has-checked:shadow-sm text-text-muted"
              >
                <input
                  type="radio"
                  name="visibilidad_tarifa"
                  value={opt.value}
                  defaultChecked={opt.value === (defaults.visibilidad_tarifa ?? "privada")}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <input type="hidden" name="fecha_nacimiento" value={defaults.fecha_nacimiento ?? ""} />

        {state?.error && (
          <p role="alert" className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={pending || uploadingPhoto} className="mt-2">
          {uploadingPhoto ? "Subiendo foto..." : pending ? "Guardando..." : "Guardar cambios"}
        </PrimaryButton>
      </form>
    </div>
  );
}
