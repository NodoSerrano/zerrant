"use client";

import { Moon, LogOut, UserRound } from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { signOut } from "@/features/auth/actions";

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

      <div className="flex items-center gap-3 px-4 py-[13px] w-full">
        <Moon size={20} className="text-brand-blue shrink-0" />
        <span
          id="tourist-dark-mode-label"
          className="font-body text-[15px] text-text-primary text-left flex-1"
        >
          Modo oscuro
        </span>
        <ThemeSwitch labelledBy="tourist-dark-mode-label" />
      </div>

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
