export type RelationKind = "r" | "p" | "v" | "m" | string;

export type TablePrivilegeSnapshot = {
  name: string;
  kind: RelationKind;
  select: boolean;
  insert: boolean;
  update: boolean;
  delete: boolean;
  /** Column-level privileges present for authenticated (e.g. SELECT on some columns). */
  columnPrivileges: string[];
};

export type DefaultPrivilegeAcl = {
  grantor: string;
  schema: string;
  /** Postgres defaclobjtype: r = relation/table */
  objectType: string;
  acl: string[];
};

export type TableAccessResult = {
  ok: boolean;
  missing: string[];
};

export type DefaultPrivilegeResult = {
  ok: boolean;
  reason: "missing_default_acl" | "authenticated_missing_dml" | null;
};

const BASE_TABLE_KINDS = new Set(["r", "p"]);

/** ACL privilege letters that count as table DML for authenticated. */
const DML_PRIV_LETTERS = new Set(["a", "r", "w", "d"]);

function hasAnyTableDml(table: TablePrivilegeSnapshot): boolean {
  return (
    table.select ||
    table.insert ||
    table.update ||
    table.delete ||
    table.columnPrivileges.length > 0
  );
}

/**
 * Every public base table must be reachable by `authenticated` with at least
 * one DML privilege (table-level or column-level). Views are out of scope.
 *
 * Column-only SELECT (profiles after ZER-43) still counts: the table is
 * intentionally partially granted, not forgotten.
 */
export function evaluateAuthenticatedTableAccess(
  tables: TablePrivilegeSnapshot[],
): TableAccessResult {
  const missing = tables
    .filter((t) => BASE_TABLE_KINDS.has(t.kind))
    .filter((t) => !hasAnyTableDml(t))
    .map((t) => t.name)
    .sort();

  return { ok: missing.length === 0, missing };
}

function aclEntryGrantsAuthenticatedDml(entry: string): boolean {
  // Format: grantee=privs/grantor  e.g. authenticated=arwdDxtm/postgres
  const eq = entry.indexOf("=");
  if (eq < 0) return false;
  const grantee = entry.slice(0, eq);
  if (grantee !== "authenticated") return false;
  const rest = entry.slice(eq + 1);
  const slash = rest.indexOf("/");
  const privs = slash >= 0 ? rest.slice(0, slash) : rest;
  for (const ch of privs) {
    if (DML_PRIV_LETTERS.has(ch)) return true;
  }
  return false;
}

/**
 * Default privileges must exist for the migration creator role so new tables
 * inherit authenticated DML without an explicit GRANT.
 */
export function evaluateDefaultPrivilegesForRole(
  acls: DefaultPrivilegeAcl[],
  creatorRole: string,
): DefaultPrivilegeResult {
  const match = acls.find(
    (a) => a.grantor === creatorRole && a.schema === "public" && a.objectType === "r",
  );

  if (!match) {
    return { ok: false, reason: "missing_default_acl" };
  }

  const grantsAuthenticated = match.acl.some(aclEntryGrantsAuthenticatedDml);
  if (!grantsAuthenticated) {
    return { ok: false, reason: "authenticated_missing_dml" };
  }

  return { ok: true, reason: null };
}

export function formatGrantCheckFailure(input: {
  missingTables: string[];
  defaultPrivilegeOk: boolean;
  defaultPrivilegeReason: string | null;
}): string {
  const parts: string[] = [];

  if (input.missingTables.length > 0) {
    parts.push(`public base tables missing authenticated DML: ${input.missingTables.join(", ")}`);
  }

  if (!input.defaultPrivilegeOk) {
    parts.push(
      `default privileges for migration role incomplete (${input.defaultPrivilegeReason ?? "unknown"})`,
    );
  }

  return parts.join("; ") || "grant check failed";
}
