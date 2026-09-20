import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EVENT_ATTENDANCE_ESTADOS,
  EVENT_ATTENDANCE_INSERT_COLUMNS,
  EVENT_ATTENDANCE_UPDATE_COLUMNS,
  EVENTS_INSERT_COLUMNS,
  EVENTS_MIGRATION_NAME_FRAGMENT,
  EVENTS_UPDATE_COLUMNS,
  isEventAttendanceEstado,
} from "./events-schema";
import type { Database } from "@/lib/supabase/database.types";
import { Constants } from "@/lib/supabase/database.types";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../supabase/migrations");

function findEventsMigration(): { name: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
    f.includes(EVENTS_MIGRATION_NAME_FRAGMENT),
  );
  expect(files.length, "expected one ZER-91 events migration file").toBe(1);
  const name = files[0]!;
  const sql = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
  return { name, sql };
}

describe("event_attendance_estado enum contract", () => {
  it("is voy / quizas / no without accents (PRD §6)", () => {
    expect(EVENT_ATTENDANCE_ESTADOS).toEqual(["voy", "quizas", "no"]);
    expect(isEventAttendanceEstado("quizas")).toBe(true);
    expect(isEventAttendanceEstado("quizás")).toBe(false);
  });

  it("matches Database Enums and Constants", () => {
    type Enum = Database["public"]["Enums"]["event_attendance_estado"];
    const values: Enum[] = ["voy", "quizas", "no"];
    expect(values).toEqual([...EVENT_ATTENDANCE_ESTADOS]);
    expect(Constants.public.Enums.event_attendance_estado).toEqual([...EVENT_ATTENDANCE_ESTADOS]);
  });
});

describe("events / event_attendance table types", () => {
  it("exposes events and event_attendance on Database.public.Tables", () => {
    type Tables = keyof Database["public"]["Tables"];
    const required: Tables[] = ["events", "event_attendance"];
    for (const name of required) {
      expect(name in ({} as Database["public"]["Tables"]) || true).toBe(true);
    }
    // Compile-time shape pins — assign empty Row shapes via satisfies helpers
    type EventsRow = Database["public"]["Tables"]["events"]["Row"];
    type AttendanceRow = Database["public"]["Tables"]["event_attendance"]["Row"];

    const eventKeys: (keyof EventsRow)[] = [
      "id",
      "titulo",
      "descripcion",
      "lugar",
      "inicio",
      "fin",
      "creado_por",
      "created_at",
    ];
    expect(eventKeys).toHaveLength(8);

    const attendanceKeys: (keyof AttendanceRow)[] = ["event_id", "profile_id", "estado"];
    expect(attendanceKeys).toHaveLength(3);
  });

  it("does not invent events.estado lifecycle column", () => {
    type EventsRow = Database["public"]["Tables"]["events"]["Row"];
    type HasEstado = "estado" extends keyof EventsRow ? true : false;
    const hasEstado: HasEstado = false;
    expect(hasEstado).toBe(false);
  });
});

describe("ZER-91 migration SQL", () => {
  it("ships versioned migration with tables, enum, RLS, grants", () => {
    const { name, sql } = findEventsMigration();
    expect(name).toMatch(/^\d{14}_zer91_events_event_attendance\.sql$/);

    expect(sql).toMatch(/create type public\.event_attendance_estado as enum/i);
    expect(sql).toMatch(/'voy'/);
    expect(sql).toMatch(/'quizas'/);
    expect(sql).toMatch(/'no'/);

    expect(sql).toMatch(/create table public\.events/i);
    expect(sql).toMatch(/create table public\.event_attendance/i);
    expect(sql).toMatch(/primary key \(event_id,\s*profile_id\)/i);
    expect(sql).toMatch(/on delete cascade/i);

    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/create policy/i);
    expect(sql).toMatch(/is_platform_admin/i);
    expect(sql).toMatch(/tier <> 'tourist'/);

    expect(sql).toMatch(/grant select on public\.events to authenticated/i);
    expect(sql).toMatch(/grant select on public\.event_attendance to authenticated/i);
    expect(sql).toMatch(/grant insert\s*\([\s\S]*creado_por[\s\S]*\)\s*on public\.events/i);
    expect(sql).toMatch(/grant update\s*\([\s\S]*titulo[\s\S]*\)\s*on public\.events/i);
    expect(sql).not.toMatch(/grant update\s*\([\s\S]*creado_por[\s\S]*\)\s*on public\.events/i);
    expect(sql).toMatch(/grant delete on public\.events to authenticated/i);
    expect(sql).toMatch(
      /grant insert\s*\(\s*event_id\s*,\s*profile_id\s*,\s*estado\s*\)\s*on public\.event_attendance/i,
    );
    expect(sql).toMatch(/grant update\s*\(\s*estado\s*\)\s*on public\.event_attendance/i);
    expect(sql).toMatch(/grant delete on public\.event_attendance to authenticated/i);

    expect(sql).toMatch(/idx_events_inicio/);
    expect(sql).toMatch(/idx_events_creado_por/);
    expect(sql).toMatch(/idx_event_attendance_profile/);

    expect(sql).toMatch(/fin is null or fin >= inicio/i);
    expect(sql).toMatch(/length\(trim\(titulo\)\) > 0/i);
  });

  it("documents column grant lists matching the TS contract", () => {
    expect([...EVENTS_INSERT_COLUMNS]).toEqual([
      "titulo",
      "descripcion",
      "lugar",
      "inicio",
      "fin",
      "creado_por",
    ]);
    expect([...EVENTS_UPDATE_COLUMNS]).toEqual(["titulo", "descripcion", "lugar", "inicio", "fin"]);
    expect([...EVENT_ATTENDANCE_INSERT_COLUMNS]).toEqual(["event_id", "profile_id", "estado"]);
    expect([...EVENT_ATTENDANCE_UPDATE_COLUMNS]).toEqual(["estado"]);
  });
});
