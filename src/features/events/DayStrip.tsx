import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StripDay } from "./day";

type DayStripProps = {
  days: StripDay[];
  selectedKey: string;
  className?: string;
};

export function DayStrip({ days, selectedKey, className }: DayStripProps) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto pb-1", className)}
      role="list"
      aria-label="Días"
    >
      {days.map((day) => {
        const selected = day.key === selectedKey;
        return (
          <Link
            key={day.key}
            role="listitem"
            href={`/agenda?dia=${day.key}`}
            aria-current={selected ? "date" : undefined}
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
          </Link>
        );
      })}
    </div>
  );
}
