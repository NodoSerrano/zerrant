/**
 * Live harness for ZER-87 aportes RLS.
 * Invoked only via:
 *   pnpm db:check-rls
 * (vitest.db-rls.config.ts). Not part of the default `pnpm test` suite.
 *
 * Requires migration 20260920190000_zer87_aportes.sql applied.
 * Everything runs inside one transaction that ends in ROLLBACK.
 */
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const DOCKER_DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_backoffice";

const TOURIST_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const SERRANO_A = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const SERRANO_B = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const ADMIN_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const SUCCESS = "00000";
const RLS_DENIED = "42501";

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

const PROBE_SQL = `
begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('${TOURIST_ID}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ap-tourist@test.local','x',now(),now()),
  ('${SERRANO_A}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ap-a@test.local','x',now(),now()),
  ('${SERRANO_B}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ap-b@test.local','x',now(),now()),
  ('${ADMIN_ID}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ap-admin@test.local','x',now(),now());

update public.profiles set tier = 'standard', is_platform_admin = false where id in ('${SERRANO_A}', '${SERRANO_B}');
update public.profiles set tier = 'tourist', is_platform_admin = false where id = '${TOURIST_ID}';
update public.profiles set tier = 'founder', is_platform_admin = true where id = '${ADMIN_ID}';

create temp table rls_result(name text, sqlstate text) on commit drop;

do $$
declare
  v_state text;
  v_aporte uuid;
  v_rows text[] := '{}';
  v_count int;
begin
  perform set_config('role', 'authenticated', true);

  -- tourist SELECT
  perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
  begin
    perform 1 from public.aportes limit 1;
    get diagnostics v_count = row_count;
    v_state := '${SUCCESS}';
  exception when others then v_state := SQLSTATE;
  end;
  -- SELECT with zero rows still succeeds under RLS if policy allows; tourist must see 0 and not error.
  -- Force deny by checking count of visible rows after seed below; first probe INSERT.
  begin
    insert into public.aportes (profile_id, tipo, fecha, registrado_por)
    values ('${TOURIST_ID}', 'yerba', current_date, '${TOURIST_ID}');
    v_state := '${SUCCESS}';
  exception when others then v_state := SQLSTATE;
  end;
  v_rows := v_rows || ('tourist_insert=' || v_state);

  -- serrano A insert self
  perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
  begin
    insert into public.aportes (profile_id, tipo, descripcion, monto, fecha, registrado_por)
    values ('${SERRANO_A}', 'economico', 'cuota', 100, current_date, '${SERRANO_A}')
    returning id into v_aporte;
    v_state := '${SUCCESS}';
  exception when others then
    v_state := SQLSTATE;
    v_aporte := null;
  end;
  v_rows := v_rows || ('serrano_a_insert_self=' || v_state);

  -- serrano A insert for B (not admin) → deny
  begin
    insert into public.aportes (profile_id, tipo, fecha, registrado_por)
    values ('${SERRANO_B}', 'charla', current_date, '${SERRANO_A}');
    v_state := '${SUCCESS}';
  exception when others then v_state := SQLSTATE;
  end;
  v_rows := v_rows || ('serrano_a_insert_for_b=' || v_state);

  -- admin insert for B
  perform set_config('request.jwt.claims', '{"sub":"${ADMIN_ID}","role":"authenticated"}', true);
  begin
    insert into public.aportes (profile_id, tipo, monto, fecha, registrado_por)
    values ('${SERRANO_B}', 'economico', 50, current_date, '${ADMIN_ID}');
    v_state := '${SUCCESS}';
  exception when others then v_state := SQLSTATE;
  end;
  v_rows := v_rows || ('admin_insert_for_b=' || v_state);

  if v_aporte is not null then
    -- tourist SELECT after seed: should see 0 rows (policy filters), not error
    perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
    begin
      select count(*)::int into v_count from public.aportes;
      if v_count = 0 then
        v_state := '${RLS_DENIED}'; -- treat "no visibility" as expected deny outcome
      else
        v_state := '${SUCCESS}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('tourist_select_visible=' || v_state);

    -- serrano B select → ok (sees rows)
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      select count(*)::int into v_count from public.aportes;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_select=' || v_state);

    -- serrano B update A's aporte → deny (0 rows)
    begin
      update public.aportes set descripcion = 'hijack' where id = v_aporte;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_update=' || v_state);

    -- registrante A update → ok
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      update public.aportes set descripcion = 'cuota-2' where id = v_aporte;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_a_update=' || v_state);

    -- admin delete → ok
    perform set_config('request.jwt.claims', '{"sub":"${ADMIN_ID}","role":"authenticated"}', true);
    begin
      delete from public.aportes where id = v_aporte;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('admin_delete=' || v_state);
  end if;

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

describe("aportes RLS (live DB)", () => {
  const outcomes = parseProbeOutput(psqlScript(PROBE_SQL));

  it("denies tourist insert", () => {
    expect(outcomes.tourist_insert).toBe(RLS_DENIED);
  });

  it("allows serrano insert self and denies insert for other", () => {
    expect(outcomes.serrano_a_insert_self).toBe(SUCCESS);
    expect(outcomes.serrano_a_insert_for_b).toBe(RLS_DENIED);
  });

  it("allows admin insert for another profile", () => {
    expect(outcomes.admin_insert_for_b).toBe(SUCCESS);
  });

  it("hides rows from tourist SELECT and allows serrano SELECT", () => {
    expect(outcomes.tourist_select_visible).toBe(RLS_DENIED);
    expect(outcomes.serrano_b_select).toBe(SUCCESS);
  });

  it("allows registrante update and denies other serrano", () => {
    expect(outcomes.serrano_a_update).toBe(SUCCESS);
    expect(outcomes.serrano_b_update).toBe(RLS_DENIED);
  });

  it("allows platform admin delete", () => {
    expect(outcomes.admin_delete).toBe(SUCCESS);
  });
});
