-- ZER-49: pin default privileges to the migration creator role (`postgres`).
--
-- `ALTER DEFAULT PRIVILEGES` without `FOR ROLE` only affects objects created by
-- the *current* role. Migrations in Supabase run as `postgres`, so defaults must
-- be declared for that role explicitly. Without this, a fresh project with
-- `auto_expose_new_tables = false` births public tables with no grants for
-- `authenticated` and PostgREST fails with 42501 before RLS runs.
--
-- Intentionally does NOT re-run `GRANT … ON ALL TABLES`. That would restore
-- table-level SELECT on `profiles` and undo the column mask from ZER-43
-- (`tarifa_hora`). Existing tables keep the grants set by earlier migrations;
-- this migration only locks in defaults for *future* tables/sequences.
--
-- Schema USAGE is re-asserted (idempotent) so Data API roles can resolve names.

grant usage on schema public to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

alter default privileges for role postgres in schema public
  grant all on tables to service_role;

alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
