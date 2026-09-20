# Data model (M5 · Proyectos)

Tables as drafted in the PRD (`docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md` §6) and indexed in `docs/roadmap/Modelo de datos.md`.

## Tables

```
projects
  id              uuid
  nombre          text
  descripcion     text
  estado          enum('idea','en_curso','pausado','terminado') default 'idea'
  ingreso         enum('abierto','aprobacion') default 'aprobacion'
  creado_por      uuid -> profiles.id
  created_at      timestamptz

project_members
  project_id      uuid -> projects.id
  profile_id      uuid -> profiles.id
  rol             enum('miembro','admin') default 'miembro'
  estado          enum('pendiente','aprobado') default 'pendiente'
  (PK: project_id + profile_id)
```

Enum values are **domain terms and stay in Spanish exactly as written above**. Column names likewise (`nombre`, `descripcion`, `estado`, `ingreso`, `creado_por`, `rol`) — they match the rest of the schema (`profiles`, `tasks`).

### Notes on shape

- `project_members` has a **composite primary key** `(project_id, profile_id)`: one membership row per person per project. A second join attempt collides on the PK rather than creating a duplicate.
- `projects.creado_por` is the author. The creator is _also_ seated as a `project_members` row with `rol='admin'`, `estado='aprobado'` in the same transaction — per PRD §5.7, "El creador es admin del proyecto".
- Only `estado='aprobado'` rows count as project membership. `pendiente` rows are the join-request queue and must never be rendered as members.
- Deleting a project is out of M5 scope, but the FK from `project_members.project_id` should still declare its `on delete` behavior explicitly rather than defaulting silently.

## RLS rules

From `docs/roadmap/Seguridad RLS.md`:

> `projects`/`project_members`: crear = cualquier serrano; editar config y aprobar ingresos = admins **de ese proyecto**; `ingreso=abierto` → entra aprobado, `aprobacion` → pendiente.

Translated into policy requirements:

| Table             | Operation | Rule                                                                                                                                                                                               |
| ----------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects`        | SELECT    | Any authenticated user (assumption — see SPEC "Assumptions"; tourists may read, not write)                                                                                                         |
| `projects`        | INSERT    | Any serrano (non-tourist). Reuse `public.is_non_tourist()` from `20260918220000_zer43_tarifa_hora_visibility.sql`                                                                                  |
| `projects`        | UPDATE    | Admins **of that project** only — a `project_members` row with the same `project_id`, `profile_id = auth.uid()`, `rol='admin'`, `estado='aprobado'`                                                |
| `projects`        | DELETE    | Out of scope for M5 — no policy, therefore denied                                                                                                                                                  |
| `project_members` | SELECT    | Any authenticated user                                                                                                                                                                             |
| `project_members` | INSERT    | Self-join by a serrano, with the `estado` forced by the project's `ingreso`: `abierto` → `aprobado` allowed, `aprobacion` → `pendiente` only. Plus the creator's own admin row at project creation |
| `project_members` | UPDATE    | Admins of that project — approving (`pendiente` → `aprobado`) and designating admins (`rol` `miembro` → `admin`)                                                                                   |
| `project_members` | DELETE    | Admins of that project (rejecting a `pendiente` request)                                                                                                                                           |

### The `ingreso` door must be enforced in the database

The single most important policy in this milestone: a client must not be able to self-insert `estado='aprobado'` into a project whose `ingreso='aprobacion'`. The `WITH CHECK` clause has to read the parent project's `ingreso` and constrain the inserted `estado` accordingly. A server action that "sets the right estado" is ergonomics, not a guard — if the policy does not enforce it, the approval gate does not exist.

### Admin scoping

"Admins **de ese proyecto**" is `project_members.rol='admin'` scoped by `project_id`, **not** `profiles.is_platform_admin`. Do not fold a platform-admin override in silently; if one is wanted, it must be an explicit, reviewed clause in the policy.

### Recursion hazard (ZER-65 class)

`project_members` policies that must read `project_members` (to check "am I an admin of this project?") are exactly the shape that caused **ZER-65**: a self-referencing subquery in a `membership_requests` policy re-triggered the policies on the same table and aborted every insert with `42P17 infinite recursion detected in policy for relation …`. The app mapped it to a generic error message, so the entire tourist → serrano path was dead for every user and nobody noticed from the UI.

Mitigation: put the admin check in a `security definer` helper function (the pattern already used by `public.is_platform_admin()` in `20260821223400_fix_rls_recursion_profiles.sql`) rather than an inline subquery over the same table, and cover it with a policy test that actually inserts.

## ⚠️ Grants vs RLS — read before writing the migration

**In PostgREST, RLS is evaluated only AFTER table privileges.** If the `authenticated` role has no `GRANT` on a table, PostgREST returns `42501 permission denied` and the policies **never run**. A perfectly written policy set on an ungranted table is invisible: every request fails, and it fails in a way that looks like a policy bug.

- **New tables are covered by default privileges.** `supabase/migrations/20260919011500_zer49_default_privileges_for_role.sql` (ZER-49) declares `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public`, so tables created by later migrations inherit `select, insert, update, delete` for `anon` / `authenticated` and `all` for `service_role` without a per-table `GRANT`. `projects` and `project_members` are created by a migration and therefore inherit them.
- **That does not cover RLS.** Default privileges grant _access to the table_. Every exposed table must **still** get `alter table … enable row level security` plus its explicit policies, in the same migration. Inheriting DML without enabling RLS is the worst outcome: the table is world-readable and world-writable for every authenticated user.
- **Automated check:** `pnpm db:check-grants`, run in CI as the job **`db grants (authenticated)`**. It fails if any public base table lacks authenticated DML (table- or column-level) or if `postgres` is missing the default privileges. It must be green before an M5 story is claimed done.
- **Local probe:** `scripts/zer49-probe-new-table.sql` — run it against a local database to confirm a freshly created table really did inherit the grants.
- **Do not re-run `GRANT … ON ALL TABLES`** as a shortcut. ZER-49 deliberately avoids it: it would restore table-level `SELECT` on `profiles` and undo the `tarifa_hora` column mask from ZER-43.

**The incident this machinery exists to prevent is ZER-65.** A database-layer authorization defect — there, a recursive policy; here, a missing grant or a missing `enable row level security` — surfaced to users as a generic "no pudimos…" message and silently killed a whole product path. The grants check and a real policy test are the only things that catch this class before a user does.

## Test expectations

- A migration test / policy harness (see `scripts/check-membership-request-rls.harness.ts` for the existing pattern) proving:
  - a serrano can insert a project; a tourist cannot;
  - a non-admin of a project cannot update its config;
  - a project admin can approve a `pendiente` row and promote a member to `admin`;
  - joining `abierto` yields `aprobado`; joining `aprobacion` yields `pendiente`;
  - a direct client insert of `estado='aprobado'` into an `aprobacion` project is rejected;
  - no `42P17` recursion on any `project_members` policy path.
- `pnpm db:check-grants` green.
