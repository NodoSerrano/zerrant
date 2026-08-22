-- Las tablas creadas por migraciones no reciben GRANTs automaticos en Supabase
-- (nuevo default: auto_expose_new_tables = false). Sin DML grants, la Data API
-- falla con "permission denied for table X" antes de evaluar las policies RLS.
-- Referencia: docs/roadmap/Seguridad RLS.md

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
