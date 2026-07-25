"use client";

import Image from "next/image";
import { Camera } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { AvatarUploadState } from "@/features/profile/actions";
import { cn } from "@/lib/utils";

// HEIC/HEIF entran acá aunque el bucket no los acepte: el server los convierte a
// JPEG antes de subirlos (ver features/profile/avatar-convert.ts).
const ACCEPTED_MIME = "image/jpeg,image/png,image/webp,image/heic,image/heif";

interface AvatarPickerProps {
  action: (
    prevState: AvatarUploadState | null,
    formData: FormData,
  ) => Promise<AvatarUploadState> | AvatarUploadState;
  initialUrl?: string | null;
  /** Para que el formulario que lo contiene no se envíe con la foto a medio subir. */
  onUploadingChange?: (uploading: boolean) => void;
  className?: string;
}

export function AvatarPicker({
  action,
  initialUrl,
  onUploadingChange,
  className,
}: AvatarPickerProps) {
  const [state, dispatch, pending] = useActionState(action, null);
  const inputRef = useRef<HTMLInputElement>(null);

  // La foto vive acá y no en el state de la action: un error posterior reemplaza
  // el state entero y borraría de la UI una foto que sí quedó guardada.
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);

  useEffect(() => {
    if (state?.avatarUrl) {
      setUrl(state.avatarUrl);
    }
  }, [state?.avatarUrl]);

  useEffect(() => {
    onUploadingChange?.(pending);
  }, [pending, onUploadingChange]);

  const label = pending ? "Subiendo..." : url ? "Cambiar foto" : "Agregar foto";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("avatar", file);
    startTransition(() => dispatch(formData));

    // Sin esto, volver a elegir el mismo archivo no dispara change.
    event.target.value = "";
  }

  return (
    <div className={cn("flex flex-col items-center gap-2.5", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="flex flex-col items-center gap-2.5 disabled:opacity-60"
      >
        <span className="size-25 rounded-pill border border-border bg-surface-inset flex items-center justify-center overflow-hidden">
          {url ? (
            <Image
              src={url}
              alt="Foto de perfil"
              width={100}
              height={100}
              className="size-full object-cover"
            />
          ) : (
            <Camera aria-hidden className="size-[30px] text-text-muted" strokeWidth={1.5} />
          )}
        </span>
        <span className="font-display text-[13px] font-medium text-primary">{label}</span>
      </button>

      {/* El control accesible es el botón de arriba: este input queda fuera del
          foco y del árbol de accesibilidad para no duplicarlo. */}
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept={ACCEPTED_MIME}
        onChange={handleChange}
        disabled={pending}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      {state?.error && (
        <p role="alert" className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
    </div>
  );
}
