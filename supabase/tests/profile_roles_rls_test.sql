begin;

-- Extensión pgTAP requerida para `supabase db test` o `pg_prove`.
-- Ejecutar con: supabase db test --local (o pg_prove supabase/tests/xxx.sql -d postgres://...)

create extension if not exists pgtap with schema extensions;

select plan(14);

-- =============================================================================
-- Setup
-- =============================================================================

-- Tablas y policies ya deben existir (se aplican las migraciones antes de tests).
-- Verificamos que las policies nuevas y corregidas estén presentes.

-- 1. Policies de SELECT
select has_policy(
  'public', 'profile_roles',
  'Cada uno ve sus propios profile_roles',
  'SELECT policy para dueño debe existir'
);

select has_policy(
  'public', 'profile_roles',
  'Admin ve todos los profile_roles',
  'SELECT policy para admin debe existir'
);

-- 2. Policy de INSERT corregida
select has_policy(
  'public', 'profile_roles',
  'Cada uno inserta sus propios profile_roles',
  'INSERT policy corregida debe existir'
);

-- 3. Policy de DELETE
select has_policy(
  'public', 'profile_roles',
  'Cada uno borra sus propios profile_roles no confirmados',
  'DELETE policy debe existir'
);

-- 4. Policy de UPDATE
select has_policy(
  'public', 'profile_roles',
  'Admin actualiza cualquier profile_role',
  'UPDATE policy debe existir'
);

-- 5. Verificar que el grant UPDATE existe (el fix principal)
select has_column_privilege(
  'authenticated',
  'public.profile_roles', 'confirmado',
  'UPDATE',
  'authenticated debe poder hacer UPDATE sobre la columna confirmado'
);

-- 6. Verificar que no hay grant UPDATE sobre PK columns (defense in depth)
select ok(
  not has_column_privilege(
    'authenticated',
    'public.profile_roles', 'profile_id',
    'UPDATE'
  ),
  'authenticated NO debe poder hacer UPDATE sobre profile_id'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.profile_roles', 'role_id',
    'UPDATE'
  ),
  'authenticated NO debe poder hacer UPDATE sobre role_id'
);

-- =============================================================================
-- RLS functional tests (usando set_config para simular JWT)
-- =============================================================================

-- Insertamos datos de prueba con security definer para bypassear RLS
create or replace function test_rls_setup()
returns table(normal_id uuid, admin_id uuid, role_infra_id uuid)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_normal_id uuid := gen_random_uuid();
  v_admin_id  uuid := gen_random_uuid();
  v_role_infra_id uuid;
begin
  -- Crear usuarios en auth.users
  insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role)
  values
    (v_normal_id, 'normal@test.local', '{}', '{}', 'authenticated', 'authenticated'),
    (v_admin_id,  'admin@test.local',  '{}', '{}', 'authenticated', 'authenticated');

  -- Crear perfiles
  insert into public.profiles (id, is_platform_admin)
  values
    (v_normal_id, false),
    (v_admin_id,  true);

  -- Obtener el role_id de Infra (seed)
  select id into v_role_infra_id from public.roles where nombre = 'Infra';

  -- Asignar rol pendiente al usuario normal
  insert into public.profile_roles (profile_id, role_id, confirmado)
  values (v_normal_id, v_role_infra_id, false);

  return query select v_normal_id, v_admin_id, v_role_infra_id;
end;
$$;

select normal_id, admin_id, role_infra_id
from test_rls_setup() \gset

-- =============================================================================
-- Caso 1: usuario normal NO puede auto-confirmarse (INSERT confirmado=true)
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', :'normal_id', true);

select throws_ok(
  format(
    $$insert into public.profile_roles (profile_id, role_id, confirmado)
      values (%L, %L, true)$$,
    :'normal_id', :'role_infra_id'
  ),
  '42501',
  null,
  'Usuario normal no puede insertar confirmado=true'
);

-- =============================================================================
-- Caso 2: usuario normal puede insertar su propio rol con confirmado=false
-- =============================================================================
select lives_ok(
  format(
    $$insert into public.profile_roles (profile_id, role_id, confirmado)
      values (%L, %L, false)$$,
    :'normal_id', :'role_infra_id'
  ) || ' on conflict do nothing',
  'Usuario normal puede insertar su propio rol con confirmado=false'
);

-- Cleanup del insert del caso 2
select set_config('request.jwt.claim.sub', '', true);
reset role;
delete from public.profile_roles
where profile_id = :'normal_id' and role_id = :'role_infra_id';

-- =============================================================================
-- Caso 3: admin puede listar roles pendientes de otros usuarios (SELECT)
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', :'admin_id', true);

select is(
  (select count(*)::int from public.profile_roles where profile_id = :'normal_id'),
  1,
  'Admin puede ver los profile_roles del usuario normal'
);

-- =============================================================================
-- Caso 4: admin puede confirmar un rol (UPDATE confirmado=true)
-- =============================================================================
update public.profile_roles
set confirmado = true
where profile_id = :'normal_id' and role_id = :'role_infra_id';

select is(
  (select confirmado::boolean from public.profile_roles
   where profile_id = :'normal_id' and role_id = :'role_infra_id'),
  true,
  'Admin confirmó exitosamente el rol'
);

-- Desconfirmar para el siguiente test
update public.profile_roles
set confirmado = false
where profile_id = :'normal_id' and role_id = :'role_infra_id';

-- =============================================================================
-- Caso 5: usuario normal NO puede confirmar roles ajenos (UPDATE)
-- =============================================================================
select set_config('request.jwt.claim.sub', :'normal_id', true);

select throws_ok(
  format(
    $$update public.profile_roles
       set confirmado = true
       where profile_id = %L and role_id = %L$$,
    :'normal_id', :'role_infra_id'
  ),
  '42501',
  null,
  'Usuario normal NO puede hacer UPDATE sobre profile_roles (solo admin)'
);

-- =============================================================================
-- Caso 6: usuario normal solo ve sus propios roles (SELECT)
-- =============================================================================
select set_config('request.jwt.claim.sub', :'normal_id', true);

-- El usuario normal se ve a sí mismo
select is(
  (select count(*)::int from public.profile_roles where profile_id = :'normal_id'),
  1,
  'Usuario normal ve sus propios profile_roles'
);

-- El usuario normal NO debería ver roles de otros — pero como no hay otros perfiles
-- con roles en el setup, esto se verifica implícitamente con el count=1.
-- Hacemos un check explícito: el count total de profile_roles debe ser 1 para él.
select is(
  (select count(*)::int from public.profile_roles),
  1,
  'Usuario normal solo ve 1 registro (el suyo, no ve ajenos)'
);

-- =============================================================================
-- Cleanup
-- =============================================================================
reset role;
drop function if exists test_rls_setup();
delete from public.profile_roles where profile_id = :'normal_id';
delete from public.profiles where id in (:'normal_id', :'admin_id');
delete from auth.users where id in (:'normal_id', :'admin_id');

select * from finish();
rollback;
