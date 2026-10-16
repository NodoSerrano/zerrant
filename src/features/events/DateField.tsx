"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import {
  MONTH_LABEL,
  dayKey,
  formatAgendaDate,
  monthCells,
  parseDayKey,
  shiftMonth,
} from "./dateOptions";
import { formatDayKey } from "./day";
import { FieldSheet } from "./FieldSheet";

interface DateFieldProps {
  name: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export function DateField({ name, label, required, value, onChange }: DateFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const parsed = parseDayKey(value);
  const todayKey = formatDayKey(new Date());
  const todayParts = parseDayKey(todayKey);
  const [cursor, setCursor] = useState({
    year: parsed?.year ?? todayParts?.year ?? new Date().getFullYear(),
    month: parsed?.month ?? todayParts?.month ?? new Date().getMonth() + 1,
  });

  function openSheet() {
    const next = parseDayKey(value);
    setCursor({
      year: next?.year ?? todayParts?.year ?? new Date().getFullYear(),
      month: next?.month ?? todayParts?.month ?? new Date().getMonth() + 1,
    });
    setOpen(true);
  }

  function pick(day: number) {
    onChange(dayKey(cursor.year, cursor.month, day));
    setOpen(false);
  }

  const cells = monthCells(cursor.year, cursor.month);

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
      <div className="relative">
        <input type="hidden" name={name} value={value} />
        <input
          id={id}
          required={required}
          readOnly
          inputMode="none"
          value={value}
          placeholder="Elegí la fecha"
          aria-haspopup="dialog"
          onClick={openSheet}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openSheet();
            }
          }}
          className={cn(
            "h-[50px] w-full cursor-pointer rounded-2xl border border-border bg-surface px-4 text-[15px]",
            "placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/40",
            value ? "text-transparent caret-transparent" : "text-text-muted",
          )}
        />
        {value ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center px-4 text-[15px] text-text-primary"
          >
            {formatAgendaDate(value)}
          </span>
        ) : null}
      </div>
      <FieldSheet title={label} open={open} onClose={() => setOpen(false)}>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="h-9 w-9 rounded-full text-text-secondary"
            aria-label="Mes anterior"
            onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}
          >
            ‹
          </button>
          <p className="font-display text-[15px] text-text-primary">
            {MONTH_LABEL[cursor.month - 1]} {cursor.year}
          </p>
          <button
            type="button"
            className="h-9 w-9 rounded-full text-text-secondary"
            aria-label="Mes siguiente"
            onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-text-muted">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, index) =>
            day == null ? (
              <span key={`pad-${index}`} />
            ) : (
              <button
                key={day}
                type="button"
                onClick={() => pick(day)}
                aria-current={
                  dayKey(cursor.year, cursor.month, day) === todayKey ? "date" : undefined
                }
                aria-label={
                  dayKey(cursor.year, cursor.month, day) === todayKey ? `Hoy, ${day}` : undefined
                }
                className={cn(
                  "flex h-10 flex-col items-center justify-center rounded-xl text-[15px] leading-none",
                  value === dayKey(cursor.year, cursor.month, day)
                    ? "bg-[#d7e6ff] text-[#1a1614]"
                    : "text-text-primary",
                  dayKey(cursor.year, cursor.month, day) === todayKey &&
                    value !== dayKey(cursor.year, cursor.month, day) &&
                    "ring-1 ring-inset ring-[#4fe6c3]",
                )}
              >
                {day}
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 size-1 rounded-full",
                    dayKey(cursor.year, cursor.month, day) === todayKey
                      ? value === dayKey(cursor.year, cursor.month, day)
                        ? "bg-[#1a1614]"
                        : "bg-[#4fe6c3]"
                      : "bg-transparent",
                  )}
                />
              </button>
            ),
          )}
        </div>
      </FieldSheet>
    </div>
  );
}
