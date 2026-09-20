/**
 * Live harness for ZER-91 events + event_attendance RLS.
 * Invoked only via:
 *   pnpm db:check-rls
 * (vitest.db-rls.config.ts). Not part of the default `pnpm test` suite.
 *
 * Requires migration 20260920180000_zer91_events_event_attendance.sql applied.
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
  ('${TOURIST_ID}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ev-tourist@test.local','x',now(),now()),
  ('${SERRANO_A}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ev-a@test.local','x',now(),now()),
  ('${SERRANO_B}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ev-b@test.local','x',now(),now()),
  ('${ADMIN_ID}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ev-admin@test.local','x',now(),now());

update public.profiles set tier = 'standard', is_platform_admin = false where id in ('${SERRANO_A}', '${SERRANO_B}');
update public.profiles set tier = 'tourist', is_platform_admin = false where id = '${TOURIST_ID}';
update public.profiles set tier = 'founder', is_platform_admin = true where id = '${ADMIN_ID}';

create temp table rls_result(name text, sqlstate text) on commit drop;

do $$
declare
  v_state text;
  v_event uuid;
  v_rows text[] := '{}';
  v_count int;
begin
  perform set_config('role', 'authenticated', true);

  perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
  begin
    insert into public.events (titulo, inicio, creado_por)
    values ('t-event', now(), '${TOURIST_ID}');
    v_state := '${SUCCESS}';
  exception when others then v_state := SQLSTATE;
  end;
  v_rows := v_rows || ('tourist_create=' || v_state);

  perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
  begin
    insert into public.events (titulo, inicio, fin, creado_por)
    values ('a-event', now(), now() + interval '1 hour', '${SERRANO_A}')
    returning id into v_event;
    v_state := '${SUCCESS}';
  exception when others then
    v_state := SQLSTATE;
    v_event := null;
  end;
  v_rows := v_rows || ('serrano_a_create=' || v_state);

  if v_event is not null then
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      update public.events set titulo = 'hijack' where id = v_event;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_update=' || v_state);

    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      update public.events set titulo = 'a-event-2' where id = v_event;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_a_update=' || v_state);

    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      insert into public.event_attendance (event_id, profile_id, estado)
      values (v_event, '${SERRANO_B}', 'voy');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_rsvp=' || v_state);

    perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
    begin
      insert into public.event_attendance (event_id, profile_id, estado)
      values (v_event, '${TOURIST_ID}', 'voy');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('tourist_rsvp=' || v_state);

    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      insert into public.event_attendance (event_id, profile_id, estado)
      values (v_event, '${SERRANO_A}', 'quizas');
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_rsvp_as_a=' || v_state);


    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      update public.event_attendance
        set estado = 'quizas'
        where event_id = v_event and profile_id = '${SERRANO_B}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_rsvp_update=' || v_state);

    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      insert into public.event_attendance (event_id, profile_id, estado)
      values (v_event, '${SERRANO_B}', 'no')
      on conflict (event_id, profile_id) do update set estado = excluded.estado;
      v_state := '${SUCCESS}';
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_rsvp_upsert=' || v_state);

    select count(*) into v_count
      from public.event_attendance
      where event_id = v_event and profile_id = '${SERRANO_B}';
    v_rows := v_rows || ('serrano_b_rsvp_row_count=' || v_count::text);

    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      update public.event_attendance
        set estado = 'no'
        where event_id = v_event and profile_id = '${SERRANO_B}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_a_rsvp_update_b=' || v_state);

    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      delete from public.event_attendance
        where event_id = v_event and profile_id = '${SERRANO_B}';
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_a_rsvp_delete_b=' || v_state);

    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_B}","role":"authenticated"}', true);
    begin
      delete from public.events where id = v_event;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_b_delete=' || v_state);

    perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
    begin
      update public.events set titulo = 'tourist-hijack' where id = v_event;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('tourist_update=' || v_state);

    perform set_config('request.jwt.claims', '{"sub":"${TOURIST_ID}","role":"authenticated"}', true);
    begin
      delete from public.events where id = v_event;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('tourist_delete=' || v_state);

    -- Cascade proof: delete an event that still has attendance rows.
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      delete from public.events where id = v_event;
      get diagnostics v_count = row_count;
      if v_count > 0 then
        v_state := '${SUCCESS}';
      else
        v_state := '${RLS_DENIED}';
      end if;
    exception when others then v_state := SQLSTATE;
    end;
    v_rows := v_rows || ('serrano_a_delete=' || v_state);

    perform set_config('role', 'postgres', true);
    select count(*)::text into v_state from public.event_attendance where event_id = v_event;
    v_rows := v_rows || ('delete_cascade_attendance=' || case when v_state = '0' then '${SUCCESS}' else '${RLS_DENIED}' end);
    perform set_config('role', 'authenticated', true);

    -- Fresh event for platform-admin delete path.
    perform set_config('request.jwt.claims', '{"sub":"${SERRANO_A}","role":"authenticated"}', true);
    begin
      insert into public.events (titulo, inicio, fin, creado_por)
      values ('a-event-admin', now(), now() + interval '1 hour', '${SERRANO_A}')
      returning id into v_event;
      v_state := '${SUCCESS}';
    exception when others then
      v_state := SQLSTATE;
      v_event := null;
    end;
    v_rows := v_rows || ('serrano_a_create_for_admin=' || v_state);

    if v_event is not null then
      perform set_config('request.jwt.claims', '{"sub":"${ADMIN_ID}","role":"authenticated"}', true);
      begin
        update public.events set titulo = 'admin-edit' where id = v_event;
        get diagnostics v_count = row_count;
        if v_count > 0 then
          v_state := '${SUCCESS}';
        else
          v_state := '${RLS_DENIED}';
        end if;
      exception when others then v_state := SQLSTATE;
      end;
      v_rows := v_rows || ('admin_update=' || v_state);

      begin
        delete from public.events where id = v_event;
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

describe("events + event_attendance RLS (live DB)", () => {
  const outcomes = parseProbeOutput(psqlScript(PROBE_SQL));

  it("denies tourist event create", () => {
    expect(outcomes.tourist_create).toBe(RLS_DENIED);
  });

  it("allows serrano create with creado_por = self", () => {
    expect(outcomes.serrano_a_create).toBe(SUCCESS);
  });

  it("denies other serrano update", () => {
    expect(outcomes.serrano_b_update).toBe(RLS_DENIED);
  });

  it("allows creator update", () => {
    expect(outcomes.serrano_a_update).toBe(SUCCESS);
  });

  it("allows own RSVP and denies tourist / foreign profile_id", () => {
    expect(outcomes.serrano_b_rsvp).toBe(SUCCESS);
    expect(outcomes.tourist_rsvp).toBe(RLS_DENIED);
    expect(outcomes.serrano_b_rsvp_as_a).toBe(RLS_DENIED);
  });

  it("allows own-row RSVP update and keeps a single row after a second answer", () => {
    expect(outcomes.serrano_b_rsvp_update).toBe(SUCCESS);
    expect(outcomes.serrano_b_rsvp_upsert).toBe(SUCCESS);
    expect(outcomes.serrano_b_rsvp_row_count).toBe("1");
  });

  it("denies third-party RSVP update and delete", () => {
    expect(outcomes.serrano_a_rsvp_update_b).toBe(RLS_DENIED);
    expect(outcomes.serrano_a_rsvp_delete_b).toBe(RLS_DENIED);
  });

  it("denies other serrano delete", () => {
    expect(outcomes.serrano_b_delete).toBe(RLS_DENIED);
  });

  it("denies tourist update and delete", () => {
    expect(outcomes.tourist_update).toBe(RLS_DENIED);
    expect(outcomes.tourist_delete).toBe(RLS_DENIED);
  });

  it("allows creator delete and cascades attendance rows", () => {
    expect(outcomes.serrano_a_delete).toBe(SUCCESS);
    expect(outcomes.delete_cascade_attendance).toBe(SUCCESS);
  });

  it("allows platform admin update and delete", () => {
    expect(outcomes.admin_update).toBe(SUCCESS);
    expect(outcomes.admin_delete).toBe(SUCCESS);
  });
});
