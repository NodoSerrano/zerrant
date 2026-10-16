import { describe, expect, it } from "vitest";
import { formatAgendaDate, monthCells, parseDayKey, shiftMonth } from "./dateOptions";

describe("dateOptions", () => {
  it("formats a calendar day without the browser locale popup", () => {
    expect(formatAgendaDate("2026-10-16")).toBe("vie 16 oct");
    expect(parseDayKey("2026-02-31")).toBeNull();
  });

  it("starts the month grid on Monday", () => {
    // 2026-10-01 is a Thursday → three leading blanks.
    expect(monthCells(2026, 10).slice(0, 4)).toEqual([null, null, null, 1]);
  });

  it("steps across the year boundary", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
});
