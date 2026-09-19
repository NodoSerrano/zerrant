import { describe, expect, it } from "vitest";
import {
  evaluateAuthenticatedTableAccess,
  evaluateDefaultPrivilegesForRole,
  formatGrantCheckFailure,
  type DefaultPrivilegeAcl,
  type TablePrivilegeSnapshot,
} from "./public-table-grants";

describe("evaluateAuthenticatedTableAccess", () => {
  it("passes when every public base table has at least one DML privilege for authenticated", () => {
    const tables: TablePrivilegeSnapshot[] = [
      {
        name: "tasks",
        kind: "r",
        select: true,
        insert: true,
        update: true,
        delete: false,
        columnPrivileges: [],
      },
      {
        name: "profiles",
        kind: "r",
        select: false,
        insert: true,
        update: true,
        delete: false,
        columnPrivileges: ["SELECT"],
      },
    ];

    expect(evaluateAuthenticatedTableAccess(tables)).toEqual({
      ok: true,
      missing: [],
    });
  });

  it("fails when a base table has neither table-level nor column-level privileges for authenticated", () => {
    const tables: TablePrivilegeSnapshot[] = [
      {
        name: "projects",
        kind: "r",
        select: false,
        insert: false,
        update: false,
        delete: false,
        columnPrivileges: [],
      },
    ];

    expect(evaluateAuthenticatedTableAccess(tables)).toEqual({
      ok: false,
      missing: ["projects"],
    });
  });

  it("ignores views and non-base relations for the missing-table list", () => {
    const tables: TablePrivilegeSnapshot[] = [
      {
        name: "profiles_with_rate",
        kind: "v",
        select: false,
        insert: false,
        update: false,
        delete: false,
        columnPrivileges: [],
      },
      {
        name: "tasks",
        kind: "r",
        select: true,
        insert: false,
        update: false,
        delete: false,
        columnPrivileges: [],
      },
    ];

    expect(evaluateAuthenticatedTableAccess(tables)).toEqual({
      ok: true,
      missing: [],
    });
  });
});

describe("evaluateDefaultPrivilegesForRole", () => {
  it("passes when the creator role defaults grant authenticated DML on public tables", () => {
    const acls: DefaultPrivilegeAcl[] = [
      {
        grantor: "postgres",
        schema: "public",
        objectType: "r",
        acl: [
          "postgres=arwdDxtm/postgres",
          "authenticated=arwdDxtm/postgres",
          "anon=arwdDxtm/postgres",
        ],
      },
    ];

    expect(evaluateDefaultPrivilegesForRole(acls, "postgres")).toEqual({
      ok: true,
      reason: null,
    });
  });

  it("fails when postgres has no default table ACL entry for public", () => {
    expect(evaluateDefaultPrivilegesForRole([], "postgres")).toEqual({
      ok: false,
      reason: "missing_default_acl",
    });
  });

  it("fails when the default ACL does not grant authenticated any table DML", () => {
    const acls: DefaultPrivilegeAcl[] = [
      {
        grantor: "postgres",
        schema: "public",
        objectType: "r",
        acl: ["service_role=arwdDxtm/postgres"],
      },
    ];

    expect(evaluateDefaultPrivilegesForRole(acls, "postgres")).toEqual({
      ok: false,
      reason: "authenticated_missing_dml",
    });
  });
});

describe("formatGrantCheckFailure", () => {
  it("explains missing tables and default-privilege gaps", () => {
    const message = formatGrantCheckFailure({
      missingTables: ["projects", "events"],
      defaultPrivilegeOk: false,
      defaultPrivilegeReason: "authenticated_missing_dml",
    });

    expect(message).toContain("projects");
    expect(message).toContain("events");
    expect(message).toContain("authenticated_missing_dml");
  });
});
