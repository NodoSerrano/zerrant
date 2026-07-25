"use client";

import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/utils";

export function DarkModeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={cn(
        "relative size-[46px] shrink-0 rounded-pill border p-[3px] transition-colors",
        dark ? "bg-brand-blue border-brand-blue" : "bg-surface-inset border-border",
      )}
      style={{ width: 46, height: 28 }}
    >
      <span
        className={cn(
          "absolute top-[3px] block size-[22px] rounded-full bg-white transition-transform",
          dark ? "translate-x-[18px]" : "translate-x-0",
        )}
      />
    </button>
  );
}
