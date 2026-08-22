-- Fix: infinite recursion (42P17) al leer public.profiles.
--
-- La policy "Admins can read all profiles" (20260807150000) hacia subquery
-- sobre profiles DENTRO de una policy de profiles. Con los grants DML ahora
-- presentes (20260821222554) la evaluacion RLS llega a ejecutarse y Postgres
-- detecta la recursion. Antes estaba enmascarada por el error 42501.
--
-- Patron estandar: helper security definer que consulta profiles como owner
-- (bypass RLS, no hay FORCE ROW LEVEL SECURITY), y policies que lo usan.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  )
$$;

revoke execute on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to anon, authenticated, service_role;

drop policy "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles
  for select
  using (public.is_platform_admin());
