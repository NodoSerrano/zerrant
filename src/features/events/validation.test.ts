import { describe, expect, it } from "vitest";
import { parseAgendaWallClockIso, validateEventRange } from "./validation";

describe("validateEventRange", () => {
  it("accepts fin after inicio", () => {
    expect(
      validateEventRange({
        inicio: "2026-09-20T22:00:00.000Z",
        fin: "2026-09-20T23:00:00.000Z",
      }),
    ).toEqual({ ok: true });
  });

  it("accepts fin equal to inicio (not before)", () => {
    expect(
      validateEventRange({
        inicio: "2026-09-20T22:00:00.000Z",
        fin: "2026-09-20T22:00:00.000Z",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects fin before inicio", () => {
    expect(
      validateEventRange({
        inicio: "2026-09-20T23:00:00.000Z",
        fin: "2026-09-20T22:00:00.000Z",
      }),
    ).toEqual({ ok: false, error: "La hora de fin no puede ser anterior al inicio." });
  });

  it("rejects unparseable inicio", () => {
    expect(validateEventRange({ inicio: "nope", fin: "2026-09-20T22:00:00.000Z" })).toEqual({
      ok: false,
      error: "Revisá la fecha y la hora del evento.",
    });
  });

  it("rejects unparseable fin when provided", () => {
    expect(validateEventRange({ inicio: "2026-09-20T22:00:00.000Z", fin: "nope" })).toEqual({
      ok: false,
      error: "Revisá la fecha y la hora del evento.",
    });
  });

  it("allows null fin", () => {
    expect(validateEventRange({ inicio: "2026-09-20T22:00:00.000Z", fin: null })).toEqual({
      ok: true,
    });
  });
});

describe("parseAgendaWallClockIso", () => {
  it("parses ART wall clock to a stable UTC ISO", () => {
    // 19:00 ART on 2026-09-20 == 22:00Z
    expect(parseAgendaWallClockIso("2026-09-20", "19:00")).toBe("2026-09-20T22:00:00.000Z");
  });

  it("keeps a near-midnight ART start on the same calendar day", () => {
    // 23:30 ART == 02:30Z next UTC day, still day key 2026-09-20 for agenda
    expect(parseAgendaWallClockIso("2026-09-20", "23:30")).toBe("2026-09-21T02:30:00.000Z");
  });

  it("rejects unparseable day or time", () => {
    expect(parseAgendaWallClockIso("nope", "19:00")).toBeNull();
    expect(parseAgendaWallClockIso("2026-09-20", "25:99")).toBeNull();
    expect(parseAgendaWallClockIso("2026-09-20", "")).toBeNull();
  });
});
