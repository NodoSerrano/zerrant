import { ClipboardList, Plus, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";

interface EmptyStateProps {
  subtitle: string;
  /** Defaults to tasks copy so existing call sites stay unchanged. */
  title?: string;
  icon?: LucideIcon;
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  subtitle,
  title = "No hay tareas",
  icon: Icon = ClipboardList,
  href,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const defaultLabel = "Publicar tarea";

  return (
    <div className={cn("flex flex-col items-center gap-[18px] py-5 px-5 pb-[90px]", className)}>
      <div className="size-24 rounded-full bg-surface-inset flex items-center justify-center">
        <Icon className="size-10 text-text-muted" aria-hidden="true" />
      </div>

      <div className="flex flex-col items-center gap-2 w-full">
        <h2 className="font-display text-[20px] font-bold text-text-primary">{title}</h2>
        <p className="font-body text-sm text-text-secondary leading-relaxed text-center">
          {subtitle}
        </p>
      </div>

      {href ? (
        <Link
          href={href}
          className={cn(
            "flex items-center justify-center gap-2 rounded-pill h-12 px-[22px]",
            BRAND_GRADIENT_CLASS,
            "font-display text-[15px] font-medium text-on-primary",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          <Plus className="size-[18px] text-on-primary" aria-hidden="true" />
          {actionLabel || defaultLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            "flex items-center justify-center gap-2 rounded-pill h-12 px-[22px]",
            BRAND_GRADIENT_CLASS,
            "font-display text-[15px] font-medium text-on-primary",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          <Plus className="size-[18px] text-on-primary" aria-hidden="true" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
