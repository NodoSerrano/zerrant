"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CircleCheck, X } from "lucide-react";
import { ACTION_NOTICE_PARAM, actionNoticeMessage } from "@/lib/action-notice";

/** How long the notice stays on screen while nobody is on it (ZER-207). */
export const ACTION_NOTICE_DURATION_MS = 4000;

/**
 * ZER-177: success notice after a server action redirected here with
 * `?ok=<code>` (see withActionNotice). Lives in the route-group layouts.
 *
 * ZER-207: a toast, not a banner. It floats over the page instead of pushing
 * it down and closes itself, except while the pointer or focus is on it.
 * Errors don't come through here: they stay next to their form.
 */
export function ActionNotice() {
  // Both are null without a router context (e.g. the precached offline page,
  // which reuses the (app) layout): there is simply no notice to show then.
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "";
  const fromUrl = actionNoticeMessage(searchParams?.get(ACTION_NOTICE_PARAM));
  // Tied to the page it arrived on: the layout outlives navigations.
  const [shown, setShown] = useState<{ pathname: string; message: string } | null>(null);
  // The code already turned into a notice, so dismissing it sticks while the
  // URL still carries it; cleared once the code leaves, so a repeat shows again.
  const urlKey = fromUrl ? `${pathname}|${fromUrl}` : null;
  const [seenKey, setSeenKey] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  if (urlKey !== seenKey) {
    setSeenKey(urlKey);
    if (fromUrl) {
      setShown({ pathname, message: fromUrl });
      // A notice closed while hovered never got its mouseleave.
      setPaused(false);
    }
  }

  useEffect(() => {
    if (!fromUrl || !searchParams) return;
    // Drop the code so a reload or a shared link does not repeat the notice.
    const rest = new URLSearchParams(searchParams.toString());
    rest.delete(ACTION_NOTICE_PARAM);
    const query = rest.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }, [fromUrl, pathname, searchParams]);

  // A new notice is a new `shown` object, so it gets its full time again.
  useEffect(() => {
    if (!shown || paused) return;
    const timer = window.setTimeout(() => setShown(null), ACTION_NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [shown, paused]);

  if (!shown || shown.pathname !== pathname) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <div
        role="status"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-2xl border border-brand-green/40 bg-surface px-3 py-2 shadow-[0_10px_30px_-12px_rgba(26,22,20,0.35)]"
      >
        <CircleCheck aria-hidden className="size-4 shrink-0 text-brand-green" />
        <p className="flex-1 font-body text-sm text-text-primary">{shown.message}</p>
        <button
          type="button"
          aria-label="Cerrar aviso"
          onClick={() => setShown(null)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-inset focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
