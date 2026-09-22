import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_CTA_SHADOW_CLASS, BRAND_GRADIENT_CLASS } from "@/lib/brandGradients";

type LinkAction = {
  type: "link";
  href: string;
  label: string;
  icon?: LucideIcon;
};

type ButtonAction = {
  type: "button";
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
};

export type SystemStateViewProps = {
  dataPencilFrame: string;
  icon: LucideIcon;
  iconTone: "neutral" | "warning";
  title: string;
  subtitle: string;
  action: LinkAction | ButtonAction;
  className?: string;
};

/**
 * Shared Pencil system-state surface for 7.5 (offline/error) and 7.6 (404).
 * Centered hub content; chrome (TabBar) comes from the route group layout when present.
 */
export function SystemStateView({
  dataPencilFrame,
  icon: Icon,
  iconTone,
  title,
  subtitle,
  action,
  className,
}: SystemStateViewProps) {
  const ActionIcon = action.icon;
  const ctaClass = cn(
    "inline-flex items-center justify-center gap-2 rounded-pill h-[52px] px-6",
    BRAND_GRADIENT_CLASS,
    "font-display text-base font-medium text-on-primary",
    BRAND_CTA_SHADOW_CLASS,
    "hover:opacity-90 active:scale-[0.98]",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
  );

  return (
    <div
      data-pencil-frame={dataPencilFrame}
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-8 px-2 min-h-[60vh] w-full",
        className,
      )}
    >
      <div
        className={cn(
          "size-[100px] rounded-full flex items-center justify-center",
          iconTone === "warning" ? "bg-warm-yellow/10" : "bg-surface-inset",
        )}
      >
        <Icon
          className={cn("size-11", iconTone === "warning" ? "text-warm-orange" : "text-text-muted")}
          aria-hidden
        />
      </div>

      <div className="flex flex-col items-center gap-2.5 w-full">
        <h1 className="font-display text-[22px] font-bold text-text-primary text-center">
          {title}
        </h1>
        <p className="font-body text-sm font-normal text-text-secondary leading-relaxed text-center max-w-sm">
          {subtitle}
        </p>
      </div>

      {action.type === "link" ? (
        <Link href={action.href} className={ctaClass}>
          {ActionIcon ? <ActionIcon className="size-[18px] text-on-primary" aria-hidden /> : null}
          {action.label}
        </Link>
      ) : (
        <button type="button" onClick={action.onClick} className={ctaClass}>
          {ActionIcon ? <ActionIcon className="size-[18px] text-on-primary" aria-hidden /> : null}
          {action.label}
        </button>
      )}
    </div>
  );
}
