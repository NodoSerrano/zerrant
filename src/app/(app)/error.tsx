"use client";

import { useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { SYSTEM_STATE_COPY } from "@/features/system-states/copy";
import { SystemStateView } from "@/features/system-states/SystemStateView";

/**
 * Recoverable app-shell error (Pencil 7.5 · LYkM4).
 * Same IA/copy as offline fallback; reset stays in-flow under (app) chrome.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = SYSTEM_STATE_COPY.offline;

  useEffect(() => {
    console.error("[app/error]", error.digest ?? error.message, error);
  }, [error]);

  return (
    <SystemStateView
      dataPencilFrame={copy.frameId}
      icon={WifiOff}
      iconTone="warning"
      title={copy.title}
      subtitle={copy.subtitle}
      action={{
        type: "button",
        label: copy.actionLabel,
        onClick: reset,
        icon: RefreshCw,
      }}
    />
  );
}
