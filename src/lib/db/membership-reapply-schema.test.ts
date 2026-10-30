import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REAPPLY_COOLDOWN_DAYS } from "@/features/membership/reapply";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase/migrations");

function zer180(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter(
    (f) => f.includes("zer180_membership_reapply") && f.endsWith(".sql"),
  );
  expect(files.length, "expected one ZER-180 reapply migration").toBe(1);
  return readFileSync(path.join(MIGRATIONS_DIR, files[0]!), "utf8");
}

describe("ZER-180 membership reapply migration", () => {
  it("adds the closing date and the admin reopening, backfilling old cerradas", () => {
    const sql = zer180();
    expect(sql).toMatch(/add column cerrada_en timestamptz/i);
    expect(sql).toMatch(/add column reapertura_habilitada_en timestamptz/i);
    expect(sql).toMatch(/add column reapertura_habilitada_por uuid references public\.profiles/i);
    expect(sql).toMatch(/to_estado = 'cerrada'/);
    expect(sql).toMatch(/where r\.estado = 'cerrada'/);
  });

  it("stamps cerrada_en when a request moves to cerrada", () => {
    const sql = zer180();
    expect(sql).toMatch(/new\.estado = 'cerrada' and old\.estado is distinct from 'cerrada'/);
    expect(sql).toMatch(/new\.cerrada_en := now\(\)/);
    expect(sql).toMatch(/before update of estado on public\.membership_requests/i);
  });

  it(`enforces the ${REAPPLY_COOLDOWN_DAYS}-day rule in the DB, not only in the app`, () => {
    const sql = zer180();
    expect(sql).toMatch(/create trigger membership_requests_reapply_gate\s+before insert/i);
    expect(sql).toContain(`interval '${REAPPLY_COOLDOWN_DAYS} days'`);
    expect(sql).toMatch(/v_habilitada_en is null/);
    // An unknown closing date still blocks when it is the row the gate reads.
    expect(sql).toMatch(/v_cerrada_en is null or/);
    expect(sql).toMatch(/errcode = 'P0001'/);
    expect(sql).not.toMatch(/errcode = '42501'/);
    // Gate and enable RPC name the same row: latest dated close, nulls last.
    expect(
      sql.match(/order by cerrada_en desc nulls last, actualizado_en desc, id desc/gi),
    ).toHaveLength(2);
  });

  it("lets only platform admins enable a new request, through a definer RPC", () => {
    const sql = zer180();
    const fn = sql.slice(
      sql.indexOf("create or replace function public.enable_membership_reapplication"),
    );
    expect(fn).toMatch(/security definer/i);
    expect(fn).toMatch(/set search_path = ''/i);
    expect(fn).toMatch(/not public\.is_platform_admin\(\)/);
    expect(fn).toMatch(/and estado = 'cerrada'/);
    expect(sql).toMatch(
      /grant execute on function public\.enable_membership_reapplication\(uuid\) to authenticated/i,
    );
  });

  it("keeps the control columns out of what the applicant can write", () => {
    const sql = zer180();
    expect(sql).not.toMatch(/grant insert/i);
    expect(sql).toMatch(
      /revoke insert\s*\(\s*cerrada_en\s*,\s*reapertura_habilitada_en\s*,\s*reapertura_habilitada_por\s*\)/i,
    );
    expect(sql).toMatch(
      /update\s*\(\s*cerrada_en\s*,\s*reapertura_habilitada_en\s*,\s*reapertura_habilitada_por\s*\)\s+on public\.membership_requests\s+from public,\s*anon,\s*authenticated/i,
    );
  });
});
