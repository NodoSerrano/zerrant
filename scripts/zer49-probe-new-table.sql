-- ZER-49 verification helper: create a throwaway table and assert authenticated
-- inherited DML from default privileges (no explicit GRANT on the table).
-- Intended for local/CI after migrations, not for production data.

do $$
declare
  has_sel boolean;
  has_ins boolean;
  has_upd boolean;
  has_del boolean;
begin
  drop table if exists public._zer49_default_priv_probe cascade;
  create table public._zer49_default_priv_probe (id int primary key);

  select has_table_privilege('authenticated', 'public._zer49_default_priv_probe', 'SELECT'),
         has_table_privilege('authenticated', 'public._zer49_default_priv_probe', 'INSERT'),
         has_table_privilege('authenticated', 'public._zer49_default_priv_probe', 'UPDATE'),
         has_table_privilege('authenticated', 'public._zer49_default_priv_probe', 'DELETE')
    into has_sel, has_ins, has_upd, has_del;

  drop table if exists public._zer49_default_priv_probe cascade;

  if not (has_sel and has_ins and has_upd and has_del) then
    raise exception
      'ZER-49 probe failed: authenticated DML on new public table = sel:% ins:% upd:% del:% (expected all true without explicit GRANT)',
      has_sel, has_ins, has_upd, has_del;
  end if;

  raise notice 'ZER-49 probe ok: new public table inherits authenticated DML from default privileges';
end $$;
