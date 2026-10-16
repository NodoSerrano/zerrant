"use client";

import { useTheme } from "@/lib/useTheme";

function SunIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      type="button"
      className="flex items-center gap-2 rounded-pill bg-surface px-4 py-2 text-sm font-medium text-text-primary border border-text-muted shadow-sm hover:bg-surface-inset transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
      <span>{dark ? "Claro" : "Oscuro"}</span>
    </button>
  );
}
