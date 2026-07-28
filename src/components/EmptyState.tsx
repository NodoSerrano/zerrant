import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  subtitle: string;
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ subtitle, href, actionLabel, onAction, className }: EmptyStateProps) {
  const defaultLabel = "Publicar tarea";

  return (
    <div className={cn("flex flex-col items-center gap-[18px] py-5 px-5 pb-[90px]", className)}>
      <div className="size-24 rounded-full bg-surface-inset flex items-center justify-center">
        <ClipboardList className="size-10 text-text-muted" />
      </div>

      <div className="flex flex-col items-center gap-2 w-full">
        <h2 className="font-display text-[20px] font-bold text-text-primary">No hay tareas</h2>
        <p className="font-body text-sm text-text-secondary leading-relaxed text-center">
          {subtitle}
        </p>
      </div>

      {href ? (
        <Link
          href={href}
          className={cn(
            "flex items-center justify-center gap-2 rounded-pill h-12 px-[22px]",
            "bg-linear-to-br from-brand-green to-brand-blue",
            "font-display text-[15px] font-medium text-on-primary",
          )}
        >
          <Plus className="size-[18px] text-on-primary" />
          {actionLabel ?? defaultLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            "flex items-center justify-center gap-2 rounded-pill h-12 px-[22px]",
            "bg-linear-to-br from-brand-green to-brand-blue",
            "font-display text-[15px] font-medium text-on-primary",
          )}
        >
          <Plus className="size-[18px] text-on-primary" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
