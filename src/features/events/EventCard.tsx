import { Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type EventCardProps = {
  title: string;
  timeLabel: string;
  place: string | null;
  href?: string;
  className?: string;
};

export function EventCard({ title, timeLabel, place, href, className }: EventCardProps) {
  const baseClasses = cn(
    "rounded-[20px] bg-surface border border-border shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)] p-4 flex flex-col gap-2 w-full",
    className,
  );

  const content = (
    <div className="flex items-start gap-3 w-full">
      <div className="size-10 rounded-xl bg-brand-blue/[0.09] flex items-center justify-center shrink-0">
        <Calendar size={18} className="text-brand-blue" aria-hidden="true" />
      </div>
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span
          className="font-display text-[15px] font-medium text-text-primary truncate"
          title={title}
        >
          {title}
        </span>
        <span className="font-body text-xs font-normal text-text-muted">{timeLabel}</span>
        {place ? (
          <span className="font-body text-xs font-normal text-text-secondary truncate">{place}</span>
        ) : null}
      </div>
    </div>
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
