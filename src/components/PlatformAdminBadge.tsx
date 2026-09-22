import { cn } from "@/lib/utils";

interface PlatformAdminBadgeProps {
  className?: string;
}

/** Identity badge for profiles.is_platform_admin — not project_members.rol admin. */
export function PlatformAdminBadge({ className }: PlatformAdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-[11px] py-[5px] text-xs font-semibold font-display",
        "bg-blue-raw/20 text-brand-blue",
        className,
      )}
    >
      Admin
    </span>
  );
}
