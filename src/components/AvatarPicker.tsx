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

// HEIC/HEIF get in here even though the bucket doesn't accept them: the server
// converts them to JPEG before uploading (see features/profile/avatar-convert.ts).
const ACCEPTED_MIME = "image/jpeg,image/png,image/webp,image/heic,image/heif";

interface AvatarPickerProps {
  action: (
    prevState: AvatarUploadState | null,
    formData: FormData,
  ) => Promise<AvatarUploadState> | AvatarUploadState;
  initialUrl?: string | null;
  /** Keeps the enclosing form from submitting while a photo is mid-upload. */
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

  // The photo lives here, not in the action state: a later error replaces the
  // whole state and would wipe from the UI a photo that did get saved.
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

    // Without this, picking the same file again doesn't fire change.
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

      {/* The accessible control is the button above: this input stays out of
          the focus order and the accessibility tree so it isn't duplicated. */}
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
