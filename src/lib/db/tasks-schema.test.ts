import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TASKS_SELECT_POLICY, TASKS_SELECT_USING } from "./tasks-schema";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase/migrations");

function readAllMigrations(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(path.join(MIGRATIONS_DIR, f), "utf8"))
    .join("\n\n");
}

describe("tasks members-only SELECT (ZER-107)", () => {
  it("exports the members-only select policy contract", () => {
    expect(TASKS_SELECT_POLICY).toBe("Members can read tasks");
    expect(TASKS_SELECT_USING).toContain("is_non_tourist");
  });

  it("ships a migration that replaces any-authenticated task reads with is_non_tourist", () => {
    const sql = readAllMigrations();
    const files = readdirSync(MIGRATIONS_DIR).filter(
      (f) => f.includes("zer107") && f.endsWith(".sql"),
    );
    expect(files.length, "expected a ZER-107 members-only read migration").toBeGreaterThanOrEqual(
      1,
    );
    const zer107 = files.map((f) => readFileSync(path.join(MIGRATIONS_DIR, f), "utf8")).join("\n");

    expect(zer107).toMatch(/drop policy if exists "Authenticated users can read tasks"/i);
    expect(zer107).toMatch(/create policy "Members can read tasks"/i);
    expect(zer107).toMatch(/on public\.tasks/i);
    expect(zer107).toMatch(/for select/i);
    expect(zer107).toMatch(/is_non_tourist\(\)/);

    // Effective contract across history: latest policy name must win for SELECT.
    expect(sql).toMatch(/Members can read tasks/);
  });
});

describe("tasks categorias migration (ZER-208)", () => {
  function zer208(): string {
    const files = readdirSync(MIGRATIONS_DIR).filter(
      (f) => f.includes("zer208") && f.endsWith(".sql"),
    );
    expect(files.length, "expected one ZER-208 categorias migration").toBe(1);
    return readFileSync(path.join(MIGRATIONS_DIR, files[0]!), "utf8");
  }

  it("turns the single categoria into a non-empty categorias array, keeping each row's value", () => {
    const sql = zer208();
    expect(sql).toMatch(
      /alter column categoria type public\.task_categoria\[\] using array\[categoria\]/i,
    );
    expect(sql).toMatch(/rename column categoria to categorias/i);
    expect(sql).toMatch(/check \(cardinality\(categorias\) >= 1\)/i);
  });

  it("adds categoria_otra, only valid alongside 'otro' and capped like the form", () => {
    const sql = zer208();
    expect(sql).toMatch(/add column categoria_otra text/i);
    expect(sql).toMatch(/'otro' = any \(categorias\)/i);
    expect(sql).toMatch(/between 1 and 40/i);
    expect(sql).toMatch(
      /grant insert \(categoria_otra\), update \(categoria_otra\) on public\.tasks to authenticated/i,
    );
  });

  it("keeps the update guard treating both columns as content", () => {
    const sql = zer208();
    expect(sql).toMatch(/create or replace function public\.enforce_task_update_guard\(\)/i);
    expect(sql).toMatch(/new\.categorias is distinct from old\.categorias/i);
    expect(sql).toMatch(/new\.categoria_otra is distinct from old\.categoria_otra/i);
    expect(sql).not.toMatch(/new\.categoria is distinct/i);
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/set search_path = ''/i);
  });
});
