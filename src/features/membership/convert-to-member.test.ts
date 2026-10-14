import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canTransition, MEMBERSHIP_REQUEST_ESTADOS } from "./request-state";

const MIGRATION = readFileSync(
  join(process.cwd(), "supabase/migrations/20261006140000_zer146_convert_to_member.sql"),
  "utf8",
);

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
});
