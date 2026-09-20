import { describe, expect, it } from "vitest";
import {
  ageFromBirthDate,
  nextBirthdayOccurrence,
  upcomingBirthdays,
  type BirthdayProfileInput,
} from "./birthdays";

function profile(
  overrides: Partial<BirthdayProfileInput> & Pick<BirthdayProfileInput, "id">,
): BirthdayProfileInput {
  return {
    nombre: "Ana",
    apellido: "García",
    apodo: null,
    nombre_visible: "nombre_apellido",
    fecha_nacimiento: "1990-01-15",
    avatar_url: null,
    ...overrides,
  };
}

describe("ageFromBirthDate", () => {
  it("returns integer age for a fixed today before the birthday this year", () => {
    // Born 1990-06-15; on 2026-03-01 they are still 35
    expect(ageFromBirthDate("1990-06-15", "2026-03-01")).toBe(35);
  });

  it("returns integer age on the birthday itself", () => {
    expect(ageFromBirthDate("1990-06-15", "2026-06-15")).toBe(36);
  });

  it("returns integer age after the birthday this year", () => {
    expect(ageFromBirthDate("1990-06-15", "2026-12-31")).toBe(36);
  });

  it("returns null for null or empty birth date", () => {
    expect(ageFromBirthDate(null, "2026-03-01")).toBeNull();
    expect(ageFromBirthDate("", "2026-03-01")).toBeNull();
  });

  it("returns null for unparseable birth date", () => {
    expect(ageFromBirthDate("not-a-date", "2026-03-01")).toBeNull();
    expect(ageFromBirthDate("1990-13-40", "2026-03-01")).toBeNull();
  });

  it("handles Feb 29 birthdays in a non-leap year without crashing", () => {
    // Policy: celebrate / age tick on Feb 28 in non-leap years.
    expect(ageFromBirthDate("2000-02-29", "2026-02-27")).toBe(25);
    expect(ageFromBirthDate("2000-02-29", "2026-02-28")).toBe(26);
    expect(ageFromBirthDate("2000-02-29", "2026-03-01")).toBe(26);
  });

  it("handles Feb 29 birthdays in a leap year on the real day", () => {
    expect(ageFromBirthDate("2000-02-29", "2024-02-28")).toBe(23);
    expect(ageFromBirthDate("2000-02-29", "2024-02-29")).toBe(24);
  });
});

describe("nextBirthdayOccurrence", () => {
  it("returns today when the birthday is today", () => {
    expect(nextBirthdayOccurrence("1990-03-10", "2026-03-10")).toBe("2026-03-10");
  });

  it("returns this year when the birthday is still ahead", () => {
    expect(nextBirthdayOccurrence("1990-12-01", "2026-03-10")).toBe("2026-12-01");
  });

  it("rolls to next year when the birthday already passed", () => {
    expect(nextBirthdayOccurrence("1990-01-05", "2026-03-10")).toBe("2027-01-05");
  });

  it("maps Feb 29 to Feb 28 in a non-leap target year", () => {
    expect(nextBirthdayOccurrence("2000-02-29", "2026-01-01")).toBe("2026-02-28");
    expect(nextBirthdayOccurrence("2000-02-29", "2026-03-01")).toBe("2027-02-28");
  });

  it("keeps Feb 29 in a leap target year", () => {
    expect(nextBirthdayOccurrence("2000-02-29", "2024-01-01")).toBe("2024-02-29");
    expect(nextBirthdayOccurrence("2000-02-29", "2024-03-01")).toBe("2025-02-28");
  });
});

describe("upcomingBirthdays", () => {
  const today = "2026-03-10";

  it("includes birthdays within the default 30-day inclusive window, sorted ascending", () => {
    const rows = [
      profile({ id: "later", fecha_nacimiento: "1991-04-05", nombre: "Luego" }),
      profile({ id: "sooner", fecha_nacimiento: "1988-03-15", nombre: "Pronto" }),
      profile({ id: "edge", fecha_nacimiento: "1995-04-09", nombre: "Borde" }),
    ];

    const result = upcomingBirthdays(rows, { today });

    expect(result.map((r) => r.profileId)).toEqual(["sooner", "later", "edge"]);
    expect(result[0]).toMatchObject({
      profileId: "sooner",
      displayName: "Pronto García",
      fechaNacimiento: "1988-03-15",
      nextOccurrence: "2026-03-15",
      daysUntil: 5,
      ageTurning: 38,
    });
    expect(result[2].nextOccurrence).toBe("2026-04-09");
    expect(result[2].daysUntil).toBe(30);
  });

  it("includes today's birthday (daysUntil 0)", () => {
    const rows = [profile({ id: "hoy", fecha_nacimiento: "1990-03-10", nombre: "Hoy" })];
    const result = upcomingBirthdays(rows, { today });
    expect(result).toHaveLength(1);
    expect(result[0].daysUntil).toBe(0);
    expect(result[0].nextOccurrence).toBe("2026-03-10");
  });

  it("excludes null and invalid fecha_nacimiento", () => {
    const rows = [
      profile({ id: "ok", fecha_nacimiento: "1990-03-12" }),
      profile({ id: "nullish", fecha_nacimiento: null }),
      profile({ id: "bad", fecha_nacimiento: "nope" }),
    ];
    const result = upcomingBirthdays(rows, { today });
    expect(result.map((r) => r.profileId)).toEqual(["ok"]);
  });

  it("excludes birthdays outside the window", () => {
    const rows = [
      profile({ id: "in", fecha_nacimiento: "1990-03-20" }),
      profile({ id: "out", fecha_nacimiento: "1990-05-01" }),
    ];
    expect(upcomingBirthdays(rows, { today }).map((r) => r.profileId)).toEqual(["in"]);
  });

  it("respects a custom windowDays", () => {
    const rows = [
      profile({ id: "near", fecha_nacimiento: "1990-03-12" }),
      profile({ id: "far", fecha_nacimiento: "1990-03-25" }),
    ];
    expect(upcomingBirthdays(rows, { today, windowDays: 5 }).map((r) => r.profileId)).toEqual([
      "near",
    ]);
  });

  it("uses displayName rules (apodo when nombre_visible is apodo)", () => {
    const rows = [
      profile({
        id: "nick",
        fecha_nacimiento: "1990-03-11",
        apodo: "Nico",
        nombre_visible: "apodo",
      }),
    ];
    expect(upcomingBirthdays(rows, { today })[0].displayName).toBe("Nico");
  });

  it("applies leap-day policy inside the upcoming list", () => {
    // From 2026-02-01, next Feb 29 occurrence maps to 2026-02-28 within 30 days.
    const rows = [profile({ id: "leap", fecha_nacimiento: "2000-02-29", nombre: "Leap" })];
    const result = upcomingBirthdays(rows, { today: "2026-02-01", windowDays: 30 });
    expect(result).toHaveLength(1);
    expect(result[0].nextOccurrence).toBe("2026-02-28");
    expect(result[0].daysUntil).toBe(27);
  });
});
