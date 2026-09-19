/**
 * Live harness for ZER-65. Invoked only via:
 *   pnpm db:check-rls
 * (vitest.db-rls.config.ts). Not part of the default `pnpm test` suite.
 *
 * Guards the membership-request INSERT policy against the recursion that made
 * `/solicitar` impossible to submit (42P17), and pins the two outcomes the app
 * depends on: a second pending request fails on the partial unique index
 * (23505 -> "Ya tenes una solicitud pendiente"), and a non-tourist is denied by
 * RLS (42501).
 *
 * Everything runs inside one transaction that ends in ROLLBACK, so the probe
 * leaves no rows behind.
 */
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const DOCKER_DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_backoffice";

const TOURIST_ID = "11111111-1111-1111-1111-111111111111";
const STANDARD_ID = "22222222-2222-2222-2222-222222222222";

const SUCCESS = "00000";
const UNIQUE_VIOLATION = "23505";
const RLS_DENIED = "42501";
const POLICY_RECURSION = "42P17";

function run(command: string, args: string[], input: string) {
  const result = spawnSync(command, args, { encoding: "utf8", env: process.env, input });
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

function psqlScript(sql: string): string {
  if (hasPsql()) {
    return run("psql", [DATABASE_URL, "-At", "-F", "\t"], sql);
  }

  if (hasDockerContainer(DOCKER_DB_CONTAINER)) {
    return run(
      "docker",
      [
        "exec",
        "-i",
        DOCKER_DB_CONTAINER,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-At",
        "-F",
        "\t",
      ],
      sql,
    );
  }

  throw new Error(`No psql on PATH and docker container '${DOCKER_DB_CONTAINER}' is not running.`);
}

/**
 * Each insert runs in its own plpgsql subtransaction so a rejection records its
 * SQLSTATE instead of poisoning the outer transaction. Results are buffered in
 * an array because `authenticated` has no privileges on the temp table.
 */
const PROBE_SQL = `
begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('${TOURIST_ID}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-tourist@test.local','x',now(),now()),
  ('${STANDARD_ID}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-standard@test.local','x',now(),now());

update public.profiles set tier = 'standard' where id = '${STANDARD_ID}';

create temp table rls_result(name text, sqlstate text) on commit drop;

do $$
declare
  v_state text;
  v_rows text[] := '{}';
begin
  perform set_config('role', 'authenticated', true);

  perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
  begin
    insert into public.membership_requests (profile_id, mensaje) values ('${TOURIST_ID}', 'first');
    v_state := '${SUCCESS}';
  exception when others then v_state := SQLSTATE;
  end;
  v_rows := v_rows || ('tourist_first_insert=' || v_state);

  begin
    insert into public.membership_requests (profile_id, mensaje) values ('${TOURIST_ID}', 'second');
    v_state := '${SUCCESS}';
  exception when others then v_state := SQLSTATE;
  end;
  v_rows := v_rows || ('tourist_second_insert=' || v_state);

  perform set_config('request.jwt.claims', '{"sub":"${STANDARD_ID}","role":"authenticated"}', true);
  begin
    insert into public.membership_requests (profile_id, mensaje) values ('${STANDARD_ID}', 'nope');
    v_state := '${SUCCESS}';
  exception when others then v_state := SQLSTATE;
  end;
  v_rows := v_rows || ('non_tourist_insert=' || v_state);

  perform set_config('role', 'postgres', true);

  insert into rls_result
  select split_part(r, '=', 1), split_part(r, '=', 2)
  from unnest(v_rows) as r;
end $$;

select name, sqlstate from rls_result order by name;

rollback;
`;

export function parseProbeOutput(stdout: string): Record<string, string> {
  const outcomes: Record<string, string> = {};
  for (const line of stdout.split("\n")) {
    const [name, sqlstate] = line.trim().split("\t");
    if (name && sqlstate) outcomes[name] = sqlstate;
  }
  return outcomes;
}

describe("membership_requests insert policy (live DB)", () => {
  const outcomes = parseProbeOutput(psqlScript(PROBE_SQL));

  it("lets a tourist create their own membership request", () => {
    expect(outcomes.tourist_first_insert).not.toBe(POLICY_RECURSION);
    expect(outcomes.tourist_first_insert).toBe(SUCCESS);
  });

  it("rejects a second pending request on the partial unique index", () => {
    expect(outcomes.tourist_second_insert).toBe(UNIQUE_VIOLATION);
  });

  it("denies a non-tourist by row-level security", () => {
    expect(outcomes.non_tourist_insert).toBe(RLS_DENIED);
  });
});
