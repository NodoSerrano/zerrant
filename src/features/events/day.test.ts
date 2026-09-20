import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildDayStrip,
  dayBoundsIso,
  formatDayKey,
  formatEventTimeRange,
  parseDayKey,
} from "./day";

describe("formatDayKey", () => {
  it("formats local calendar date as YYYY-MM-DD", () => {
    expect(formatDayKey(new Date(2026, 8, 20, 15, 30))).toBe("2026-09-20");
  });
});

describe("parseDayKey", () => {
  const now = new Date(2026, 8, 20, 12, 0, 0);

  it("returns today when the param is missing", () => {
    expect(parseDayKey(undefined, now)).toBe("2026-09-20");
  });

  it("returns today when the param is unparseable", () => {
    expect(parseDayKey("not-a-date", now)).toBe("2026-09-20");
    expect(parseDayKey("2026-13-40", now)).toBe("2026-09-20");
  });

  it("accepts a valid YYYY-MM-DD", () => {
    expect(parseDayKey("2026-09-22", now)).toBe("2026-09-22");
  });
});

describe("dayBoundsIso", () => {
  it("covers the full local calendar day", () => {
    const { startIso, endIso } = dayBoundsIso("2026-09-20");
    const start = new Date(startIso);
    const end = new Date(endIso);

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(8);
    expect(start.getDate()).toBe(20);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);

    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(8);
    expect(end.getDate()).toBe(21);
    expect(end.getHours()).toBe(0);
  });
});

describe("buildDayStrip", () => {
  it("returns consecutive local days starting from the given date", () => {
    const strip = buildDayStrip(3, new Date(2026, 8, 20));
    expect(strip.map((d) => d.key)).toEqual(["2026-09-20", "2026-09-21", "2026-09-22"]);
    expect(strip[0]?.weekdayShort).toBe("dom");
    expect(strip[0]?.dayNumber).toBe("20");
  });
});

describe("formatEventTimeRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 20, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats start-only times", () => {
    const label = formatEventTimeRange("2026-09-20T18:00:00-03:00", null);
    expect(label).toMatch(/18:00/);
  });

  it("formats start and end", () => {
    const label = formatEventTimeRange(
      "2026-09-20T18:00:00-03:00",
      "2026-09-20T20:30:00-03:00",
    );
    expect(label).toMatch(/18:00/);
    expect(label).toMatch(/20:30/);
    expect(label).toContain("–");
  });
});
