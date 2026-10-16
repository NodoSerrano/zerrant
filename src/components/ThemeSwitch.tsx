"use client";

import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/utils";

/** On/off switch for dark mode: green track when dark is on, muted grey when off. */
export function ThemeSwitch() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={toggle}
      className={cn(
        "w-[46px] h-7 shrink-0 rounded-pill p-[3px] transition-colors",
        "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
        dark ? "bg-primary" : "bg-text-muted",
      )}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <div
        className="size-[22px] rounded-full bg-on-primary shadow-sm transition-transform"
        style={{ transform: dark ? "translateX(18px)" : "none" }}
      />
    </button>
  );
}
