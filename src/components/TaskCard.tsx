import { Flame, MoreHorizontal, Settings, ShoppingCart, SprayCan, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  href?: string;
  title: string;
  category: string;
  timeAgo: string;
  estado: "abierta" | "tomada" | "hecha" | "cancelada";
  urgencia: "alta" | "media" | "baja";
  actionLabel: string;
  onAction?: () => void;
  className?: string;
}

const categoryIcons: Record<string, LucideIcon> = {
  Reparación: Wrench,
  Limpieza: SprayCan,
  Compra: ShoppingCart,
  Mantenimiento: Settings,
  Otro: MoreHorizontal,
};

const estadoConfig = {
  abierta: { label: "Abierta", bg: "bg-blue-raw/20", text: "text-brand-blue" },
  tomada: { label: "Tomada", bg: "bg-coral/20", text: "text-coral" },
  hecha: { label: "Hecha", bg: "bg-mint-raw/20", text: "text-brand-mint" },
  // Pencil no diseñó un chip para "cancelada". Se deriva del par neutro que el
  // DS ya usa para lo inactivo, en vez de inventar un color.
  cancelada: { label: "Cancelada", bg: "bg-surface-inset", text: "text-text-muted" },
} as const;

const urgenciaConfig = {
  alta: { label: "Urgencia alta", color: "text-warm-orange" },
  media: { label: "Urgencia media", color: "text-warm-yellow" },
  baja: { label: "Urgencia baja", color: "text-text-muted" },
} as const;

const getCategoryIcon = (category: string): LucideIcon => {
  return categoryIcons[category] ?? MoreHorizontal;
};

export function TaskCard({
  href,
  title,
  category,
  timeAgo,
  estado,
  urgencia,
  actionLabel,
  onAction,
  className,
}: TaskCardProps) {
  const Icon = getCategoryIcon(category);
  // Los datos vienen de enums de Postgres que pueden crecer. Sin fallback, un
  // valor que el componente todavía no conoce lo hace explotar y se lleva
  // puesta la pantalla que lo renderiza.
  const estadoData = estadoConfig[estado] ?? estadoConfig.abierta;
  const urgenciaData = urgenciaConfig[urgencia] ?? urgenciaConfig.media;

  // Una tarea cancelada ya no se puede tomar. El consumidor fija el
  // `actionLabel` sin mirar el estado, así que la tarjeta lo apaga: se sigue
  // leyendo, pero no se ofrece como algo accionable.
  const actionClasses = cn(
    "shrink-0 rounded-pill bg-surface-inset border border-border px-4 py-[7px] font-display text-[13px] font-semibold",
    estado === "cancelada" ? "text-text-muted" : "text-brand-green",
  );

  const baseClasses = cn(
    "rounded-[20px] bg-surface border border-border shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)] p-4 flex flex-col gap-3 w-full",
    className,
  );

  const content = (
    <>
      <div className="flex items-center gap-3 w-full">
        <div className="size-10 rounded-xl bg-warm-yellow/[0.09] flex items-center justify-center shrink-0">
          <Icon size={18} className="text-warm-orange" aria-hidden="true" />
        </div>
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <span
            className="font-display text-[15px] font-medium text-text-primary truncate"
            title={title}
          >
            {title}
          </span>
          <span className="font-body text-xs font-normal text-text-muted">
            {category} · {timeAgo}
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-pill px-[11px] py-[5px] font-display text-xs font-semibold",
            estadoData.bg,
            estadoData.text,
          )}
        >
          {estadoData.label}
        </span>
      </div>
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-[5px]">
          <Flame size={14} className={urgenciaData.color} aria-hidden="true" />
          <span className={cn("font-body text-xs font-normal", urgenciaData.color)}>
            {urgenciaData.label}
          </span>
        </div>
        {href ? (
          <span className={actionClasses}>{actionLabel}</span>
        ) : (
          <button
            type="button"
            className={actionClasses}
            onClick={onAction}
            disabled={estado === "cancelada"}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
