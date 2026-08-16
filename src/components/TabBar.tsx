"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { House, Users, Layers, Calendar, User, type LucideIcon } from "lucide-react";

export type Tab = "inicio" | "plantel" | "nodo" | "agenda" | "perfil";

interface TabBarProps {
  active?: Tab;
  onTabChange?: (tab: Tab) => void;
  className?: string;
}

const tabIcons: Record<Tab, LucideIcon> = {
  inicio: House,
  plantel: Users,
  nodo: Layers,
  agenda: Calendar,
  perfil: User,
};

const tabs: { id: Tab; label: string; href?: string }[] = [
  { id: "inicio", label: "INICIO", href: "/" },
  { id: "plantel", label: "PLANTEL", href: "/plantel" },
  { id: "nodo", label: "NODO", href: "/nodo/tasks" },
  { id: "agenda", label: "AGENDA" },
  { id: "perfil", label: "PERFIL", href: "/profile" },
];

export function TabBar({ active = "inicio", onTabChange, className }: TabBarProps) {
  return (
    <nav className={cn("pt-[21px] pr-[12px] pb-[21px] pl-[21px]", className)}>
      <div
        className={cn(
          "flex items-center rounded-[36px] bg-surface border border-border h-[62px] p-1",
          "shadow-[0_8px_24px_-6px_rgba(26,22,20,0.13)]",
        )}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const isNodo = tab.id === "nodo";
          const Icon = tabIcons[tab.id];

          const itemClass = cn(
            "flex flex-col items-center justify-center gap-[3px] flex-1 rounded-[26px]",
            "font-display text-[10px] font-semibold transition-colors",
            isActive ? "bg-primary text-on-primary" : "text-text-muted",
            isNodo ? "tracking-[0.3px]" : "tracking-[0.5px]",
          );

          const content = (
            <>
              <Icon size={18} />
              <span>{tab.label}</span>
            </>
          );

          if (tab.href) {
            return (
              <Link key={tab.id} href={tab.href} className={itemClass}>
                {content}
              </Link>
            );
          }

          return (
            <button key={tab.id} onClick={() => onTabChange?.(tab.id)} className={itemClass}>
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
