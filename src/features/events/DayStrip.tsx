import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StripDay } from "./day";

type DayStripProps = {
  days: StripDay[];
  selectedKey: string;
  /** Agenda-TZ day keys (YYYY-MM-DD) that have at least one event. */
  daysWithEvents?: readonly string[];
  className?: string;
};

export function DayStrip({ days, selectedKey, daysWithEvents = [], className }: DayStripProps) {
  const withEvents = new Set(daysWithEvents);

  return (
    <ul
      className={cn("flex gap-2 overflow-x-auto pb-1 list-none m-0 p-0", className)}
      aria-label="Días"
    >
      {days.map((day) => {
        const selected = day.key === selectedKey;
        const hasEvents = withEvents.has(day.key);
        return (
          <li key={day.key} className="shrink-0">
            <Link
              href={`/agenda?dia=${day.key}`}
              aria-current={selected ? "date" : undefined}
              data-has-events={hasEvents ? "true" : undefined}
              className={cn(
                "inline-flex min-w-[52px] flex-col items-center gap-0.5 rounded-[16px] px-3 py-2",
                "font-display whitespace-nowrap transition-colors",
                selected
                  ? "bg-primary text-on-primary"
                  : "bg-surface border border-border text-text-secondary hover:text-text-primary",
              )}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                {day.weekdayShort}
              </span>
              <span className="text-[15px] font-semibold leading-none">{day.dayNumber}</span>
              {hasEvents ? (
                <span
                  data-event-dot
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 size-1.5 rounded-full",
                    selected ? "bg-on-primary" : "bg-primary",
                  )}
                />
              ) : (
                // Keep strip row height stable when some days have dots.
                <span aria-hidden="true" className="mt-0.5 size-1.5" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
