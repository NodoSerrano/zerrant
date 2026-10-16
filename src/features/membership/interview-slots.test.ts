import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BOOKABLE_INTERVIEW_ESTADOS,
  INTERVIEW_SLOT_MINUTES,
  artWallClockToIso,
  isBookableInterviewEstado,
} from "./interview-slots";
import { MEMBERSHIP_REQUEST_ESTADOS } from "./request-state";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../supabase/migrations");

function migrationSql(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.includes("zer142_interview_slots"));
  expect(files.length).toBe(1);
  return readFileSync(path.join(MIGRATIONS_DIR, files[0]!), "utf8");
}

describe("ZER-142 interview booking contract", () => {
  it("books only while the request is waiting on a slot", () => {
    expect([...BOOKABLE_INTERVIEW_ESTADOS]).toEqual([
      "pendiente_coordinacion",
      "entrevista_solicitada",
      "reprogramacion",
    ]);
    for (const estado of MEMBERSHIP_REQUEST_ESTADOS) {
      expect(isBookableInterviewEstado(estado)).toBe(
        estado === "pendiente_coordinacion" ||
          estado === "entrevista_solicitada" ||
          estado === "reprogramacion",
      );
    }
  });

  it("locks occupancy in Postgres, not in the UI", () => {
    const sql = migrationSql();
    expect(sql).toMatch(/unique \(slot_id\)/);
    expect(sql).toMatch(/unique \(request_id\)/);
    expect(sql).toMatch(/when unique_violation/);
    expect(sql).toMatch(/code', 'conflict'/);
    expect(sql).toMatch(/book_interview_slot/);
    expect(sql).not.toMatch(/calendly\.com/i);
    expect(sql).not.toMatch(/googleapis\.com/i);
    expect(INTERVIEW_SLOT_MINUTES).toBe(30);
  });

  it("lets the owner insert a booking and restricts foreign reads to admins", () => {
    const sql = migrationSql();
    expect(sql).toMatch(/Owner can read own interview bookings/);
    expect(sql).toMatch(/Admins can read all interview bookings/);
    expect(sql).toMatch(/revoke all on public\.interview_bookings from anon, authenticated/);
    expect(sql).toMatch(/grant select on public\.interview_bookings to authenticated/);
    expect(sql).not.toMatch(/for insert/);
  });

  it("converts ART wall clock to an ISO instant (not the machine zone)", () => {
    const iso = artWallClockToIso("2026-10-07T15:00");
    expect(iso).toBe("2026-10-07T18:00:00.000Z");
    expect(artWallClockToIso("nope")).toBeNull();
  });
});
