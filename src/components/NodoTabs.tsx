import Link from "next/link";
import { cn } from "@/lib/utils";

export type NodoTab = "tareas" | "proyectos";

interface NodoTabsProps {
  active: NodoTab;
  className?: string;
}

const tabs: { id: NodoTab; label: string; href: string }[] = [
  { id: "tareas", label: "Tareas", href: "/nodo/tasks" },
  { id: "proyectos", label: "Proyectos", href: "/nodo/projects" },
];

export function NodoTabs({ active, className }: NodoTabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-[14px] bg-surface-inset p-1 border border-border/60",
        className,
      )}
      role="tablist"
      aria-label="Secciones del Nodo"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "flex-1 h-10 inline-flex items-center justify-center rounded-[11px] font-display text-sm transition-colors",
              isActive
                ? "bg-surface font-semibold text-text-primary shadow-[0_2px_6px_rgba(26,22,20,0.09)]"
                : "font-medium text-text-muted hover:text-text-secondary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
