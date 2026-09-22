import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  APORTE_ACTITUD_VALUES,
  DURACION_VISITA_VALUES,
  FRECUENCIA_USO_VALUES,
  MEMBERSHIP_REQUESTS_INSERT_COLUMNS,
  SITUACION_ACTUAL_VALUES,
  APORTE_MAYOR_VALUES,
} from "@/features/membership/screening";
import type { Database } from "@/lib/supabase/database.types";
import { Constants } from "@/lib/supabase/database.types";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../supabase/migrations");
const FRAGMENT = "zer108_membership_screening";

function findMigration(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.includes(FRAGMENT));
  expect(files.length).toBe(1);
  return readFileSync(path.join(MIGRATIONS_DIR, files[0]!), "utf8");
}

describe("ZER-108 membership screening schema", () => {
  it("migration creates enums, columns and insert grants", () => {
    const sql = findMigration();
    expect(sql).toMatch(/create type public\.membership_frecuencia_uso/);
    expect(sql).toMatch(/add column contacto_whatsapp text/);
    expect(sql).toMatch(/add column reunion_disponibilidad text/);
    expect(sql).toMatch(/grant insert \(/);
    expect(sql).toMatch(/contacto_whatsapp/);
    expect(sql).not.toMatch(/grant insert \([^)]*tier_solicitado/);
  });

  it("TS enums match Database Constants", () => {
    expect(Constants.public.Enums.membership_frecuencia_uso).toEqual([...FRECUENCIA_USO_VALUES]);
    expect(Constants.public.Enums.membership_duracion_visita).toEqual([...DURACION_VISITA_VALUES]);
    expect(Constants.public.Enums.membership_aporte_actitud).toEqual([...APORTE_ACTITUD_VALUES]);
    expect(Constants.public.Enums.membership_situacion_actual).toEqual([
      ...SITUACION_ACTUAL_VALUES,
    ]);
    expect(Constants.public.Enums.membership_aporte_mayor).toEqual([...APORTE_MAYOR_VALUES]);
  });

  it("Row type includes screening columns", () => {
    type Row = Database["public"]["Tables"]["membership_requests"]["Row"];
    const keys: (keyof Row)[] = [
      "contacto_whatsapp",
      "frecuencia_uso",
      "duracion_visita",
      "aporte_actitud",
      "reunion_disponibilidad",
      "situacion_actual",
      "ocupacion_detalle",
      "entrevista_items",
      "aporte_otro",
      "aporte_mayor",
      "mensaje",
    ];
    expect(keys).toHaveLength(11);
    expect([...MEMBERSHIP_REQUESTS_INSERT_COLUMNS]).toContain("contacto_whatsapp");
  });
});
