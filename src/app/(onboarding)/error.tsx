"use client";

import { useEffect } from "react";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[onboarding/error]", error.digest ?? error.message, error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4">
      <p role="alert" className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">
        Algo salió mal en el alta. Podés reintentar sin salir del flujo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-[54px] items-center justify-center rounded-pill border border-border bg-surface px-6 font-display text-base font-medium text-text-primary transition-all hover:bg-surface-inset active:scale-[0.98]"
      >
        Reintentar
      </button>
    </div>
  );
}
