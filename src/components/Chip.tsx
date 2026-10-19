import { cn } from "@/lib/utils";

type ChipVariant = "default" | "mint" | "blue" | "violet" | "coral" | "yellow" | "orange";

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  className?: string;
}

const variantClasses: Record<ChipVariant, string> = {
  default: "bg-surface-inset text-text-secondary",
  mint: "bg-mint-raw/20 text-on-mint-tint",
  blue: "bg-blue-raw/20 text-on-blue-tint",
  violet: "bg-violet-raw/20 text-on-violet-tint",
  coral: "bg-coral/20 text-on-coral-tint",
  yellow: "bg-warm-yellow/20 text-on-yellow-tint",
  orange: "bg-warm-orange/20 text-on-orange-tint",
};

export function Chip({ label, variant = "default", className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border border-border px-[13px] py-[7px] text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
