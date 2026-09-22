/**
 * Live harness for ZER-78 projects + project_members RLS, ZER-82 ingreso door,
 * ZER-84 admin promotion, and ZER-107 members-only SELECT.
 * Invoked only via:
 *   pnpm db:check-rls
 * (vitest.db-rls.config.ts). Not part of the default `pnpm test` suite.
 *
 * Requires migrations *_zer78_projects_project_members.sql,
 * *_zer82_project_members_ingreso_door.sql, and
 * *_zer84_project_admin_promotion.sql, and *_zer117_project_members_created_at.sql applied.
 * Everything runs inside one transaction that ends in ROLLBACK.
 *
 * Proves: serrano insert OK + creator auto-admin; tourist insert denied;
 * non-admin/platform-admin update denied; self-join cannot escalate to admin;
 * tourist self-join denied; admin membership update/delete without 42P17;
 * platform-admin-only and non-member membership writes denied (ZER-83 queue).
 * ZER-82 door: abierto→aprobado; aprobacion→pendiente; aprobacion+aprobado rejected;
 * third-party profile_id rejected; self rol=admin rejected; second join PK; no 42P17.
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
const UNIQUE_VIOLATION = "23505";
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
  v_open_project uuid;
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

  -- serrano A creates aprobacion project (trigger seats A as admin)
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

    -- B cannot self-insert as admin (grant omits rol; policy would also deny)
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      insert into public.project_members (project_id, profile_id, rol, estado)
      values (v_project, '${SERRANO_B}', 'admin', 'pendiente');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_self_admin_escalation=' || v_state);

    -- Bypass: aprobacion + self-inserted aprobado must be rejected by WITH CHECK (not only action)
    begin
      insert into public.project_members (project_id, profile_id, estado)
      values (v_project, '${SERRANO_B}', 'aprobado');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('bypass_aprobacion_aprobado=' || v_state);

    -- Third-party profile_id rejected
    begin
      insert into public.project_members (project_id, profile_id, estado)
      values (v_project, '${SERRANO_A}', 'pendiente');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('third_party_profile_id=' || v_state);

    -- tourist cannot self-join
    perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
    begin
      insert into public.project_members (project_id, profile_id, estado)
      values (v_project, '${TOURIST_ID}', 'pendiente');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('tourist_self_join=' || v_state);

    -- B self-join on aprobacion → pendiente allowed
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      insert into public.project_members (project_id, profile_id, estado)
      values (v_project, '${SERRANO_B}', 'pendiente')
      returning estado::text into v_estado;
      if v_estado = 'pendiente' then
        v_state := '${SUCCESS}';
      else
        v_state := 'WRONG_ESTADO';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_self_join_aprobacion=' || v_state);
    -- Keep legacy key used by older assertions / admin path below
    v_rows := v_rows || ('serrano_b_self_join=' || v_state);

    -- ZER-117: admin can SELECT pendiente rows including created_at (queue order column)
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      select count(*)::int into v_count
      from public.project_members
      where project_id = v_project
        and estado = 'pendiente'
        and created_at is not null;
      if v_count >= 1 then
        v_state := '${SUCCESS}';
      else
        v_state := 'EMPTY_QUEUE';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('admin_select_pendiente_with_created_at=' || v_state);

    -- Restore B identity for subsequent join/self-approve probes
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);

    -- Second join collides on composite PK
    begin
      insert into public.project_members (project_id, profile_id, estado)
      values (v_project, '${SERRANO_B}', 'pendiente');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_second_join_pk=' || v_state);

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

    -- platform admin who is NOT project admin cannot approve B
    perform set_config('request.jwt.claims', '{"sub":"${PLATFORM_ADMIN_ID}","role":"authenticated"}', true);
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
    v_rows := v_rows || ('platform_admin_approve_member=' || v_state);

    -- platform admin who is NOT project admin cannot delete B's pendiente row
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
    v_rows := v_rows || ('platform_admin_delete_member=' || v_state);

    -- plain miembro (B) cannot delete another pending row either (self already covered);
    -- non-member tourist cannot approve B
    perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
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
    v_rows := v_rows || ('non_member_approve_member=' || v_state);

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

    -- ZER-84: plain miembro B cannot promote anyone (incl. self)
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      update public.project_members
      set rol = 'admin'
      where project_id = v_project and profile_id = '${SERRANO_B}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('miembro_promote_denied=' || v_state);

    -- ZER-84: platform admin who is not project admin cannot promote
    perform set_config('request.jwt.claims', '{"sub":"${PLATFORM_ADMIN_ID}","role":"authenticated"}', true);
    begin
      update public.project_members
      set rol = 'admin'
      where project_id = v_project and profile_id = '${SERRANO_B}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('platform_admin_promote_denied=' || v_state);

    -- ZER-84: non-member (tourist, no membership row) cannot promote
    perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
    begin
      update public.project_members
      set rol = 'admin'
      where project_id = v_project and profile_id = '${SERRANO_B}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('non_member_promote_denied=' || v_state);

    -- ZER-84: project admin A promotes approved miembro B → OK
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      update public.project_members
      set rol = 'admin'
      where project_id = v_project
        and profile_id = '${SERRANO_B}'
        and estado = 'aprobado'
        and rol = 'miembro';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        select rol::text into v_rol
        from public.project_members
        where project_id = v_project and profile_id = '${SERRANO_B}';
        if v_rol = 'admin' then
          v_state := '${SUCCESS}';
        else
          v_state := 'WRONG_ROL';
        end if;
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('admin_promote_miembro_ok=' || v_state);

    -- Reset B to pendiente to probe promote-on-pendiente target (ZER-84 AC6)
    begin
      delete from public.project_members
      where project_id = v_project and profile_id = '${SERRANO_B}';
      perform set_config('role', 'postgres', true);
      insert into public.project_members (project_id, profile_id, rol, estado)
      values (v_project, '${SERRANO_B}', 'miembro', 'pendiente');
      perform set_config('role', 'authenticated', true);
      perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
      begin
        update public.project_members
        set rol = 'admin'
        where project_id = v_project and profile_id = '${SERRANO_B}' and estado = 'pendiente';
        get diagnostics v_count = row_count;
        if v_count > 0 then
          v_state := '${SUCCESS}';
        else
          v_state := '${RLS_DENIED}';
        end if;
      exception when others then v_state := SQLSTATE;
      end;
    exception when others then
      v_state := SQLSTATE;
      perform set_config('role', 'authenticated', true);
    end;
    v_rows := v_rows || ('admin_promote_pendiente_target=' || v_state);

    -- pendiente actor cannot promote (B still pendiente after failed promote probe)
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      update public.project_members
      set rol = 'admin'
      where project_id = v_project and profile_id = '${SERRANO_A}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('pendiente_actor_promote_denied=' || v_state);

    -- project admin A can delete B membership
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
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

    -- Open door: A creates abierto project; B self-joins as aprobado
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      insert into public.projects (nombre, descripcion, estado, ingreso, creado_por)
      values ('Huerta abierta', 'open door', 'idea', 'abierto', '${SERRANO_A}')
      returning id into v_open_project;
      v_state := '${SUCCESS}';
    exception when others then
      v_state := SQLSTATE;
      v_open_project := null;
    end;
    v_rows := v_rows || ('serrano_a_insert_open_project=' || v_state);

    if v_open_project is not null then
      perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
      begin
        insert into public.project_members (project_id, profile_id, estado)
        values (v_open_project, '${SERRANO_B}', 'aprobado')
        returning estado::text into v_estado;
        if v_estado = 'aprobado' then
          v_state := '${SUCCESS}';
        else
          v_state := 'WRONG_ESTADO';
        end if;
      exception when others then v_state := SQLSTATE;
      end;
      v_rows := v_rows || ('serrano_b_self_join_abierto=' || v_state);
    end if;

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

  it("enforces the ingreso door on direct inserts without 42P17", () => {
    expect(outcomes.bypass_aprobacion_aprobado).not.toBe(POLICY_RECURSION);
    expect(outcomes.bypass_aprobacion_aprobado).toBe(RLS_DENIED);
    expect(outcomes.third_party_profile_id).toBe(RLS_DENIED);
    expect(outcomes.serrano_b_self_join_aprobacion).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_b_self_join_aprobacion).toBe(SUCCESS);
    expect(outcomes.admin_select_pendiente_with_created_at).toBe(SUCCESS);
    expect(outcomes.serrano_b_second_join_pk).toBe(UNIQUE_VIOLATION);
    expect(outcomes.serrano_a_insert_open_project).toBe(SUCCESS);
    expect(outcomes.serrano_b_self_join_abierto).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_b_self_join_abierto).toBe(SUCCESS);
  });

  it("allows self-join scaffold, admin membership update/delete without 42P17", () => {
    expect(outcomes.serrano_b_self_join).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_b_self_join).toBe(SUCCESS);
    expect(outcomes.serrano_b_self_approve).toBe(RLS_DENIED);
    expect(outcomes.platform_admin_approve_member).toBe(RLS_DENIED);
    expect(outcomes.platform_admin_delete_member).toBe(RLS_DENIED);
    expect(outcomes.non_member_approve_member).toBe(RLS_DENIED);
    expect(outcomes.serrano_a_approve_member).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_a_approve_member).toBe(SUCCESS);
    expect(outcomes.serrano_a_delete_member).not.toBe(POLICY_RECURSION);
    expect(outcomes.serrano_a_delete_member).toBe(SUCCESS);
  });

  it("ZER-84: project admin promotes aprobado miembro; unauthorized actors and pendiente target denied", () => {
    expect(outcomes.admin_promote_miembro_ok).not.toBe(POLICY_RECURSION);
    expect(outcomes.admin_promote_miembro_ok).toBe(SUCCESS);
    expect(outcomes.miembro_promote_denied).toBe(RLS_DENIED);
    expect(outcomes.platform_admin_promote_denied).toBe(RLS_DENIED);
    expect(outcomes.non_member_promote_denied).toBe(RLS_DENIED);
    expect(outcomes.pendiente_actor_promote_denied).toBe(RLS_DENIED);
    expect(outcomes.admin_promote_pendiente_target).not.toBe(POLICY_RECURSION);
    expect(outcomes.admin_promote_pendiente_target).toBe(RLS_DENIED);
  });

  it("denies tourist project SELECT (members-only, ZER-107)", () => {
    expect(outcomes.tourist_select_project).not.toBe(POLICY_RECURSION);
    // zero visible rows mapped to RLS_DENIED in the probe, or direct 42501
    expect(outcomes.tourist_select_project).toBe(RLS_DENIED);
  });
});
