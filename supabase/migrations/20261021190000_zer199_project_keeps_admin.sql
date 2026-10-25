-- ZER-199: admins can turn another admin (or themselves) back into a member,
-- but a project can never be left without an approved admin.
--
-- The rule lives here, not only in the server action: the update policy lets
-- any project admin change rol directly through the API.
--
-- Covers both ways of losing an admin: rol admin → miembro (UPDATE) and the
-- admin row going away (DELETE, e.g. leaving the project). Deleting the whole
-- project still works: its cascade runs after the project row is gone.

create or replace function public.ensure_project_keeps_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.rol <> 'admin' or old.estado <> 'aprobado' then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' and new.rol = 'admin' and new.estado = 'aprobado' then
    return new;
  end if;

  -- Lock the project row so two admins demoting each other at the same time
  -- can't both pass the check. No row: the project is being deleted (cascade).
  perform 1 from public.projects where id = old.project_id for update;
  if not found then
    return coalesce(new, old);
  end if;

  if not exists (
    select 1
    from public.project_members
    where project_id = old.project_id
      and profile_id <> old.profile_id
      and rol = 'admin'
      and estado = 'aprobado'
  ) then
    raise exception 'last_project_admin' using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

revoke execute on function public.ensure_project_keeps_admin() from public, anon, authenticated;

create trigger project_members_keep_admin
  before update of rol, estado or delete on public.project_members
  for each row
  execute function public.ensure_project_keeps_admin();
