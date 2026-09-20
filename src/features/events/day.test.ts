import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  buildDayStrip,
  dayBoundsIso,
  formatDayKey,
  formatEventTimeRange,
  parseDayKey,
  wallClockHmFromIso,
  eventFormDefaultsFromRow,
} from "./day";

describe("formatDayKey", () => {
  it("formats the agenda-TZ calendar date as YYYY-MM-DD", () => {
    // 15:30 ART on 2026-09-20
    expect(formatDayKey(new Date("2026-09-20T15:30:00-03:00"))).toBe("2026-09-20");
  });

  it("keeps late-evening ART on the same calendar day under UTC runners", () => {
    // 2026-09-21T02:00Z == 2026-09-20 23:00 ART
    expect(formatDayKey(new Date("2026-09-21T02:00:00.000Z"))).toBe("2026-09-20");
    // 2026-09-21T03:00Z == 2026-09-21 00:00 ART
    expect(formatDayKey(new Date("2026-09-21T03:00:00.000Z"))).toBe("2026-09-21");
  });
});

describe("parseDayKey", () => {
  const now = new Date("2026-09-20T15:00:00-03:00");

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
  it("covers the full ART calendar day as stable UTC ISO bounds", () => {
    // ART is UTC−3 year-round in 2026: midnight 20 Sep ART = 03:00Z
    const { startIso, endIso } = dayBoundsIso("2026-09-20");
    expect(startIso).toBe("2026-09-20T03:00:00.000Z");
    expect(endIso).toBe("2026-09-21T03:00:00.000Z");
  });

  it("includes a 22:00 ART event on that calendar day", () => {
    const { startIso, endIso } = dayBoundsIso("2026-09-21");
    const event = new Date("2026-09-21T22:00:00-03:00").getTime();
    expect(event).toBeGreaterThanOrEqual(new Date(startIso).getTime());
    expect(event).toBeLessThan(new Date(endIso).getTime());
  });
});

describe("addCalendarDays", () => {
  it("rolls month boundaries", () => {
    expect(addCalendarDays("2026-09-30", 1)).toBe("2026-10-01");
  });
});

describe("buildDayStrip", () => {
  it("returns consecutive agenda-TZ days starting from the given instant", () => {
    const strip = buildDayStrip(3, new Date("2026-09-20T12:00:00-03:00"));
    expect(strip.map((d) => d.key)).toEqual(["2026-09-20", "2026-09-21", "2026-09-22"]);
    expect(strip[0]?.weekdayShort).toBe("dom");
    expect(strip[0]?.dayNumber).toBe("20");
  });
});

describe("formatEventTimeRange", () => {
  it("formats start-only times in ART regardless of process TZ", () => {
    const label = formatEventTimeRange("2026-09-20T18:00:00-03:00", null);
    expect(label).toMatch(/18:00/);
  });

  it("formats start and end in ART", () => {
    const label = formatEventTimeRange("2026-09-20T18:00:00-03:00", "2026-09-20T20:30:00-03:00");
    expect(label).toMatch(/18:00/);
    expect(label).toMatch(/20:30/);
    expect(label).toContain("–");
  });

  it("keeps late ART evening labels stable under UTC", () => {
    // 01:00Z next day = 22:00 ART previous evening
    const label = formatEventTimeRange("2026-09-21T01:00:00.000Z", null);
    expect(label).toMatch(/22:00/);
  });
});

describe("wallClockHmFromIso", () => {
  it("returns ART wall clock HH:MM from a UTC ISO", () => {
    expect(wallClockHmFromIso("2026-09-20T22:00:00.000Z")).toBe("19:00");
  });

  it("returns empty string for invalid ISO", () => {
    expect(wallClockHmFromIso("nope")).toBe("");
  });
});

describe("eventFormDefaultsFromRow", () => {
  it("maps titulo, descripcion, lugar, fecha and times for the edit form", () => {
    expect(
      eventFormDefaultsFromRow({
        titulo: "Charla",
        descripcion: "Demo",
        lugar: "Espacio Nodo",
        inicio: "2026-09-20T22:00:00.000Z",
        fin: "2026-09-21T00:00:00.000Z",
      }),
    ).toEqual({
      titulo: "Charla",
      descripcion: "Demo",
      lugar: "Espacio Nodo",
      fecha: "2026-09-20",
      inicio: "19:00",
      fin: "21:00",
    });
  });

  it("uses empty descripcion and omits fin when null", () => {
    expect(
      eventFormDefaultsFromRow({
        titulo: "Solo inicio",
        descripcion: null,
        lugar: null,
        inicio: "2026-09-20T22:00:00.000Z",
        fin: null,
      }),
    ).toEqual({
      titulo: "Solo inicio",
      descripcion: "",
      lugar: undefined,
      fecha: "2026-09-20",
      inicio: "19:00",
      fin: undefined,
    });
  });
});
