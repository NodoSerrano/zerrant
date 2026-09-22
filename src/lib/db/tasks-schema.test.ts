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
