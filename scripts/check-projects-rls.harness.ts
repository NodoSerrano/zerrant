/**
 * Live harness for ZER-78 projects + project_members RLS.
 * Invoked only via:
 *   pnpm db:check-rls
 * (vitest.db-rls.config.ts). Not part of the default `pnpm test` suite.
 *
 * Requires migration *_zer78_projects_project_members.sql applied.
 * Everything runs inside one transaction that ends in ROLLBACK.
 *
 * Proves: serrano insert OK + creator auto-admin; tourist insert denied;
 * non-admin/platform-admin update denied; self-join cannot escalate to admin;
 * tourist self-join denied; admin membership update/delete without 42P17.
 */
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:***@127.0.0.1:54322/postgres";

const DOCKER_DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_backoffice";

const TOURIST_ID = "e1111111-1111-1111-1111-111111111111";
const SERRANO_A = "e2222222-2222-2222-2222-222222222222";
const SERRANO_B = "e3333333-3333-3333-3333-333333333333";
const PLATFORM_ADMIN_ID = "e4444444-4444-4444-4444-444444444444";

const SUCCESS = "00000";
const RLS_DENIED = "42501";
const POLICY_RECURSION = "42P17";
const INSUFFICIENT_PRIVILEGE = "42501";

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
  ('${TOURIST_ID}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pj-tourist@test.local','x',now(),now()),
  ('${SERRANO_A}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pj-a@test.local','x',now(),now()),
  ('${SERRANO_B}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pj-b@test.local','x',now(),now()),
  ('${PLATFORM_ADMIN_ID}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pj-padmin@test.local','x',now(),now());

update public.profiles set tier = 'standard', is_platform_admin = false where id in ('${SERRANO_A}', '${SERRANO_B}');
update public.profiles set tier = 'tourist', is_platform_admin = false where id = '${TOURIST_ID}';
update public.profiles set tier = 'founder', is_platform_admin = true where id = '${PLATFORM_ADMIN_ID}';

create temp table rls_result(name text, sqlstate text) on commit drop;

do $$
declare
  v_state text;
  v_project uuid;
  v_rows text[] := '{}';
  v_count int;
  v_rol text;
  v_estado text;
begin
  perform set_config('role', 'authenticated', true);

  -- tourist cannot create a project
  perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
  begin
    insert into public.projects (nombre, descripcion, creado_por)
    values ('Tourist project', 'nope', '${TOURIST_ID}');
    v_state := '${SUCCESS}';
  exception when others then v_state := SQLSTATE;
  end;
  v_rows := v_rows || ('tourist_insert_project=' || v_state);

  -- serrano A creates project (trigger seats A as admin)
  perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
  begin
    insert into public.projects (nombre, descripcion, estado, ingreso, creado_por)
    values ('Huerta comun', 'lote 3', 'idea', 'aprobacion', '${SERRANO_A}')
    returning id into v_project;
    v_state := '${SUCCESS}';
  exception when others then
    v_state := SQLSTATE;
    v_project := null;
  end;
  v_rows := v_rows || ('serrano_a_insert_project=' || v_state);

  if v_project is not null then
    -- creator bootstrap: membership exists as admin/aprobado without postgres seed
    begin
      select rol::text, estado::text into v_rol, v_estado
      from public.project_members
      where project_id = v_project and profile_id = '${SERRANO_A}';
      if v_rol = 'admin' and v_estado = 'aprobado' then
        v_state := '${SUCCESS}';
      else
        v_state := 'WRONG_BOOTSTRAP';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('creator_bootstrap_admin=' || v_state);

    -- non-member B cannot update project config
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      update public.projects set descripcion = 'hijack' where id = v_project;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_update_project=' || v_state);

    -- platform admin who is NOT project admin also cannot update project config
    perform set_config('request.jwt.claims', '{"sub":"${PLATFORM_ADMIN_ID}","role":"authenticated"}', true);
    begin
      update public.projects set descripcion = 'platform-hijack' where id = v_project;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('platform_admin_update_project=' || v_state);

    -- project admin A can update config (and must not 42P17)
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      update public.projects set descripcion = 'lote 3 bis', estado = 'en_curso' where id = v_project;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_a_update_project=' || v_state);

    -- B cannot self-insert as admin/aprobado (grant omits rol/estado; policy would also deny)
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      insert into public.project_members (project_id, profile_id, rol, estado)
      values (v_project, '${SERRANO_B}', 'admin', 'aprobado');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_self_admin_escalation=' || v_state);

    -- tourist cannot self-join
    perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
    begin
      insert into public.project_members (project_id, profile_id)
      values (v_project, '${TOURIST_ID}');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('tourist_self_join=' || v_state);

    -- B self-join scaffold (identity only → defaults miembro/pendiente)
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      insert into public.project_members (project_id, profile_id)
      values (v_project, '${SERRANO_B}');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_self_join=' || v_state);

    -- B (non-admin) cannot approve themselves via update
    begin
      update public.project_members
      set estado = 'aprobado'
      where project_id = v_project and profile_id = '${SERRANO_B}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_self_approve=' || v_state);

    -- project admin A can approve B (project_members path must not 42P17)
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      update public.project_members
      set estado = 'aprobado'
      where project_id = v_project and profile_id = '${SERRANO_B}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_a_approve_member=' || v_state);

    -- project admin A can delete B membership
    begin
      delete from public.project_members
      where project_id = v_project and profile_id = '${SERRANO_B}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_a_delete_member=' || v_state);

    -- authenticated SELECT projects ok
    perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
    begin
      select count(*)::int into v_count from public.projects where id = v_project;
      if v_count = 1 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('tourist_select_project=' || v_state);
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

describe("projects RLS (live DB)", () => {
  const outcomes = parseProbeOutput(psqlScript(PROBE_SQL));

  it("denies tourist project insert", () => {
    expect(outcomes.tourist_insert_project).not.toBe(POLICY_RECURSION);
    expect(outcomes.tourist_insert_project).toBe(RLS_DENIED);
  });

  it("allows serrano project insert and seats creator as admin without postgres bypass", () => {
    expect(outcomes.serrano_a_insert_project).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_a_insert_project).toBe(SUCCESS);
    expect(outcomes.creator_bootstrap_admin).toBe(SUCCESS);
  });

  it("denies non-admin and platform-admin-only config updates", () => {
    expect(outcomes.serrano_b_update_project).toBe(RLS_DENIED);
    expect(outcomes.platform_admin_update_project).toBe(RLS_DENIED);
  });

  it("allows project admin update without policy recursion", () => {
    expect(outcomes.serrano_a_update_project).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_a_update_project).toBe(SUCCESS);
  });

  it("blocks self-admin escalation and tourist self-join", () => {
    // grant omission → 42501; policy denial would also be 42501
    expect(outcomes.serrano_b_self_admin_escalation).toBe(INSUFFICIENT_PRIVILEGE);
    expect(outcomes.tourist_self_join).toBe(RLS_DENIED);
  });

  it("allows self-join scaffold, admin membership update/delete without 42P17", () => {
    expect(outcomes.serrano_b_self_join).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_b_self_join).toBe(SUCCESS);
    expect(outcomes.serrano_b_self_approve).toBe(RLS_DENIED);
    expect(outcomes.serrano_a_approve_member).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_a_approve_member).toBe(SUCCESS);
    expect(outcomes.serrano_a_delete_member).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_a_delete_member).toBe(SUCCESS);
  });

  it("lets any authenticated user read projects", () => {
    expect(outcomes.tourist_select_project).toBe(SUCCESS);
  });
});
