"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CircleCheck, X } from "lucide-react";
import { ACTION_NOTICE_PARAM, actionNoticeMessage } from "@/lib/action-notice";

/**
 * ZER-177: success banner after a server action redirected here with
 * `?ok=<code>` (see withActionNotice). Lives in the route-group layouts.
 */
export function ActionNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const fromUrl = actionNoticeMessage(searchParams.get(ACTION_NOTICE_PARAM));
  // Tied to the page it arrived on: the layout outlives navigations.
  const [shown, setShown] = useState<{ pathname: string; message: string } | null>(null);
  // The code already turned into a notice, so dismissing it sticks while the
  // URL still carries it; cleared once the code leaves, so a repeat shows again.
  const urlKey = fromUrl ? `${pathname}|${fromUrl}` : null;
  const [seenKey, setSeenKey] = useState<string | null>(null);

  if (urlKey !== seenKey) {
    setSeenKey(urlKey);
    if (fromUrl) setShown({ pathname, message: fromUrl });
  }

  useEffect(() => {
    if (!fromUrl) return;
    // Drop the code so a reload or a shared link does not repeat the notice.
    const rest = new URLSearchParams(searchParams.toString());
    rest.delete(ACTION_NOTICE_PARAM);
    const query = rest.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }, [fromUrl, pathname, searchParams]);

  if (!shown || shown.pathname !== pathname) return null;

  return (
    <div
      role="status"
      className="mb-3 flex items-center gap-2 rounded-2xl border border-brand-green bg-brand-green/10 px-3 py-2"
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
  );
}
