/**
 * Live harness for ZER-49 grant check. Invoked only via:
 *   pnpm db:check-grants
 * (vitest.db-grants.config.ts). Not part of the default `pnpm test` suite.
 */
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  evaluateAuthenticatedTableAccess,
  evaluateDefaultPrivilegesForRole,
  formatGrantCheckFailure,
  type DefaultPrivilegeAcl,
  type TablePrivilegeSnapshot,
} from "../src/lib/db/public-table-grants";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const CREATOR_ROLE = process.env.GRANT_CHECK_CREATOR_ROLE ?? "postgres";
const DOCKER_DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_backoffice";

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(`${command} failed (exit ${result.status}): ${err}`);
  }
  return result.stdout;
}

function hasPsql(): boolean {
  return spawnSync("psql", ["--version"], { encoding: "utf8" }).status === 0;
}

function hasDockerContainer(name: string): boolean {
  const result = spawnSync("docker", ["inspect", "-f", "{{.State.Running}}", name], {
    encoding: "utf8",
  });
  return result.status === 0 && result.stdout.trim() === "true";
}

function psql(sql: string): string {
  if (hasPsql()) {
    return run("psql", [DATABASE_URL, "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c", sql]);
  }

  if (hasDockerContainer(DOCKER_DB_CONTAINER)) {
    return run("docker", [
      "exec",
      "-i",
      DOCKER_DB_CONTAINER,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-F",
      "\t",
      "-c",
      sql,
    ]);
  }

  throw new Error(`No psql on PATH and docker container '${DOCKER_DB_CONTAINER}' is not running.`);
}

function loadTableSnapshots(): TablePrivilegeSnapshot[] {
  const sql = `
SELECT c.relname,
       c.relkind,
       has_table_privilege('authenticated', c.oid, 'SELECT'),
       has_table_privilege('authenticated', c.oid, 'INSERT'),
       has_table_privilege('authenticated', c.oid, 'UPDATE'),
       has_table_privilege('authenticated', c.oid, 'DELETE'),
       EXISTS (
         SELECT 1
         FROM information_schema.column_privileges cp
         WHERE cp.table_schema = 'public'
           AND cp.table_name = c.relname
           AND cp.grantee = 'authenticated'
       )
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p', 'v', 'm')
  AND c.relname NOT LIKE 'pg_%'
ORDER BY c.relname;
`;

  return psql(sql)
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, kind, sel, ins, upd, del, hasCol] = line.split("\t");
      return {
        name,
        kind,
        select: sel === "t",
        insert: ins === "t",
        update: upd === "t",
        delete: del === "t",
        columnPrivileges: hasCol === "t" ? ["COLUMN"] : [],
      } satisfies TablePrivilegeSnapshot;
    });
}

function loadDefaultAcls(): DefaultPrivilegeAcl[] {
  const sql = `
SELECT defaclrole::regrole::text,
       defaclnamespace::regnamespace::text,
       defaclobjtype::text,
       COALESCE(array_to_string(defaclacl::text[], ','), '')
FROM pg_default_acl
WHERE defaclnamespace = 'public'::regnamespace
  AND defaclobjtype = 'r';
`;

  return psql(sql)
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [grantor, schema, objectType, aclJoined] = line.split("\t");
      return {
        grantor,
        schema,
        objectType,
        acl: aclJoined ? aclJoined.split(",") : [],
      } satisfies DefaultPrivilegeAcl;
    });
}

describe("public table grants (live DB)", () => {
  it("every public base table has authenticated DML and postgres defaults grant authenticated DML", () => {
    const tables = loadTableSnapshots();
    const acls = loadDefaultAcls();

    const tableResult = evaluateAuthenticatedTableAccess(tables);
    const defaultResult = evaluateDefaultPrivilegesForRole(acls, CREATOR_ROLE);

    if (!tableResult.ok || !defaultResult.ok) {
      throw new Error(
        formatGrantCheckFailure({
          missingTables: tableResult.missing,
          defaultPrivilegeOk: defaultResult.ok,
          defaultPrivilegeReason: defaultResult.reason,
        }),
      );
    }

    expect(tableResult.ok).toBe(true);
    expect(defaultResult.ok).toBe(true);
  });
});
