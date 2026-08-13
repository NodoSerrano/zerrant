-- ZER-30: profile_roles grants + insert guard for confirmado.
--
-- Main already has:
--   - Admin SELECT policy on profile_roles
--   - Admin UPDATE policy ("Only admins can confirm roles")
--   - SELECT grant on profile_roles / roles (20260807150000)
--
-- Still missing for the admin confirmation panel to work:
--   1. GRANT UPDATE (confirmado) — without it PostgREST returns 42501
--      before RLS is evaluated.
--   2. GRANT INSERT for role self-assignment (profile_id, role_id only —
--      confirmado stays at the column default `false`).
--   3. INSERT WITH CHECK forces confirmado = false so a user cannot
--      self-confirm via PostgREST even if they somehow write the column.
--   4. DELETE grant so users can drop their own unconfirmed proposals
--      (policy already exists).

-- Column-level write surface
grant insert (profile_id, role_id) on public.profile_roles to authenticated;
grant update (confirmado) on public.profile_roles to authenticated;
grant delete on public.profile_roles to authenticated;

-- Tighten insert: proposals must land unconfirmed.
drop policy if exists "Users can insert own role proposals" on public.profile_roles;

create policy "Users can insert own role proposals"
  on public.profile_roles
  for insert
  with check (
    auth.uid() = profile_id
    and confirmado = false
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier <> 'tourist'
    )
  );
