"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FieldSheet } from "./FieldSheet";
import {
  PICKER_HOURS,
  formatHm,
  isHourDisabled,
  isMinuteDisabled,
  minuteChoices,
  parseHm,
} from "./timeOptions";

interface TimeFieldProps {
  name: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  /** When set, choices strictly before this HH:MM are disabled. Equal is allowed. */
  notBefore?: string;
}

const CELL =
  "h-10 rounded-xl bg-surface text-[15px] text-text-primary disabled:cursor-not-allowed disabled:opacity-30";

export function TimeField({
  name,
  label,
  required,
  value,
  onChange,
  notBefore = "",
}: TimeFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const parsed = parseHm(value);
  const [hour, setHour] = useState(parsed?.hour ?? 19);
  const [minute, setMinute] = useState(parsed?.minute ?? 0);
  const minutes = minuteChoices(parsed?.minute ?? minute);
  const pickingEnd = Boolean(notBefore);
  const wheelRef = useRef<HTMLDivElement>(null);
  const settling = useRef(false);

  function selectHour(item: number) {
    if (isHourDisabled(item, minutes, notBefore, pickingEnd)) return;
    setHour(item);
    if (isMinuteDisabled(item, minute, notBefore, pickingEnd)) {
      const next = minutes.find((choice) => !isMinuteDisabled(item, choice, notBefore, pickingEnd));
      if (next != null) setMinute(next);
    }
  }

  useEffect(() => {
    if (!open) return;
    settling.current = true;
    const frame = requestAnimationFrame(() => {
      wheelRef.current?.querySelector(`[data-hour="${hour}"]`)?.scrollIntoView({ block: "center" });
      window.setTimeout(() => {
        settling.current = false;
      }, 80);
    });
    return () => cancelAnimationFrame(frame);
    // Center the chosen hour only when the sheet opens. Depending on hour
    // would fight the user's scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onWheelScroll() {
    const wheel = wheelRef.current;
    if (!wheel || settling.current) return;
    const mid = wheel.scrollTop + wheel.clientHeight / 2;
    let closest = hour;
    let best = Number.POSITIVE_INFINITY;
    for (const child of wheel.querySelectorAll<HTMLButtonElement>("[data-hour]")) {
      if (child.disabled) continue;
      const center = child.offsetTop + child.offsetHeight / 2;
      const distance = Math.abs(center - mid);
      if (distance < best) {
        best = distance;
        closest = Number(child.dataset.hour);
      }
    }
    if (closest !== hour) selectHour(closest);
  }

  function openSheet() {
    const next = parseHm(value);
    const fallback = parseHm(notBefore);
    setHour(next?.hour ?? fallback?.hour ?? 19);
    setMinute(next?.minute ?? fallback?.minute ?? 0);
    setOpen(true);
  }

  function commit() {
    if (isMinuteDisabled(hour, minute, notBefore, pickingEnd)) return;
    onChange(formatHm(hour, minute));
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="text-[13px] font-medium text-text-secondary">
          {label}
        </label>
        {required ? (
          <span aria-hidden="true" className="text-[13px] font-medium text-coral">
            *
          </span>
        ) : null}
      </div>
      <input type="hidden" name={name} value={value} />
      <input
        id={id}
        required={required}
        readOnly
        inputMode="none"
        value={value}
        placeholder="--:--"
        aria-haspopup="dialog"
        onClick={openSheet}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openSheet();
          }
        }}
        className={cn(
          "h-[50px] cursor-pointer rounded-2xl border border-border bg-surface px-4 text-[15px]",
          value ? "text-text-primary" : "text-text-muted",
          "placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/40",
        )}
      />
      <FieldSheet title={label} open={open} onClose={() => setOpen(false)}>
        <div className="relative mx-auto h-[220px] w-[148px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 rounded-full bg-picker-selected/15"
          />
          <div
            ref={wheelRef}
            onScroll={onWheelScroll}
            className="h-full snap-y snap-mandatory overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
          >
            <div className="h-[88px]" />
            {PICKER_HOURS.map((item) => (
              <button
                key={item}
                type="button"
                data-hour={item}
                disabled={isHourDisabled(item, minutes, notBefore, pickingEnd)}
                aria-label={`Hora ${String(item).padStart(2, "0")}`}
                className={cn(
                  "snap-center flex h-11 w-full items-center justify-center rounded-full font-display text-[22px]",
                  item === hour ? "bg-picker-selected text-on-picker-selected" : "text-text-muted",
                  "disabled:cursor-not-allowed disabled:opacity-30",
                )}
                onClick={() => selectHour(item)}
              >
                {String(item).padStart(2, "0")}
              </button>
            ))}
            <div className="h-[88px]" />
          </div>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          {minutes.map((item) => (
            <button
              key={item}
              type="button"
              disabled={isMinuteDisabled(hour, item, notBefore, pickingEnd)}
              aria-label={`Minuto ${String(item).padStart(2, "0")}`}
              className={cn(
                CELL,
                "flex-1",
                item === minute && "bg-picker-selected text-on-picker-selected",
              )}
              onClick={() => setMinute(item)}
            >
              {String(item).padStart(2, "0")}
            </button>
          ))}
        </div>
        <p className="my-3 text-center text-[13px] text-text-secondary">{formatHm(hour, minute)}</p>
        <button
          type="button"
          onClick={commit}
          className="h-[46px] w-full rounded-pill bg-text-primary font-display text-[15px] font-semibold text-bg"
        >
          Listo
        </button>
      </FieldSheet>
    </div>
  );
}
