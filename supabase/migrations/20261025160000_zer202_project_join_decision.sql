-- ZER-202 (1/2): enum value must commit before CHECK/policies can use it.
alter type public.project_member_estado add value if not exists 'rechazado';
