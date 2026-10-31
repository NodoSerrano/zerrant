-- ZER-216: a member skill is only its name again.
--
-- QA (2026-10-28) asked to drop the level and the freelance / company years
-- that ZER-163 added to each member skill. Proposals and admin approval stay.
-- ZER-163 never reached main, so the columns go instead of being hidden.
--
-- save_profile_skills now takes the skill ids only. It still replaces the
-- caller's set and still ignores anything that is not an approved skill.

drop function if exists public.save_profile_skills(jsonb);
drop function if exists public.save_profile_skills(json);

alter table public.profile_skills
  drop column if exists nivel,
  drop column if exists anios_freelance,
  drop column if exists anios_empresa;

drop type if exists public.skill_nivel;

create or replace function public.save_profile_skills(p_skill_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tier public.tier;
  v_ids uuid[] := coalesce(p_skill_ids, '{}');
begin
  if v_uid is null then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  select tier into v_tier from public.profiles where id = v_uid;
  if not found or v_tier = 'tourist' then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  delete from public.profile_skills
  where profile_id = v_uid
    and not (skill_id = any (v_ids));

  -- Only approved catalog skills can sit on a profile.
  insert into public.profile_skills (profile_id, skill_id)
  select v_uid, s.id
  from public.skills s
  where s.id = any (v_ids)
    and s.estado = 'aprobada'
  on conflict (profile_id, skill_id) do nothing;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.save_profile_skills(uuid[]) from public, anon;
grant execute on function public.save_profile_skills(uuid[]) to authenticated;
