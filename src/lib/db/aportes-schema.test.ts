import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  APORTE_TIPOS,
  APORTES_INSERT_COLUMNS,
  APORTES_MIGRATION_NAME_FRAGMENT,
  APORTES_UPDATE_COLUMNS,
  isAporteTipo,
} from "./aportes-schema";
import type { Database } from "@/lib/supabase/database.types";
import { Constants } from "@/lib/supabase/database.types";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../supabase/migrations");

function findAportesMigration(): { name: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
    f.includes(APORTES_MIGRATION_NAME_FRAGMENT),
  );
  expect(files.length, "expected one ZER-87 aportes migration file").toBe(1);
  const name = files[0]!;
  const sql = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
  return { name, sql };
}

describe("aporte_tipo enum contract", () => {
  it("is the nine PRD values without accents", () => {
    expect(APORTE_TIPOS).toEqual([
      "economico",
      "donacion",
      "prestamo",
      "charla",
      "actividad",
      "mantenimiento",
      "administracion",
      "yerba",
      "otro",
    ]);
    expect(isAporteTipo("economico")).toBe(true);
    expect(isAporteTipo("económico")).toBe(false);
  });

  it("matches Database Enums and Constants", () => {
    type Enum = Database["public"]["Enums"]["aporte_tipo"];
    const values: Enum[] = [...APORTE_TIPOS];
    expect(values).toEqual([...APORTE_TIPOS]);
    expect(Constants.public.Enums.aporte_tipo).toEqual([...APORTE_TIPOS]);
  });
});

describe("aportes table types", () => {
  it("exposes aportes on Database.public.Tables with PRD columns", () => {
    type AportesRow = Database["public"]["Tables"]["aportes"]["Row"];

    const keys: (keyof AportesRow)[] = [
      "id",
      "profile_id",
      "tipo",
      "descripcion",
      "monto",
      "fecha",
      "registrado_por",
      "created_at",
    ];
    expect(keys).toHaveLength(8);

    type HasPuntos = "puntos" extends keyof AportesRow ? true : false;
    const hasPuntos: HasPuntos = false;
    expect(hasPuntos).toBe(false);
  });
});

describe("ZER-87 migration SQL", () => {
  it("ships versioned migration with enum, table, RLS, grants", () => {
    const { name, sql } = findAportesMigration();
    expect(name).toMatch(/^\d{14}_zer87_aportes\.sql$/);

    expect(sql).toMatch(/create type public\.aporte_tipo as enum/i);
    for (const tipo of APORTE_TIPOS) {
      expect(sql).toContain(`'${tipo}'`);
    }

    expect(sql).toMatch(/create table public\.aportes/i);
    expect(sql).toMatch(/profile_id uuid not null/i);
    expect(sql).toMatch(/registrado_por uuid not null/i);
    expect(sql).toMatch(/on delete cascade/i);
    expect(sql).toMatch(/monto is null or monto >= 0/i);

    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/create policy/i);
    expect(sql).toMatch(/is_platform_admin/i);
    expect(sql).toMatch(/tier <> 'tourist'/);

    expect(sql).toMatch(/grant select on public\.aportes to authenticated/i);
    expect(sql).toMatch(
      /grant insert\s*\(\s*profile_id\s*,\s*tipo\s*,\s*descripcion\s*,\s*monto\s*,\s*fecha\s*,\s*registrado_por\s*\)\s*on public\.aportes/i,
    );
    expect(sql).toMatch(
      /grant update\s*\(\s*tipo\s*,\s*descripcion\s*,\s*monto\s*,\s*fecha\s*\)\s*on public\.aportes/i,
    );
    expect(sql).not.toMatch(/grant update\s*\([\s\S]*profile_id[\s\S]*\)\s*on public\.aportes/i);
    expect(sql).not.toMatch(
      /grant update\s*\([\s\S]*registrado_por[\s\S]*\)\s*on public\.aportes/i,
    );
    expect(sql).toMatch(/grant delete on public\.aportes to authenticated/i);

    expect(sql).toMatch(/idx_aportes_profile_id/);
    expect(sql).toMatch(/idx_aportes_fecha/);
    expect(sql).toMatch(/idx_aportes_registrado_por/);
  });

  it("documents column grant lists matching the TS contract", () => {
    expect([...APORTES_INSERT_COLUMNS]).toEqual([
      "profile_id",
      "tipo",
      "descripcion",
      "monto",
      "fecha",
      "registrado_por",
    ]);
    expect([...APORTES_UPDATE_COLUMNS]).toEqual(["tipo", "descripcion", "monto", "fecha"]);
  });
});
