import { describe, expect, it } from "vitest";
import { REAPPLY_COOLDOWN_DAYS, formatReapplyDate, gateClosedIds, reapplyStatus } from "./reapply";

const NOW = new Date("2026-10-26T15:00:00.000Z");

describe("reapplyStatus (ZER-180)", () => {
  it("allows a first request when nothing was closed", () => {
    expect(reapplyStatus(null, NOW)).toEqual({ allowed: true });
  });

  it(`blocks for ${REAPPLY_COOLDOWN_DAYS} days after the request closed`, () => {
    expect(
      reapplyStatus({ cerradaEn: "2026-10-20T15:00:00.000Z", reaperturaHabilitadaEn: null }, NOW),
    ).toEqual({ allowed: false, availableFrom: "2026-11-19T15:00:00.000Z" });
  });

  it("allows it once the 30 days are over", () => {
    expect(
      reapplyStatus({ cerradaEn: "2026-09-26T15:00:00.000Z", reaperturaHabilitadaEn: null }, NOW),
    ).toEqual({ allowed: true });
    expect(
      reapplyStatus({ cerradaEn: "2026-09-26T14:59:59.000Z", reaperturaHabilitadaEn: null }, NOW),
    ).toEqual({ allowed: true });
  });

  it("allows it earlier when an admin enabled it", () => {
    expect(
      reapplyStatus(
        {
          cerradaEn: "2026-10-25T15:00:00.000Z",
          reaperturaHabilitadaEn: "2026-10-26T10:00:00.000Z",
        },
        NOW,
      ),
    ).toEqual({ allowed: true });
  });

  it("fails closed when the closing date is unknown, like the DB gate", () => {
    expect(reapplyStatus({ cerradaEn: null, reaperturaHabilitadaEn: null }, NOW)).toEqual({
      allowed: false,
      availableFrom: null,
    });
  });
});

describe("formatReapplyDate", () => {
  it("prints the day in Argentina", () => {
    // 01:30 UTC on the 20th is still the 19th in Argentina.
    expect(formatReapplyDate("2026-11-20T01:30:00.000Z")).toBe("19 de noviembre");
  });
});

describe("gateClosedIds", () => {
  it("picks the latest dated close per profile, and a dated close over a null", () => {
    const ids = gateClosedIds([
      {
        id: "old",
        profileId: "p1",
        estado: "cerrada",
        cerradaEn: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
      {
        id: "null-row",
        profileId: "p1",
        estado: "cerrada",
        cerradaEn: null,
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
      {
        id: "latest",
        profileId: "p1",
        estado: "cerrada",
        cerradaEn: "2026-10-20T00:00:00.000Z",
        updatedAt: "2026-10-20T00:00:00.000Z",
      },
      {
        id: "other",
        profileId: "p2",
        estado: "cerrada",
        cerradaEn: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
      },
      {
        id: "open",
        profileId: "p1",
        estado: "pendiente_coordinacion",
        cerradaEn: null,
        updatedAt: "2026-10-26T00:00:00.000Z",
      },
    ]);
    expect([...ids].sort()).toEqual(["latest", "other"]);
  });
});
