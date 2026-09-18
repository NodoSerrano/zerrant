-- ZER-34 review: atomic replace of the caller's profile_skills in one transaction.
-- Replaces the app-level delete + upsert pair so a failed second step cannot leave
-- the user with a partial skill set.
--
-- security definer + auth.uid() gate: only the authenticated serrano can sync
-- their own skills. Tourists are rejected. EXECUTE is revoked from PUBLIC/anon.

create or replace function public.sync_profile_skills(p_skill_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.tier;
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'No autorizado');
  end if;

  select tier into v_tier
  from public.profiles
  where id = auth.uid();

  if not found or v_tier = 'tourist' then
    return jsonb_build_object('error', 'No autorizado');
  end if;

  delete from public.profile_skills
  where profile_id = auth.uid()
    and (
      p_skill_ids is null
      or skill_id <> all (p_skill_ids)
    );

  if p_skill_ids is not null and cardinality(p_skill_ids) > 0 then
    insert into public.profile_skills (profile_id, skill_id)
    select auth.uid(), s.id
    from unnest(p_skill_ids) as sid(id)
    join public.skills s on s.id = sid.id
    on conflict (profile_id, skill_id) do nothing;
  end if;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.sync_profile_skills(uuid[]) from public, anon;
grant execute on function public.sync_profile_skills(uuid[]) to authenticated;
