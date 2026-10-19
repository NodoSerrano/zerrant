import { Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { isServableEventCoverImageUrl } from "@/features/events/event-cover-image-url";
import { cn } from "@/lib/utils";

function dateBlock(label: string | undefined): { day: string; month: string } | null {
  if (!label) return null;
  const parts = label.trim().split(/\s+/);
  if (parts.length < 3) return null;
  return { day: parts[1] ?? "", month: parts[2] ?? "" };
}

type EventCardProps = {
  title: string;
  timeLabel: string;
  dateLabel?: string;
  durationLabel?: string | null;
  place: string | null;
  href?: string;
  coverUrl?: string | null;
  /** Luma events get a small label so the two sources never blur together (ZER-157). */
  source?: "internal" | "luma";
  className?: string;
};

export function EventCard({
  title,
  timeLabel,
  dateLabel,
  durationLabel,
  place,
  href,
  coverUrl = null,
  source = "internal",
  className,
}: EventCardProps) {
  const baseClasses = cn(
    "rounded-[18px] bg-surface border border-border p-3 flex w-full items-center",
    href ? "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40" : null,
    className,
  );

  const servableCover = isServableEventCoverImageUrl(coverUrl) ? coverUrl : null;
  const dateParts = dateBlock(dateLabel);

  const content = (
    <div className="flex w-full items-center gap-3">
      {dateParts ? (
        <div className="flex h-14 w-[52px] shrink-0 flex-col items-center justify-center rounded-[14px] bg-surface-inset">
          <span className="font-display text-[22px] leading-none text-text-primary">
            {dateParts.day}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-text-muted">
            {dateParts.month}
          </span>
          <span className="sr-only">{dateLabel}</span>
        </div>
      ) : servableCover ? (
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
          className="truncate font-display text-[15px] font-medium text-text-primary"
          title={title}
        >
          {title}
        </span>
        <span className="font-body text-[13px] text-text-secondary">
          {timeLabel}
          {place ? ` · ${place}` : ""}
        </span>
        {source === "luma" ? (
          <span className="w-fit rounded-pill border border-border px-2 py-px font-body text-[11px] font-medium text-text-secondary">
            Luma
          </span>
        ) : null}
      </div>
      {durationLabel ? (
        <span className="shrink-0 font-display text-[13px] font-medium text-text-primary">
          {durationLabel}
        </span>
      ) : null}
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
