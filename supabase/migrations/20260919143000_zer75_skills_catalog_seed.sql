-- ZER-75: base skills catalog so plantel "Por skill" has discoverable options.
-- Mirrors the roles seed in 20260728190000_membership_roles.sql.
-- Names match docs/roadmap/Glosario.md examples (Solidity, IA, Diseño).

insert into public.skills (nombre)
values
  ('Solidity'),
  ('IA'),
  ('Diseño')
on conflict (nombre) do nothing;
