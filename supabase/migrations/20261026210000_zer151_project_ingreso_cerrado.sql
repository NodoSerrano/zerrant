-- ZER-151: a third way into a project: cerrado, it does not take people.
--
-- Only the enum grows. The ZER-82 self-join policy already lets people in
-- only when ingreso is 'abierto' (estado aprobado) or 'aprobacion' (estado
-- pendiente), so a forced join on a cerrado project fails in the DB without
-- touching the policy. Existing members and pending requests stay as they
-- are; the project admin can still approve or reject what was pending.

alter type public.project_ingreso add value if not exists 'cerrado';
