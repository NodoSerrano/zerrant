import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { APORTE_TIPOS } from "./aportes-schema";
import {
  APORTE_ESTADOS,
  DONACIONES_MIGRATION_NAME_FRAGMENT,
  DONACIONES_PRESTAMO_FECHAS_MIGRATION_FRAGMENT,
  DONACION_APPROVAL_COLUMNS,
  DONACION_INSERT_EXTRA_COLUMNS,
  DONACION_PRESTAMO_FECHA_COLUMNS,
  DONACION_STORAGE_BUCKET,
  DONACION_TIPOS_UI,
  DONACION_TIPO_TO_APORTE,
  canOwnerEditDonacion,
  canSerranoSeeAporteRow,
  formatPrestamoRango,
  isDonacionTipoUi,
  mapDonacionTipoToAporte,
} from "./donaciones-schema";
import type { Database } from "@/lib/supabase/database.types";
import { Constants } from "@/lib/supabase/database.types";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../supabase/migrations");

function findDonacionesMigration(): { name: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
    f.includes(DONACIONES_MIGRATION_NAME_FRAGMENT),
  );
  expect(files.length, "expected one ZER-166 donaciones migration file").toBe(1);
  const name = files[0]!;
  const sql = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
  return { name, sql };
}

describe("donacion UI tipos (product)", () => {
  it("is only regalo | por_un_tiempo and maps onto existing M6 enum values", () => {
    expect([...DONACION_TIPOS_UI]).toEqual(["regalo", "por_un_tiempo"]);
    expect(mapDonacionTipoToAporte("regalo")).toBe("donacion");
    expect(mapDonacionTipoToAporte("por_un_tiempo")).toBe("prestamo");
    expect(DONACION_TIPO_TO_APORTE.regalo).toBe("donacion");
    expect(isDonacionTipoUi("regalo")).toBe(true);
    expect(isDonacionTipoUi("economico")).toBe(false);
  });

  it("does not invent a tenth aporte_tipo — M6 nine values stay intact", () => {
    expect(APORTE_TIPOS).toHaveLength(9);
    expect(APORTE_TIPOS).toContain("donacion");
    expect(APORTE_TIPOS).toContain("prestamo");
    expect(APORTE_TIPOS).not.toContain("regalo");
    expect(APORTE_TIPOS).not.toContain("por_un_tiempo");
  });
});

describe("aporte_estado + visibility helpers", () => {
  it("defines pendiente | aprobado | rechazado", () => {
    expect([...APORTE_ESTADOS]).toEqual(["pendiente", "aprobado", "rechazado"]);
  });

  it("hides all rows from tourists", () => {
    expect(
      canSerranoSeeAporteRow({
        estado: "aprobado",
        profileId: "a",
        viewerId: "b",
        isPlatformAdmin: false,
        viewerIsTourist: true,
      }),
    ).toBe(false);
  });

  it("lets owner see own pending donation", () => {
    expect(
      canSerranoSeeAporteRow({
        estado: "pendiente",
        profileId: "me",
        viewerId: "me",
        isPlatformAdmin: false,
        viewerIsTourist: false,
      }),
    ).toBe(true);
  });

  it("hides someone else's pending from a non-admin serrano", () => {
    expect(
      canSerranoSeeAporteRow({
        estado: "pendiente",
        profileId: "other",
        viewerId: "me",
        isPlatformAdmin: false,
        viewerIsTourist: false,
      }),
    ).toBe(false);
  });

  it("shows approved community donations to serranos", () => {
    expect(
      canSerranoSeeAporteRow({
        estado: "aprobado",
        profileId: "other",
        viewerId: "me",
        isPlatformAdmin: false,
        viewerIsTourist: false,
      }),
    ).toBe(true);
  });

  it("keeps M6 ledger rows (estado null) visible to serranos", () => {
    expect(
      canSerranoSeeAporteRow({
        estado: null,
        profileId: "other",
        viewerId: "me",
        isPlatformAdmin: false,
        viewerIsTourist: false,
      }),
    ).toBe(true);
  });

  it("owner edits only while pending (or legacy null); admin always", () => {
    expect(canOwnerEditDonacion({ estado: "pendiente", isPlatformAdmin: false })).toBe(true);
    expect(canOwnerEditDonacion({ estado: "aprobado", isPlatformAdmin: false })).toBe(false);
    expect(canOwnerEditDonacion({ estado: "aprobado", isPlatformAdmin: true })).toBe(true);
    expect(canOwnerEditDonacion({ estado: null, isPlatformAdmin: false })).toBe(true);
  });
});

describe("ZER-166 migration SQL", () => {
  it("ships versioned migration with estado, titulo, imagen, RPCs, RLS, storage", () => {
    const { name, sql } = findDonacionesMigration();
    expect(name).toMatch(/^\d{14}_zer166_donaciones\.sql$/);

    expect(sql).toMatch(/create type public\.aporte_estado as enum/i);
    for (const estado of APORTE_ESTADOS) {
      expect(sql).toContain(`'${estado}'`);
    }

    expect(sql).toMatch(/alter table public\.aportes/i);
    expect(sql).toMatch(/add column.*titulo/i);
    expect(sql).toMatch(/add column.*estado/i);
    expect(sql).toMatch(/add column.*imagen_path/i);
    expect(sql).toMatch(/add column.*aprobado_por/i);
    expect(sql).toMatch(/add column.*aprobado_en/i);
    expect(sql).toMatch(/add column.*notas_admin/i);

    expect(sql).toMatch(/approve_aporte_donacion/i);
    expect(sql).toMatch(/reject_aporte_donacion/i);
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/profile_id\s*<>\s*auth\.uid\(\)/i);
    expect(sql).toMatch(/is_platform_admin/i);

    expect(sql).toMatch(/drop policy(?: if exists)? "Serranos can read aportes"/i);
    expect(sql).toMatch(/create policy/i);
    expect(sql).toMatch(/estado is null/i);
    expect(sql).toMatch(/estado = 'aprobado'/i);

    expect(sql).toMatch(new RegExp(DONACION_STORAGE_BUCKET));
    expect(sql).toMatch(/storage\.buckets/i);

    expect(sql).toMatch(/grant insert/i);
    expect(sql).toMatch(/titulo/i);
    // Approval columns must not be freely updatable by authenticated clients
    expect(sql).toMatch(/revoke execute on function public\.approve_aporte_donacion/i);
    expect(sql).toMatch(/revoke execute on function public\.reject_aporte_donacion/i);

    for (const col of DONACION_INSERT_EXTRA_COLUMNS) {
      expect(sql.toLowerCase()).toContain(col);
    }
    for (const col of DONACION_APPROVAL_COLUMNS) {
      expect(sql.toLowerCase()).toContain(col);
    }
  });

  it("exposes aporte_estado on Database enums once types are regenerated", () => {
    type Estado = Database["public"]["Enums"]["aporte_estado"];
    const values: Estado[] = [...APORTE_ESTADOS];
    expect(values).toEqual([...APORTE_ESTADOS]);
    expect(Constants.public.Enums.aporte_estado).toEqual([...APORTE_ESTADOS]);
  });

  it("exposes donation columns on aportes Row", () => {
    type Row = Database["public"]["Tables"]["aportes"]["Row"];
    type HasTitulo = "titulo" extends keyof Row ? true : false;
    type HasEstado = "estado" extends keyof Row ? true : false;
    type HasImagen = "imagen_path" extends keyof Row ? true : false;
    type HasAprobadoPor = "aprobado_por" extends keyof Row ? true : false;
    type HasPrestamoDesde = "prestamo_desde" extends keyof Row ? true : false;
    type HasPrestamoHasta = "prestamo_hasta" extends keyof Row ? true : false;
    const hasTitulo: HasTitulo = true;
    const hasEstado: HasEstado = true;
    const hasImagen: HasImagen = true;
    const hasAprobadoPor: HasAprobadoPor = true;
    const hasPrestamoDesde: HasPrestamoDesde = true;
    const hasPrestamoHasta: HasPrestamoHasta = true;
    expect(
      hasTitulo && hasEstado && hasImagen && hasAprobadoPor && hasPrestamoDesde && hasPrestamoHasta,
    ).toBe(true);

    type HasValorEstimado = "valor_estimado" extends keyof Row ? true : false;
    const hasValor: HasValorEstimado = false;
    expect(hasValor).toBe(false);
  });
});

describe("ZER-166 prestamo fechas migration", () => {
  it("ships versioned migration with optional range columns + check + grants", () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
      f.includes(DONACIONES_PRESTAMO_FECHAS_MIGRATION_FRAGMENT),
    );
    expect(files.length).toBe(1);
    const sql = readFileSync(path.join(MIGRATIONS_DIR, files[0]!), "utf8");
    for (const col of DONACION_PRESTAMO_FECHA_COLUMNS) {
      expect(sql.toLowerCase()).toContain(col);
    }
    expect(sql).toMatch(/aportes_prestamo_rango_ok/i);
    expect(sql).toMatch(/grant insert/i);
  });

  it("formatPrestamoRango covers full, partial, and empty", () => {
    const fmt = (d: string) => d;
    expect(formatPrestamoRango(null, null, fmt)).toBeNull();
    expect(formatPrestamoRango("2026-10-01", "2026-11-01", fmt)).toBe("2026-10-01 → 2026-11-01");
    expect(formatPrestamoRango("2026-10-01", null, fmt)).toBe("desde 2026-10-01");
    expect(formatPrestamoRango(null, "2026-11-01", fmt)).toBe("hasta 2026-11-01");
  });
});
