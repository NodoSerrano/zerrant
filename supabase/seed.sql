-- LOCAL ONLY — loaded by supabase db reset via [db.seed] in config.toml.
-- Never apply this file against hosted/production projects.
--
-- Default login after reset:
--   email:    agusdiez@example.com
--   password: supersecure
--
-- Avatar bytes live in supabase/seed-assets/agus-diez.jpg.
-- After reset, run: pnpm db:seed-local-avatar
-- (uploads into the public avatars bucket and points profiles.avatar_url at it).
--
-- Keep v_user_id + avatar object path in sync with scripts/seed-local-avatar.mjs
-- (USER_ID / OBJECT_PATH).

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  -- SYNC: scripts/seed-local-avatar.mjs USER_ID
  v_user_id constant uuid := 'a1111111-1111-4111-8111-111111111111';
  v_email constant text := 'agusdiez@example.com';
  v_password constant text := 'supersecure';
  v_instance_id constant uuid := '00000000-0000-0000-0000-000000000000';
  -- Local API gateway default (supabase start). Avatar object is filled by db:seed-local-avatar.
  -- SYNC: scripts/seed-local-avatar.mjs OBJECT_PATH = <v_user_id>/agus-diez.jpg
  v_avatar_url constant text :=
    'http://127.0.0.1:54321/storage/v1/object/public/avatars/a1111111-1111-4111-8111-111111111111/agus-diez.jpg';
begin
  -- auth.users (loginable email+password)
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    is_super_admin,
    is_sso_user,
    is_anonymous
  )
  values (
    v_instance_id,
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombre', 'Agus', 'apellido', 'Diez'),
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    false,
    false
  )
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  -- Required for GoTrue email/password sign-in on current Auth.
  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider_id, provider) do update
  set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();

  -- handle_new_user already inserted a tourist profile; promote to local admin serrano.
  update public.profiles
  set
    email = v_email,
    nombre = 'Agus',
    apellido = 'Diez',
    apodo = 'Agus',
    nombre_visible = 'nombre_apellido',
    tier = 'standard',
    is_platform_admin = true,
    onboarding_completado_en = coalesce(onboarding_completado_en, now()),
    aprobado_en = coalesce(aprobado_en, now()),
    fecha_nacimiento = coalesce(fecha_nacimiento, date '1990-01-15'),
    avatar_url = v_avatar_url,
    disponibilidad = coalesce(disponibilidad, 'disponible')
  where id = v_user_id;

  if not found then
    raise exception 'local seed: profile missing for % after auth.users insert', v_user_id;
  end if;
end
$$;
