import { cn } from "@/lib/utils";

type Tier = "tourist" | "scholar" | "standard" | "founder";

interface TierBadgeProps {
  tier: Tier;
  className?: string;
}

const tierStyles: Record<Tier, string> = {
  tourist: "bg-surface-inset text-text-muted",
  scholar: "bg-blue-raw/20 text-brand-blue",
  standard: "bg-mint-raw/20 text-brand-mint",
  founder: "bg-warm-yellow/20 text-warm-yellow",
};

/** Display labels only — DB enums stay tourist/standard/scholar/founder. */
const tierLabels: Record<Tier, string> = {
  tourist: "Turista",
  scholar: "Scholar",
  standard: "Miembro",
  founder: "Founder",
};

export function tierDisplayLabel(tier: Tier): string {
  return tierLabels[tier];
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-[11px] py-[5px] text-xs font-semibold font-display",
        tierStyles[tier],
        className,
      )}
    >
      {tierLabels[tier]}
    </span>
  );
}
