import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROJECT_ESTADOS,
  PROJECT_INGRESOS,
  PROJECT_MEMBER_ESTADOS,
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBERS_INSERT_COLUMNS,
  PROJECT_MEMBERS_UPDATE_COLUMNS,
  PROJECTS_INSERT_COLUMNS,
  PROJECTS_MIGRATION_NAME_FRAGMENT,
  PROJECTS_UPDATE_COLUMNS,
  isProjectEstado,
  isProjectIngreso,
} from "./projects-schema";
import type { Database } from "@/lib/supabase/database.types";
import { Constants } from "@/lib/supabase/database.types";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../supabase/migrations");

function findProjectsMigration(): { name: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
    f.includes(PROJECTS_MIGRATION_NAME_FRAGMENT),
  );
  expect(files.length, "expected one ZER-78 projects migration file").toBe(1);
  const name = files[0]!;
  const sql = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
  return { name, sql };
}

describe("project enum contracts", () => {
  it("locks PRD Spanish enum values", () => {
    expect(PROJECT_ESTADOS).toEqual(["idea", "en_curso", "pausado", "terminado"]);
    expect(PROJECT_INGRESOS).toEqual(["abierto", "aprobacion"]);
    expect(PROJECT_MEMBER_ROLES).toEqual(["miembro", "admin"]);
    expect(PROJECT_MEMBER_ESTADOS).toEqual(["pendiente", "aprobado"]);
    expect(isProjectEstado("en_curso")).toBe(true);
    expect(isProjectEstado("en curso")).toBe(false);
    expect(isProjectIngreso("aprobacion")).toBe(true);
    expect(isProjectIngreso("aprobación")).toBe(false);
  });

  it("matches Database Enums and Constants", () => {
    type ProjectEstadoEnum = Database["public"]["Enums"]["project_estado"];
    type ProjectIngresoEnum = Database["public"]["Enums"]["project_ingreso"];
    type ProjectMemberRolEnum = Database["public"]["Enums"]["project_member_rol"];
    type ProjectMemberEstadoEnum = Database["public"]["Enums"]["project_member_estado"];

    const estados: ProjectEstadoEnum[] = [...PROJECT_ESTADOS];
    const ingresos: ProjectIngresoEnum[] = [...PROJECT_INGRESOS];
    const roles: ProjectMemberRolEnum[] = [...PROJECT_MEMBER_ROLES];
    const memberEstados: ProjectMemberEstadoEnum[] = [...PROJECT_MEMBER_ESTADOS];

    expect(estados).toEqual([...PROJECT_ESTADOS]);
    expect(ingresos).toEqual([...PROJECT_INGRESOS]);
    expect(roles).toEqual([...PROJECT_MEMBER_ROLES]);
    expect(memberEstados).toEqual([...PROJECT_MEMBER_ESTADOS]);
    expect(Constants.public.Enums.project_estado).toEqual([...PROJECT_ESTADOS]);
    expect(Constants.public.Enums.project_ingreso).toEqual([...PROJECT_INGRESOS]);
    expect(Constants.public.Enums.project_member_rol).toEqual([...PROJECT_MEMBER_ROLES]);
    expect(Constants.public.Enums.project_member_estado).toEqual([...PROJECT_MEMBER_ESTADOS]);
  });
});

describe("projects / project_members table types", () => {
  it("exposes projects with PRD columns", () => {
    type ProjectsRow = Database["public"]["Tables"]["projects"]["Row"];
    const keys: (keyof ProjectsRow)[] = [
      "id",
      "nombre",
      "descripcion",
      "estado",
      "ingreso",
      "creado_por",
      "created_at",
    ];
    expect(keys).toHaveLength(7);
  });

  it("exposes project_members with composite membership shape", () => {
    type MembersRow = Database["public"]["Tables"]["project_members"]["Row"];
    const keys: (keyof MembersRow)[] = ["project_id", "profile_id", "rol", "estado"];
    expect(keys).toHaveLength(4);
  });
});

describe("ZER-78 migration SQL", () => {
  it("ships versioned migration with enums, tables, definer helper, bootstrap, RLS, grants", () => {
    const { name, sql } = findProjectsMigration();
    expect(name).toMatch(/^\d{14}_zer78_projects_project_members\.sql$/);

    expect(sql).toMatch(/create type public\.project_estado as enum/i);
    expect(sql).toMatch(/create type public\.project_ingreso as enum/i);
    expect(sql).toMatch(/create type public\.project_member_rol as enum/i);
    expect(sql).toMatch(/create type public\.project_member_estado as enum/i);
    for (const value of [
      ...PROJECT_ESTADOS,
      ...PROJECT_INGRESOS,
      ...PROJECT_MEMBER_ROLES,
      ...PROJECT_MEMBER_ESTADOS,
    ]) {
      expect(sql).toContain(`'${value}'`);
    }

    expect(sql).toMatch(/create table public\.projects/i);
    expect(sql).toMatch(/create table public\.project_members/i);
    expect(sql).toMatch(/creado_por uuid not null/i);
    expect(sql).toMatch(/default 'idea'/i);
    expect(sql).toMatch(/default 'aprobacion'/i);
    expect(sql).toMatch(/primary key \(project_id, profile_id\)/i);
    expect(sql).toMatch(/references public\.projects\(id\) on delete/i);

    expect(sql).toMatch(
      /create or replace function public\.is_project_admin\s*\(\s*p_project_id uuid\s*\)/i,
    );
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/set search_path = ''/i);
    expect(sql).toMatch(/revoke execute on function public\.is_project_admin/i);
    expect(sql).toMatch(
      /grant execute on function public\.is_project_admin\([^)]*\) to authenticated, service_role/i,
    );
    const fnMatch = sql.match(
      /create or replace function public\.is_project_admin\s*\([\s\S]*?\$\$[\s\S]*?\$\$;/i,
    );
    expect(fnMatch, "is_project_admin function body").toBeTruthy();
    expect(fnMatch![0].toLowerCase()).not.toContain("is_platform_admin");

    expect(sql).toMatch(/create or replace function public\.seat_project_creator_as_admin/i);
    expect(sql).toMatch(/create trigger trg_projects_seat_creator/i);
    expect(sql).toMatch(/after insert on public\.projects/i);
    expect(sql).toMatch(/values \(new\.id, new\.creado_por, 'admin', 'aprobado'\)/i);

    expect(sql).toMatch(/alter table public\.projects enable row level security/i);
    expect(sql).toMatch(/alter table public\.project_members enable row level security/i);
    expect(sql).toMatch(/is_non_tourist\(\)/i);
    expect(sql).toMatch(/is_project_admin\(/i);
    expect(sql).toMatch(/rol = 'miembro'/);
    expect(sql).toMatch(/estado = 'pendiente'/);
    expect(sql).not.toMatch(
      /create policy[\s\S]*on public\.project_members[\s\S]*exists\s*\(\s*select 1 from public\.project_members/i,
    );

    expect(sql).toMatch(/grant select on public\.projects to authenticated/i);
    expect(sql).toMatch(/grant select on public\.project_members to authenticated/i);
    expect(sql).toMatch(
      /grant insert\s*\(\s*nombre\s*,\s*descripcion\s*,\s*estado\s*,\s*ingreso\s*,\s*creado_por\s*\)\s*on public\.projects/i,
    );
    expect(sql).toMatch(
      /grant update\s*\(\s*nombre\s*,\s*descripcion\s*,\s*estado\s*,\s*ingreso\s*\)\s*on public\.projects/i,
    );
    expect(sql).not.toMatch(/grant update\s*\([\s\S]*creado_por[\s\S]*\)\s*on public\.projects/i);
    expect(sql).toMatch(
      /grant insert\s*\(\s*project_id\s*,\s*profile_id\s*\)\s*on public\.project_members/i,
    );
    // INSERT grant must not include rol/estado (UPDATE grant may still list them).
    const insertGrant = sql.match(/grant insert\s*\(([^)]*)\)\s*on public\.project_members/i);
    expect(insertGrant, "project_members INSERT grant").toBeTruthy();
    expect(insertGrant![1].toLowerCase()).not.toMatch(/\brol\b/);
    expect(insertGrant![1].toLowerCase()).not.toMatch(/\bestado\b/);
    expect(sql).toMatch(/grant update\s*\(\s*rol\s*,\s*estado\s*\)\s*on public\.project_members/i);
    expect(sql).toMatch(/grant delete on public\.project_members to authenticated/i);
    expect(sql).not.toMatch(/grant delete on public\.projects/i);
  });

  it("documents column grant lists matching the TS contract", () => {
    expect([...PROJECTS_INSERT_COLUMNS]).toEqual([
      "nombre",
      "descripcion",
      "estado",
      "ingreso",
      "creado_por",
    ]);
    expect([...PROJECTS_UPDATE_COLUMNS]).toEqual(["nombre", "descripcion", "estado", "ingreso"]);
    expect([...PROJECT_MEMBERS_INSERT_COLUMNS]).toEqual(["project_id", "profile_id", "estado"]);
    expect([...PROJECT_MEMBERS_UPDATE_COLUMNS]).toEqual(["rol", "estado"]);
  });
});

describe("ZER-82 ingreso door migration SQL", () => {
  it("replaces self-join WITH CHECK with the projects.ingreso door and grants estado", () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((f) =>
      f.includes("zer82_project_members_ingreso_door"),
    );
    expect(files.length, "expected one ZER-82 door migration").toBe(1);
    const sql = readFileSync(path.join(MIGRATIONS_DIR, files[0]!), "utf8");

    expect(sql).toMatch(/drop policy if exists "Serranos can self-join projects"/i);
    expect(sql).toMatch(/create policy "Serranos can self-join projects"/i);
    expect(sql).toMatch(/rol = 'miembro'/);
    expect(sql).toMatch(/profile_id\s*=\s*auth\.uid\(\)/);
    expect(sql).toMatch(/is_non_tourist\(\)/);
    expect(sql).toMatch(/from public\.projects/);
    expect(sql).toMatch(/ingreso = 'abierto'/);
    expect(sql).toMatch(/estado = 'aprobado'/);
    expect(sql).toMatch(/ingreso = 'aprobacion'/);
    expect(sql).toMatch(/estado = 'pendiente'/);
    // Must not recurse into project_members inside the insert policy body.
    expect(sql).not.toMatch(
      /create policy[\s\S]*on public\.project_members[\s\S]*exists\s*\(\s*select 1 from public\.project_members/i,
    );
    const insertGrant = sql.match(/grant insert\s*\(([^)]*)\)\s*on public\.project_members/i);
    expect(insertGrant, "project_members INSERT grant").toBeTruthy();
    expect(insertGrant![1].toLowerCase()).toMatch(/\bestado\b/);
    expect(insertGrant![1].toLowerCase()).not.toMatch(/\brol\b/);
  });
});
