import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canTransition, MEMBERSHIP_REQUEST_ESTADOS } from "./request-state";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase/migrations");
const CANONICAL_TIER_WRITE = "20261002210000_zer143_membership_request_states.sql";

const MIGRATION = readFileSync(
  join(MIGRATIONS, "20261006140000_zer146_convert_to_member.sql"),
  "utf8",
);

function walkTs(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTs(full, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry.name)) continue;
    if (entry.name === "database.types.ts") continue;
    out.push(full);
  }
  return out;
}

describe("convert to member gate", () => {
  it("only allows aprobado from entrevista_realizada, and only for an admin", () => {
    for (const estado of MEMBERSHIP_REQUEST_ESTADOS) {
      expect(canTransition(estado, "aprobado", "admin")).toBe(estado === "entrevista_realizada");
      expect(canTransition(estado, "aprobado", "owner")).toBe(false);
    }
  });

  it("blocks self-approval on the existing transition write, without a second tier update", () => {
    expect(MIGRATION).toMatch(/before update of estado on public\.membership_requests/);
    expect(MIGRATION).toMatch(/new\.estado = 'aprobado'/);
    expect(MIGRATION).toMatch(/new\.profile_id = auth\.uid\(\)/);
    expect(MIGRATION).toMatch(/hint = 'self_approve'/);
    expect(MIGRATION).not.toMatch(/update public\.profiles/);
    expect(MIGRATION).not.toMatch(/approve_membership_request/);
  });

  it("catches a later helper that writes profiles.tier outside the ZER-143 RPC", () => {
    const tierWrite = /update\s+public\.profiles[\s\S]{0,400}?set[\s\S]{0,200}?\btier\b/i;
    const laterMigrations = readdirSync(MIGRATIONS).filter(
      (name) => name.endsWith(".sql") && name > CANONICAL_TIER_WRITE,
    );
    expect(laterMigrations.length).toBeGreaterThan(0);
    for (const name of laterMigrations) {
      const sql = readFileSync(join(MIGRATIONS, name), "utf8");
      expect(sql, name).not.toMatch(tierWrite);
    }

    const appTierWrite =
      /from\(\s*["']profiles["']\s*\)[\s\S]{0,800}?\.update\(\s*\{[\s\S]{0,400}?\btier\s*:/;
    const offenders: string[] = [];
    for (const file of walkTs(join(ROOT, "src"))) {
      const src = readFileSync(file, "utf8");
      if (appTierWrite.test(src) || src.includes('rpc("approve_membership_request"')) {
        offenders.push(file.slice(ROOT.length + 1));
      }
    }
    expect(offenders).toEqual([]);

    const admin = readFileSync(join(ROOT, "src/features/admin/actions.ts"), "utf8");
    expect(admin).toContain('rpc("transition_membership_request"');
    expect(admin).not.toMatch(/from\(\s*["']profiles["']\s*\)[\s\S]{0,200}\.update\(/);
  });

  it("keys the banner off aprobado_en and one injected clock on both pages", () => {
    const helper = readFileSync(join(ROOT, "src/features/membership/member-confirmed.ts"), "utf8");
    const inicio = readFileSync(join(ROOT, "src/app/(app)/(inicio)/page.tsx"), "utf8");
    const perfil = readFileSync(join(ROOT, "src/app/(app)/profile/page.tsx"), "utf8");

    expect(helper).not.toMatch(/new Date\(\)/);
    expect(helper).toContain("gte(MEMBER_CONFIRMED_COLUMN, memberConfirmedSince(now))");
    expect(helper).not.toMatch(/["']actualizado_en["']/);
    expect(inicio).toContain("recentMemberConfirmation(supabase, userId, now)");
    expect(perfil).toContain("recentMemberConfirmation(supabase, user.id, now)");
    expect(inicio).not.toContain("actualizado_en");
    expect(perfil).not.toContain("memberConfirmedSince()");
    expect(perfil).toContain("const now = new Date()");
  });
});
