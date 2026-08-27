"use client";

import Link from "next/link";
import {
  Folder,
  Gift,
  Sparkles,
  CircleCheck,
  EyeOff,
  Moon,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { signOut } from "@/features/auth/actions";

function ThemeToggleSwitch() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="w-[46px] h-7 rounded-pill bg-primary p-[3px] transition-colors flex"
      style={{ justifyContent: dark ? "flex-end" : "flex-start" }}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <div className="size-[22px] rounded-full bg-white" />
    </button>
  );
}

interface SerranoMenuProps {
  disponibilidad?: string | null;
  visibilidadTarifa?: string | null;
}

export function SerranoMenu({ disponibilidad, visibilidadTarifa }: SerranoMenuProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] bg-surface border border-border overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 px-4 py-[15px] w-full text-text-primary/40">
          <Folder size={20} className="text-brand-blue/40 shrink-0" />
          <span className="font-body text-[15px] text-left flex-1">Mis proyectos</span>
          <span className="font-body text-sm text-text-muted/40">—</span>
          <ChevronRight size={18} className="text-text-muted/40 shrink-0" />
        </div>

        <div className="h-px bg-border w-full" />

        <div className="flex items-center gap-3 px-4 py-[15px] w-full text-text-primary/40">
          <Gift size={20} className="text-brand-green/40 shrink-0" />
          <span className="font-body text-[15px] text-left flex-1">Mis aportes</span>
          <span className="font-body text-sm text-text-muted/40">—</span>
          <ChevronRight size={18} className="text-text-muted/40 shrink-0" />
        </div>
      </div>

      <div className="rounded-[20px] bg-surface border border-border overflow-hidden flex flex-col">
        <Link href="/profile/habilidades" className="flex items-center gap-3 px-4 py-[15px] w-full">
          <Sparkles size={20} className="text-brand-violet shrink-0" />
          <span className="font-body text-[15px] text-text-primary text-left flex-1">
            Mis habilidades
          </span>
          <ChevronRight size={18} className="text-text-muted shrink-0" />
        </Link>

        <div className="h-px bg-border w-full" />

        <div className="flex items-center gap-3 px-4 py-[15px] w-full text-text-primary/40">
          <CircleCheck size={20} className="text-brand-green/40 shrink-0" />
          <span className="font-body text-[15px] text-left flex-1">Disponibilidad</span>
          <span className="font-body text-sm text-text-muted/40">{disponibilidad ?? "—"}</span>
        </div>

        <div className="h-px bg-border w-full" />

        <div className="flex items-center gap-3 px-4 py-[15px] w-full text-text-primary/40">
          <EyeOff size={20} className="text-warm-orange/40 shrink-0" />
          <span className="font-body text-[15px] text-left flex-1">Visibilidad de tarifa</span>
          <span className="font-body text-sm text-text-muted/40">{visibilidadTarifa ?? "—"}</span>
        </div>
      </div>

      <div className="rounded-[20px] bg-surface border border-border overflow-hidden flex flex-col">
        <label className="flex items-center gap-3 px-4 py-[13px] w-full cursor-pointer">
          <Moon size={20} className="text-brand-blue shrink-0" />
          <span className="font-body text-[15px] text-text-primary text-left flex-1">
            Modo oscuro
          </span>
          <ThemeToggleSwitch />
        </label>

        <div className="h-px bg-border w-full" />

        <div className="flex items-center gap-3 px-4 py-[15px] w-full text-text-primary/40">
          <ShieldCheck size={20} className="text-brand-blue/40 shrink-0" />
          <span className="font-body text-[15px] text-text-primary/40 text-left flex-1">
            Panel de admin
          </span>
        </div>

        <div className="h-px bg-border w-full" />

        <form action={signOut} className="w-full">
          <button type="submit" className="flex items-center gap-3 px-4 py-[15px] w-full">
            <LogOut size={20} className="text-coral shrink-0" />
            <span className="font-body text-[15px] text-coral text-left flex-1">Cerrar sesión</span>
          </button>
        </form>
      </div>
    </div>
  );
}
