import { Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { isServableEventCoverImageUrl } from "@/features/events/event-cover-image-url";
import { cn } from "@/lib/utils";

type EventCardProps = {
  title: string;
  timeLabel: string;
  place: string | null;
  href?: string;
  coverUrl?: string | null;
  className?: string;
};

export function EventCard({
  title,
  timeLabel,
  place,
  href,
  coverUrl = null,
  className,
}: EventCardProps) {
  const baseClasses = cn(
    "rounded-[20px] bg-surface border border-border shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)] p-4 flex flex-col gap-2 w-full",
    href ? "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40" : null,
    className,
  );

  const servableCover = isServableEventCoverImageUrl(coverUrl) ? coverUrl : null;

  const content = (
    <div className="flex items-start gap-3 w-full">
      {servableCover ? (
        <div className="size-10 rounded-xl overflow-hidden shrink-0 bg-surface-inset">
          <Image
            src={servableCover}
            alt=""
            width={40}
            height={40}
            sizes="40px"
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div className="size-10 rounded-xl bg-brand-blue/[0.09] flex items-center justify-center shrink-0">
          <Calendar size={18} className="text-brand-blue" aria-hidden="true" />
        </div>
      )}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span
          className="font-display text-[15px] font-medium text-text-primary truncate"
          title={title}
        >
          {title}
        </span>
        <span className="font-body text-xs font-normal text-text-muted">{timeLabel}</span>
        {place ? (
          <span className="font-body text-xs font-normal text-text-secondary truncate">
            {place}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    const external = /^https?:\/\//i.test(href);
    return (
      <Link
        href={href}
        className={baseClasses}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
