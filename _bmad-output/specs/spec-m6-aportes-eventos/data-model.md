# Data model (M6 · Aportes y eventos)

Tables as drafted in the PRD (`docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md` §6) and indexed in `docs/roadmap/Modelo de datos.md`.

## Tables

```
aportes
  id              uuid
  profile_id      uuid -> profiles.id   -- de quién es el aporte
  tipo            enum('economico','donacion','prestamo','charla','actividad','mantenimiento','administracion','yerba','otro')
  descripcion     text
  monto           numeric               -- opcional (económicos)
  fecha           date
  registrado_por  uuid -> profiles.id
  created_at      timestamptz
  -- puntos: NOT in this milestone. Stays commented out until Puntos Serrano
  --         leaves docs/roadmap/Backlog.md.

events
  id              uuid
  titulo          text
  descripcion     text
  lugar           text
  inicio          timestamptz
  fin             timestamptz
  creado_por      uuid -> profiles.id
  created_at      timestamptz

event_attendance
  event_id        uuid -> events.id
  profile_id      uuid -> profiles.id
  estado          enum('voy','quizas','no')
  (PK: event_id + profile_id)
```

Enum values are **domain terms and stay in Spanish exactly as written above**. Column names likewise (`titulo`, `descripcion`, `lugar`, `inicio`, `fin`, `creado_por`, `monto`, `fecha`, `registrado_por`).

### `aportes.tipo` — exactly nine values

`economico`, `donacion`, `prestamo`, `charla`, `actividad`, `mantenimiento`, `administracion`, `yerba`, `otro`.

Nine, no more, no fewer, in that order. They map to PRD §5.8: _"económico (cuota), donación, préstamo de objeto, charla dada, actividad, mantenimiento, administración, yerba, otro."_ Note the enum values are unaccented (`economico`, `donacion`, `prestamo`) even though the Spanish UI labels carry accents — the label is presentation, the enum value is data.

Económico aportes inform the **Tier**; comunitario aportes back the **Rol** (Glosario). That is reporting semantics, not a schema constraint — no column enforces it in M6.

### Notes on shape

- `aportes.monto` is **nullable**. Only económico aportes typically carry one; a charla or a bag of yerba has no amount. Do not default it to `0` — null means "no amount", `0` would mean "an amount of zero".
- `aportes.profile_id` (whose aporte it is) and `aportes.registrado_por` (who typed it in) are different columns on purpose. They are equal for a self-registered aporte and differ for an admin-registered one.
- `aportes.fecha` is a `date` chosen by the person; `created_at` is when the row was written. Lists sort by `fecha`.
- **`monto` is a ledger entry, never a charge.** Nothing in this schema initiates, authorizes, or settles a payment — see the SPEC non-goals.
- `event_attendance` has a **composite primary key** `(event_id, profile_id)`: one RSVP row per person per event. Changing an answer is an upsert on that key, never a second row.
- `events` has **no `estado` column** in the PRD. The only `estado` in this bundle is `event_attendance.estado` (`voy/quizas/no`). Do not invent a published/cancelled lifecycle for events.
- Deleting an event must cascade its `event_attendance` rows; the FK should declare `on delete cascade` explicitly.

## RLS rules

From `docs/roadmap/Seguridad RLS.md`:

> - `aportes`: lee serranos; inserta dueño o admin (económicos → Tesorería).
> - `events`: lee autenticado; escribe serrano; edita/borra creador o admin.

Translated into policy requirements:

| Table              | Operation | Rule                                                                                                                                       |
| ------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `aportes`          | SELECT    | Serranos only (non-tourist). Reuse `public.is_non_tourist()` from `20260918220000_zer43_tarifa_hora_visibility.sql`                        |
| `aportes`          | INSERT    | The owner (`profile_id = auth.uid()`, self-registered) **or** a platform admin (`public.is_platform_admin()`) registering for someone else |
| `aportes`          | UPDATE    | Not in the milestone scope bullets — no policy, therefore denied. Raise it rather than inventing a rule                                    |
| `aportes`          | DELETE    | Same as UPDATE — out of scope, denied                                                                                                      |
| `events`           | SELECT    | Any authenticated user (tourists included)                                                                                                 |
| `events`           | INSERT    | Any serrano (non-tourist)                                                                                                                  |
| `events`           | UPDATE    | `creado_por = auth.uid()` **or** platform admin                                                                                            |
| `events`           | DELETE    | `creado_por = auth.uid()` **or** platform admin                                                                                            |
| `event_attendance` | SELECT    | Any authenticated user — the attendee list is public to the app                                                                            |
| `event_attendance` | INSERT    | **Own row only** (`profile_id = auth.uid()`), and the viewer must be a serrano                                                             |
| `event_attendance` | UPDATE    | **Own row only** — changing your own RSVP                                                                                                  |
| `event_attendance` | DELETE    | **Own row only** — withdrawing your own RSVP                                                                                               |

### ⚠️ `event_attendance` has NO rule in `docs/roadmap/Seguridad RLS.md`

This is a genuine gap in the RLS reference, not an oversight of this document. `docs/roadmap/Seguridad RLS.md` lists rules for `profiles`, `tarifa_hora`, `profile_roles`, `membership_requests`, `projects`/`project_members`, `aportes`, `events`, and `tasks` — and **says nothing about `event_attendance`**.

The only source is the PRD's prose: _"cada uno gestiona su propia asistencia."_

**Decision taken:** story **6.5** (the `events` + `event_attendance` migration story) **adds that rule to `docs/roadmap/Seguridad RLS.md`**, alongside the `events` bullet, so the RLS reference remains the complete picture of the database's access rules. Writing the policies without writing the doc bullet leaves the reference permanently wrong, and the reference is what the next milestone reads.

Suggested bullet text (Spanish, matching the surrounding style):

> - `event_attendance`: lee autenticado; cada uno gestiona **su propia** asistencia (insert/update/delete solo la fila propia).

### `is_platform_admin` vs project admin

In M6, "admin" always means `profiles.is_platform_admin` — reuse `public.is_platform_admin()` from `20260821223400_fix_rls_recursion_profiles.sql`. This differs from M5, where "admin" is scoped to a single project. Do not cross-wire them.

"Económicos → Tesorería" is an **organizational convention**: Tesorería is a _rol_ (`profile_roles`), not a permission axis in the data model. M6 does not enforce it in a policy.

### Recursion hazard (ZER-65 class)

Policies that read the same table they protect are the shape that caused **ZER-65**: a self-referencing subquery in a `membership_requests` policy re-triggered the policies on the same table and aborted every insert with `42P17 infinite recursion detected in policy for relation …`. The app mapped it to a generic error message, so the whole tourist → serrano path was dead for every user and the UI never said so.

`event_attendance` policies are low risk here (they compare `profile_id` to `auth.uid()` directly), but any policy that needs to look up a parent row should use a `security definer` helper function — the pattern already used by `public.is_platform_admin()` and `public.is_non_tourist()` — rather than an inline subquery, and must be covered by a policy test that actually writes.

## ⚠️ Grants vs RLS — read before writing the migration

**In PostgREST, RLS is evaluated only AFTER table privileges.** If the `authenticated` role has no `GRANT` on a table, PostgREST returns `42501 permission denied` and the policies **never run**. A perfectly written policy set on an ungranted table is invisible: every request fails, and it fails in a way that looks like a policy bug.

- **New tables are covered by default privileges.** `supabase/migrations/20260919011500_zer49_default_privileges_for_role.sql` (ZER-49) declares `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public`, so tables created by later migrations inherit `select, insert, update, delete` for `anon` / `authenticated` and `all` for `service_role` without a per-table `GRANT`. `aportes`, `events`, and `event_attendance` are created by migrations and therefore inherit them.
- **That does not cover RLS.** Default privileges grant _access to the table_. Every exposed table must **still** get `alter table … enable row level security` plus its explicit policies, in the same migration. Inheriting DML without enabling RLS is the worst outcome: `aportes` — which holds people's contribution amounts — would be world-readable and world-writable for every authenticated user, tourists included.
- **Automated check:** `pnpm db:check-grants`, run in CI as the job **`db grants (authenticated)`**. It fails if any public base table lacks authenticated DML (table- or column-level) or if `postgres` is missing the default privileges. It must be green before an M6 story is claimed done.
- **Local probe:** `scripts/zer49-probe-new-table.sql` — run it against a local database to confirm a freshly created table really did inherit the grants.
- **Do not re-run `GRANT … ON ALL TABLES`** as a shortcut. ZER-49 deliberately avoids it: it would restore table-level `SELECT` on `profiles` and undo the `tarifa_hora` column mask from ZER-43.

**The incident this machinery exists to prevent is ZER-65.** A database-layer authorization defect — there, a recursive policy; here, a missing grant or a missing `enable row level security` — surfaced to users as a generic "no pudimos…" message and silently killed a whole product path. The grants check and a real policy test are the only things that catch this class before a user does.

## Test expectations

- A migration test / policy harness (see `scripts/check-membership-request-rls.harness.ts` for the existing pattern) proving:
  - a serrano can insert their own aporte; a tourist cannot read or write aportes;
  - a platform admin can insert an aporte for another `profile_id`; a non-admin serrano cannot;
  - `monto` accepts null;
  - `tipo` rejects a tenth value;
  - a serrano can create an event; a tourist cannot;
  - a non-creator, non-admin serrano cannot update or delete an event;
  - deleting an event removes its `event_attendance` rows;
  - a person can upsert only their own `event_attendance` row, and changing the answer updates one row;
  - no `42P17` recursion on any policy path.
- `pnpm db:check-grants` green.
- `docs/roadmap/Seguridad RLS.md` contains the new `event_attendance` bullet.
