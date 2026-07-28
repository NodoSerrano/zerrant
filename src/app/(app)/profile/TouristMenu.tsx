"use client";

import { Moon, LogOut, UserRound } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { signOut } from "@/features/auth/actions";

function ThemeToggleSwitch() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="w-[46px] h-7 rounded-pill bg-surface-inset border border-border p-[3px] transition-colors"
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <div
        className="size-[22px] rounded-full bg-white transition-transform"
        style={{ transform: dark ? "translateX(18px)" : "none" }}
      />
    </button>
  );
}

export function TouristMenu() {
  return (
    <div className="rounded-[20px] bg-surface border border-border overflow-hidden flex flex-col">
      <a href="/profile/edit" className="flex items-center gap-3 px-4 py-[15px] w-full">
        <UserRound size={20} className="text-brand-blue shrink-0" />
        <span className="font-body text-[15px] text-text-primary text-left flex-1">
          Editar perfil
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-muted shrink-0"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </a>

      <div className="h-px bg-border w-full" />

      <label className="flex items-center gap-3 px-4 py-[13px] w-full cursor-pointer">
        <Moon size={20} className="text-brand-blue shrink-0" />
        <span className="font-body text-[15px] text-text-primary text-left flex-1">
          Modo oscuro
        </span>
        <ThemeToggleSwitch />
      </label>

      <div className="h-px bg-border w-full" />

      <form action={signOut} className="w-full">
        <button type="submit" className="flex items-center gap-3 px-4 py-[15px] w-full">
          <LogOut size={20} className="text-coral shrink-0" />
          <span className="font-body text-[15px] text-coral text-left flex-1">Cerrar sesión</span>
        </button>
      </form>
    </div>
  );
}
