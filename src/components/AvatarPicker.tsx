"use client";

import Image from "next/image";
import { Camera } from "lucide-react";
import { startTransition, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { AvatarUploadState } from "@/features/profile/actions";
import { isServableAvatarImageUrl } from "@/lib/avatar-image-url";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
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
  const [state, dispatch, pending] = useGuardedActionState(action, null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The photo lives here, not in the action state: a later error replaces the
  // whole state and would wipe from the UI a photo that did get saved.
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (state?.avatarUrl) {
      setUrl(state.avatarUrl);
    }
  }, [state?.avatarUrl]);

  // next/image can still 400/404 after a URL is held (local IP blocked, missing object).
  // Reset when the URL changes so a successful re-upload can paint again.
  useEffect(() => {
    setFailed(false);
  }, [url]);

  useEffect(() => {
    onUploadingChange?.(pending);
  }, [pending, onUploadingChange]);

  // next/image throws on absolute hosts outside remotePatterns — never block onboarding.
  // Guard stays here (not only in Avatar) because this picker still renders next/image
  // directly with a camera placeholder instead of the shared Avatar component.
  const servableUrl = url && isServableAvatarImageUrl(url) ? url : null;
  // Label follows whether we hold a servable URL (user can change it), not whether paint succeeded.
  const label = pending ? "Subiendo..." : servableUrl ? "Cambiar foto" : "Agregar foto";
  const displayUrl = servableUrl && !failed ? servableUrl : null;

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
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Foto de perfil"
              width={100}
              height={100}
              onError={() => setFailed(true)}
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
