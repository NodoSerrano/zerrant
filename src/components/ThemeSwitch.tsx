"use client";

import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/utils";

/** On/off switch for dark mode: green track when dark is on, grey track when off. */
export function ThemeSwitch({ labelledBy }: { labelledBy: string }) {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-labelledby={labelledBy}
      onClick={toggle}
      className={cn(
        "relative w-[46px] h-7 shrink-0 rounded-pill p-[3px] transition-colors",
        // 28px track, 44px hit area: the row around it is no longer a <label>.
        "before:absolute before:-inset-2",
        "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
        dark ? "bg-primary" : "bg-switch-track",
      )}
    >
      <div
        className="size-[22px] rounded-full bg-on-primary shadow-sm transition-transform"
        style={{ transform: dark ? "translateX(18px)" : "none" }}
      />
    </button>
  );
}
