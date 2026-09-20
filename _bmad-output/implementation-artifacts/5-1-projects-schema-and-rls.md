# Story 5.1: `projects` and `project_members` migration, enums, and RLS

Status: backlog

## Linear

- **ZER-78** — Story 5.1: Migración `projects` + `project_members` con enums y RLS
- URL: https://linear.app/zerrant/issue/ZER-78
- Branch: `juantandil123/zer-78-story-51-migracion-projects-project_members-con-enums-y-rls`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 5 — Proyectos**
- Unblocks both M5 DoD bullets — _"Un serrano crea un proyecto por aprobación; otro solicita y el admin lo aprueba."_ and _"En un proyecto abierto, unirse es inmediato."_ — because neither can be demonstrated without real tables under real policy.
- Blocks every other Epic 5 story (5.2 → 5.9). This is the first story of the epic and has no in-epic prerequisite.

## Story

As a platform engineer,
I want `projects` and `project_members` created with the PRD enums, RLS enabled, and verified grants,
so that every projects screen reads and writes real rows under real policy instead of placeholder data.

## Acceptance Criteria

1. **Given** the PRD §6 draft and `_bmad-output/specs/spec-m5-proyectos/data-model.md`
   **When** the migration is applied
   **Then** `projects` exists with `id` (uuid PK), `nombre` (text), `descripcion` (text), `estado` enum (`idea`, `en_curso`, `pausado`, `terminado`, default `idea`), `ingreso` enum (`abierto`, `aprobacion`, default `aprobacion`), `creado_por` uuid → `profiles.id`, and `created_at` timestamptz (FR27, NFR15)

2. **Given** the same migration
   **When** it is applied
   **Then** `project_members` exists with `project_id` uuid → `projects.id`, `profile_id` uuid → `profiles.id`, `rol` enum (`miembro`, `admin`, default `miembro`), `estado` enum (`pendiente`, `aprobado`, default `pendiente`), and composite primary key `(project_id, profile_id)` (FR27)
   **And** the `project_members.project_id` foreign key declares its `on delete` behaviour explicitly instead of defaulting silently (FR27)

3. **Given** both tables exist
   **When** the migration finishes
   **Then** both carry `alter table … enable row level security` **plus** their explicit policies in the same migration file — never in a follow-up (FR28, NFR13, NFR20)

4. **Given** the policy set
   **When** it is evaluated
   **Then** `projects` SELECT is allowed for any authenticated user; `projects` INSERT is allowed for any serrano via `public.is_non_tourist()`; `projects` UPDATE is allowed only for a `rol='admin'`, `estado='aprobado'` member of that same `project_id`; `projects` DELETE has no policy and is therefore denied (FR28, NFR14)

5. **Given** the policy set
   **When** it is evaluated
   **Then** `project_members` SELECT is allowed for any authenticated user; UPDATE and DELETE are allowed only for a `rol='admin'`, `estado='aprobado'` member of that same `project_id`; INSERT is the self-join policy that story 5.5 pins to the project's `ingreso` door (FR28, FR33, NFR14)

6. **Given** the "admin of that project" check
   **When** it is written
   **Then** it is implemented as a `security definer` helper function (e.g. `public.is_project_admin(uuid)`) with `set search_path = ''` and a tight `grant execute`, following `public.is_platform_admin()` / `public.is_non_tourist()` — **not** an inline subquery over `project_members` inside a `project_members` policy (NFR20)
   **And** a policy test that actually inserts, updates and deletes proves no `42P17 infinite recursion detected in policy for relation` on any path (NFR20, NFR11)

7. **Given** the scoping rule
   **When** the admin check is written
   **Then** it resolves `project_members.rol='admin'` scoped by `project_id` and does **not** silently accept `profiles.is_platform_admin`; a platform-admin override, if ever wanted, must be an explicit reviewed clause (FR28)

8. **Given** the ZER-49 default privileges
   **When** the tables are created by this migration
   **Then** `pnpm db:check-grants` passes and the CI job `db grants (authenticated)` is green (FR28, NFR13)
   **And** `scripts/zer49-probe-new-table.sql` confirms locally that the freshly created tables really inherited the grants (NFR13)

9. **Given** the policy harness pattern in `scripts/check-membership-request-rls.harness.ts`
   **When** the harness for this story runs
   **Then** it proves: a serrano can insert a project; a tourist cannot; a non-admin of a project cannot update its config; a project admin can (NFR11, NFR14)

10. **Given** TDD is mandatory
    **When** the story is claimed done
    **Then** the failing test was written before the migration, and `pnpm test`, `pnpm typecheck`, and `pnpm lint` are green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — Read the framework docs before writing code** (AC: 1–10)
  - [ ] This Next.js version has breaking changes vs. training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code (per `AGENTS.md`), and heed deprecation notices.
  - [ ] Read `_bmad-output/specs/spec-m5-proyectos/data-model.md` end to end, including both ⚠️ sections.

- [ ] **T1 — RED: write the failing policy harness first** (AC: 6, 9, 10)
  - [ ] Copy the shape of `scripts/check-membership-request-rls.harness.ts` into a projects harness.
  - [ ] Cases: serrano insert project OK; tourist insert rejected; non-admin update config rejected; project admin update OK; no `42P17` on any `project_members` path.
  - [ ] Verify RED: the tables do not exist yet, so every case fails.

- [ ] **T2 — GREEN: the migration** (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] New file under `supabase/migrations/`, timestamped **after** `20260919143000_zer75_skills_catalog_seed.sql`, named for ZER-78.
  - [ ] `create type` for `project_estado`, `project_ingreso`, `project_member_rol`, `project_member_estado` (names are the implementer's call; the **values** are not).
  - [ ] `create table public.projects` and `create table public.project_members` per AC 1–2.
  - [ ] `create or replace function public.is_project_admin(p_project_id uuid) returns boolean language sql security definer set search_path = ''`; `revoke execute … from public`; `grant execute … to authenticated, service_role`.
  - [ ] `alter table … enable row level security` on both, then the policies from AC 4–5.
  - [ ] Header comment stating the threat model: ungranted table → `42501`; self-referencing policy → `42P17` (ZER-65).

- [ ] **T3 — Grants verification** (AC: 8)
  - [ ] Run `pnpm db:check-grants` locally; confirm the CI job `db grants (authenticated)` is green.
  - [ ] Run `scripts/zer49-probe-new-table.sql` against a local database for both new tables.
  - [ ] Do **not** re-run `GRANT … ON ALL TABLES` as a shortcut — it would undo the ZER-43 `tarifa_hora` column mask.

- [ ] **T4 — Types** (AC: 1, 2, 10)
  - [ ] Regenerate `src/lib/supabase/database.types.ts` so `projects`, `project_members` and their enums exist in the type system before any consumer story starts.
  - [ ] `pnpm typecheck` green.

- [ ] **T5 — Verify** (AC: 8, 9, 10)
  - [ ] `pnpm test` green.
  - [ ] `pnpm db:check-grants` green.
  - [ ] `pnpm typecheck && pnpm lint` green.

## Dev Notes

### Current state / problem

There is no `projects` table and no `project_members` table. "Proyectos" exists only as dead chrome: an inert `<span className="… cursor-default">Proyectos</span>` in the Nodo hub segmented control, a greyed "Mis proyectos" row in the serrano profile menu, and a hardcoded `"Todavía no hay proyectos."` line in plantel member detail. Every later Epic 5 story reads or writes rows that do not exist yet.

`docs/roadmap/Seguridad RLS.md:16` already carries the rule in prose; it has never been translated into a policy.

### Approach

One forward-only migration that creates both tables, both sets of enums, the `security definer` admin helper, `enable row level security`, and every policy — all in the same file. Then a policy harness that actually writes rows, because the two failure modes this story exists to prevent (`42501` from a missing grant, `42P17` from a recursive policy) are both invisible to a read-only check and both surface to users as a generic error.

The `ingreso` door (`abierto` → `aprobado` allowed, `aprobacion` → `pendiente` only) is **story 5.5's** `WITH CHECK` clause. This story ships the `project_members` INSERT policy scaffold; 5.5 pins the door and proves the bypass is rejected. Keep the split clean so 5.5 has something to tighten rather than something to rewrite.

### The two guardrails that must both hold

**Grants rule.** In PostgREST, RLS is evaluated only **after** table privileges. If `authenticated` has no `GRANT`, PostgREST returns `42501 permission denied` and the policies **never run** — the request fails in a way that looks exactly like a policy bug. `supabase/migrations/20260919011500_zer49_default_privileges_for_role.sql` (ZER-49) declares `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public`, so tables created by later migrations inherit DML for `anon` / `authenticated` / `service_role`. **Those default privileges grant access to the table; they do not enable RLS.** Inheriting DML without `enable row level security` is the worst outcome: the table is world-readable and world-writable for every authenticated user. Verify with `pnpm db:check-grants` (CI job `db grants (authenticated)`) and probe locally with `scripts/zer49-probe-new-table.sql`.

**Recursion rule.** A policy that reads its own table is the exact shape that caused **ZER-65**: a self-referencing subquery in a `membership_requests` policy re-triggered the policies on the same table and aborted every insert with `42P17 infinite recursion detected in policy for relation "membership_requests"`. The app mapped it to a generic _"No pudimos enviar tu solicitud"_, so the whole tourist → serrano path was dead for every user and nobody noticed from the UI. `project_members` policies must ask "am I an admin of this project?" — which reads `project_members`. Put that check in a `security definer` helper (`set search_path = ''`, tight `grant execute`), following `public.is_platform_admin()` (`20260821223400_fix_rls_recursion_profiles.sql`) and `public.is_non_tourist()` (`20260918220000_zer43_tarifa_hora_visibility.sql`), and cover it with a test that actually inserts.

### The two "admin" meanings must never be cross-wired

| Milestone | "admin" means                                        | Helper                          |
| --------- | ---------------------------------------------------- | ------------------------------- |
| **M5**    | `project_members.rol='admin'` scoped by `project_id` | new `public.is_project_admin()` |
| **M6**    | `profiles.is_platform_admin`                         | `public.is_platform_admin()`    |

A platform admin is **not** automatically a project admin. If that override is ever wanted, it is an explicit, reviewed clause in the policy — never a silent `or public.is_platform_admin()` folded in for convenience.

### Files to touch

| Area          | Path                                                                             | Notes                                                                      |
| ------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| NEW migration | `supabase/migrations/<ts>_zer78_projects_project_members.sql`                    | Tables, enums, `is_project_admin()`, `enable row level security`, policies |
| NEW harness   | `scripts/check-projects-rls.harness.ts`                                          | Follows `check-membership-request-rls.harness.ts`                          |
| Types         | `src/lib/supabase/database.types.ts`                                             | Regenerate — do not hand-edit                                              |
| Prior art     | `supabase/migrations/20260919021000_zer65_membership_requests_rls_recursion.sql` | The `42P17` incident and its fix                                           |
| Prior art     | `supabase/migrations/20260918220000_zer43_tarifa_hora_visibility.sql`            | `is_non_tourist()` definer pattern (lines 16–30)                           |
| Prior art     | `supabase/migrations/20260821223400_fix_rls_recursion_profiles.sql`              | `is_platform_admin()` definer pattern                                      |
| Grants tool   | `scripts/zer49-probe-new-table.sql`, `pnpm db:check-grants`                      | Must be green                                                              |

### Testing requirements

- **TDD mandatory (NFR11):** the failing harness case is written **before** the migration. Writing the migration first and the test after is a discipline failure, not a shortcut.
- `pnpm test` green before the story is claimed done.
- `pnpm db:check-grants` green (CI job `db grants (authenticated)`).
- The harness must **write**, not just read. A read-only probe cannot see `42P17` on an insert path and cannot see a missing INSERT grant.
- Authorization is enforced in the database (NFR14): every negative case asserts the DB rejected the write, never that the UI hid a button.

### Out of scope

- Any UI. This story ships schema and policy only.
- The `ingreso` door `WITH CHECK` proof — that is story 5.5.
- Deleting a project, leaving a project, demoting an admin — not in M5 scope. If a frame implies one, raise it rather than inventing the rule.
- Linking `tasks` to `projects` — that relation does not exist in the PRD data model.
- Puntos Serrano, project budgets/invoicing, on-chain payments, push notifications, chat — all parked in `docs/roadmap/Backlog.md`.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** ship `create table` in one migration and `enable row level security` in another. Same file, always.
- **Do NOT** write an inline `exists (select 1 from project_members …)` inside a `project_members` policy. That is the ZER-65 shape.
- **Do NOT** re-run `GRANT … ON ALL TABLES IN SCHEMA public` — ZER-49 deliberately avoids it; it would restore table-level `SELECT` on `profiles` and undo the ZER-43 `tarifa_hora` mask.
- **Do NOT** fold `profiles.is_platform_admin` into the project-admin check.
- **Do NOT** add a third `project_members.estado` value for "rejected". The PRD enum has exactly two; rejection removes the row (story 5.6).
- **Do NOT** add a `puntos`, `presupuesto`, or any budget column.
- **Do NOT** hand-edit `database.types.ts`.
- **Do NOT** accept a green `pnpm test` as proof of policy: the Vitest suite mocks Supabase. The policy proof is the harness against a real database.
- **Do NOT** claim the story done on a UI screenshot — there is no UI in this story.

### References

- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "`project_members` has a **composite primary key** `(project_id, profile_id)`: one membership row per person per project."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "**In PostgREST, RLS is evaluated only AFTER table privileges.** If the `authenticated` role has no `GRANT` on a table, PostgREST returns `42501 permission denied` and the policies **never run**."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "Default privileges grant _access to the table_. Every exposed table must **still** get `alter table … enable row level security` plus its explicit policies, in the same migration."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "Mitigation: put the admin check in a `security definer` helper function … rather than an inline subquery over the same table, and cover it with a policy test that actually inserts."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "\"Admins **de ese proyecto**\" is `project_members.rol='admin'` scoped by `project_id`, **not** `profiles.is_platform_admin`."]
- [Source: `docs/roadmap/Seguridad RLS.md:16` — "`projects`/`project_members`: crear = cualquier serrano; editar config y aprobar ingresos = admins **de ese proyecto**; `ingreso=abierto` → entra aprobado, `aprobacion` → pendiente."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "NFR20: Migrations are forward-only, versioned, and timestamped; RLS policies live in migrations, never in application code."]
- [Source: `AGENTS.md` — "This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."]
- [Source: `supabase/migrations/20260919021000_zer65_membership_requests_rls_recursion.sql` — "42P17 infinite recursion detected in policy for relation \"membership_requests\""]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
