"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { House, Users, Calendar, User, type LucideIcon } from "lucide-react";

export type Tab = "inicio" | "plantel" | "agenda" | "perfil";

interface TabBarProps {
  active?: Tab;
  className?: string;
}

const tabIcons: Record<Tab, LucideIcon> = {
  inicio: House,
  plantel: Users,
  agenda: Calendar,
  perfil: User,
};

const tabs: { id: Tab; label: string; href: string }[] = [
  { id: "inicio", label: "INICIO", href: "/" },
  { id: "plantel", label: "PLANTEL", href: "/plantel" },
  { id: "agenda", label: "AGENDA", href: "/agenda" },
  { id: "perfil", label: "PERFIL", href: "/profile" },
];

export function TabBar({ active = "inicio", className }: TabBarProps) {
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
          const Icon = tabIcons[tab.id];

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-[3px] flex-1 self-stretch rounded-[26px]",
                "font-display text-[10px] font-semibold tracking-[0.5px] transition-colors",
                isActive ? "bg-primary text-on-primary" : "text-text-muted",
              )}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
