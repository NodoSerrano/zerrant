"use client";

import Image from "next/image";
import { Camera, ImageUp, LoaderCircle } from "lucide-react";
import { startTransition, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { AvatarUploadState } from "@/features/profile/actions";
import { AVATAR_MAX_BYTES, AVATAR_TOO_LARGE_ERROR } from "@/features/profile/avatar";
import { shrinkAvatarImage } from "@/features/profile/avatar-resize";
import { isServableAvatarImageUrl } from "@/lib/avatar-image-url";
import { useGuardedActionState } from "@/lib/use-guarded-action-state";
import { cn } from "@/lib/utils";

// HEIC/HEIF get in here even though the bucket doesn't accept them: the server
// converts them to JPEG before uploading (see features/profile/avatar-convert.ts).
const ACCEPTED_MIME = "image/jpeg,image/png,image/webp,image/heic,image/heif";

// ::after sits inside the 1px border (padding box): 3px per side takes the 40px pill to a 44px hit area.
const PILL_CLASS =
  'relative inline-flex h-10 items-center gap-1.5 rounded-pill border border-border bg-surface px-4 font-display text-[13px] font-medium text-primary disabled:opacity-60 after:absolute after:-inset-y-[3px] after:inset-x-0 after:content-[""]';

interface AvatarPickerProps {
  action: (
    prevState: AvatarUploadState | null,
    formData: FormData,
  ) => Promise<AvatarUploadState> | AvatarUploadState;
  initialUrl?: string | null;
  /** Keeps the enclosing form from submitting while a photo is mid-upload. */
  onUploadingChange?: (uploading: boolean) => void;
  /** Short explanation shown under the circle. */
  hint?: string;
  className?: string;
}

export function AvatarPicker({
  action,
  initialUrl,
  onUploadingChange,
  hint,
  className,
}: AvatarPickerProps) {
  const [state, dispatch, pending] = useGuardedActionState(action, null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // The photo lives here, not in the action state: a later error replaces the
  // whole state and would wipe from the UI a photo that did get saved.
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [failed, setFailed] = useState(false);
  // Shrinking happens before the action runs; it counts as uploading for the UI.
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = pending || processing;

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
    onUploadingChange?.(busy);
  }, [busy, onUploadingChange]);

  // next/image throws on absolute hosts outside remotePatterns — never block onboarding.
  // Guard stays here (not only in Avatar) because this picker still renders next/image
  // directly with a camera placeholder instead of the shared Avatar component.
  const servableUrl = url && isServableAvatarImageUrl(url) ? url : null;
  const displayUrl = servableUrl && !failed ? servableUrl : null;
  const error = localError ?? state?.error;

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    // Without this, picking the same file again doesn't fire change.
    input.value = "";

    setLocalError(null);
    setProcessing(true);
    try {
      const prepared = await shrinkAvatarImage(file);
      if (prepared.size > AVATAR_MAX_BYTES) {
        // Next aborts oversized action bodies before the action runs, which the
        // client would show as a connection error: reject here instead.
        setLocalError(AVATAR_TOO_LARGE_ERROR);
        return;
      }

      const formData = new FormData();
      formData.set("avatar", prepared);
      startTransition(() => dispatch(formData));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-2.5", className)}>
      <span
        aria-busy={busy}
        className="size-25 rounded-pill border border-border bg-surface-inset flex items-center justify-center overflow-hidden"
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Foto de perfil"
            width={100}
            height={100}
            onError={() => setFailed(true)}
            className="size-full object-cover"
          />
        ) : busy ? (
          <LoaderCircle
            aria-hidden
            className="size-[30px] animate-spin text-text-muted"
            strokeWidth={1.5}
          />
        ) : (
          <Camera aria-hidden className="size-[30px] text-text-muted" strokeWidth={1.5} />
        )}
      </span>

      {hint && <p className="text-[13px] text-text-secondary text-center">{hint}</p>}

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          disabled={busy}
          className={PILL_CLASS}
        >
          <ImageUp aria-hidden className="size-4" />
          {busy ? "Subiendo..." : "Subir foto"}
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={busy}
          className={PILL_CLASS}
        >
          <Camera aria-hidden className="size-4" />
          Sacar foto
        </button>
      </div>

      {/* The accessible controls are the buttons above: these inputs stay out of
          the focus order and the accessibility tree so they aren't duplicated. */}
      <input
        ref={uploadInputRef}
        type="file"
        name="avatar"
        accept={ACCEPTED_MIME}
        onChange={handleChange}
        disabled={busy}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPTED_MIME}
        capture="user"
        onChange={handleChange}
        disabled={busy}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      {error && (
        <p
          role="alert"
          className="self-stretch text-left text-sm text-coral bg-coral/10 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}
    </div>
  );
}
