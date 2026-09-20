# Story 6.5: `events` and `event_attendance` migration, RSVP enum, RLS, and the Seguridad RLS.md rule

Status: done

## Linear

- **ZER-91** — Story 6.5: Migración `events` + `event_attendance` con RLS y cerrar el hueco de Seguridad RLS
- URL: https://linear.app/zerrant/issue/ZER-91
- Branch: `juantandil123/zer-91-story-65-migracion-events-event_attendance-con-rls-y-cerrar`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- Unblocks M6 DoD bullet _"Se crea un evento, la gente confirma y se ve la lista de asistentes."_ — nothing in the events half exists without these two tables.
- First story of the events half. Blocks 6.6 → 6.10.

## Story

As a platform engineer,
I want the events tables with their policies **and** the missing `event_attendance` rule written into the RLS reference,
so that the agenda runs on real policy and the security reference stays the complete picture.

## Acceptance Criteria

1. **Given** the PRD §6 draft and `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md`
   **When** the migration is applied
   **Then** `events` exists with `id` (uuid PK), `titulo` (text), `descripcion` (text), `lugar` (text), `inicio` (timestamptz), `fin` (timestamptz), `creado_por` uuid → `profiles.id`, and `created_at` timestamptz (FR43)
   **And** `events` has **no `estado` column** — there is no published/cancelled lifecycle for an event, and the only `estado` in M6 is `event_attendance.estado` (FR43)

2. **Given** the same migration
   **When** it is applied
   **Then** `event_attendance` exists with `event_id` uuid → `events.id`, `profile_id` uuid → `profiles.id`, `estado` enum (`voy`, `quizas`, `no` — unaccented), and composite primary key `(event_id, profile_id)` (FR43, NFR15)

3. **Given** the `event_attendance.event_id` foreign key
   **When** it is declared
   **Then** it carries `on delete cascade` **explicitly**, so deleting an event removes its attendance rows (FR43, FR49)

4. **Given** both tables exist
   **When** the migration finishes
   **Then** both carry `alter table … enable row level security` **plus** their explicit policies in the same migration file (FR43, NFR13, NFR20)

5. **Given** the `events` policy set
   **When** it is evaluated
   **Then** SELECT is allowed for any authenticated user (tourists included); INSERT for any serrano via `public.is_non_tourist()`; UPDATE and DELETE for `creado_por = auth.uid()` **or** `public.is_platform_admin()` (FR43, NFR14)

6. **Given** the `event_attendance` policy set
   **When** it is evaluated
   **Then** SELECT is allowed for any authenticated user; INSERT, UPDATE and DELETE are allowed for the **own row only** (`profile_id = auth.uid()`), and the writer must be a serrano (FR43, NFR14)

7. **Given** `docs/roadmap/Seguridad RLS.md` today lists rules for `profiles`, `tarifa_hora`, `profile_roles`, `membership_requests`, `projects`/`project_members`, `aportes`, `events` and `tasks` — and **says nothing about `event_attendance`**
   **When** this story lands
   **Then** an `event_attendance` bullet is added next to the `events` bullet (line 18), in Spanish, matching the surrounding style, stating that each person manages their own attendance row (FR43)

8. **Given** the ZER-49 default privileges
   **When** the tables are created by this migration
   **Then** `pnpm db:check-grants` passes and the CI job `db grants (authenticated)` is green (FR43, NFR13)
   **And** `scripts/zer49-probe-new-table.sql` confirms locally that both freshly created tables inherited the grants (NFR13)

9. **Given** any policy that must look up a parent row
   **When** it is written
   **Then** it uses a `security definer` helper (the `public.is_platform_admin()` / `public.is_non_tourist()` pattern) rather than an inline subquery over the same table, and a policy test that actually writes proves no `42P17` recursion (NFR20, NFR11)

10. **Given** the policy harness pattern in `scripts/check-membership-request-rls.harness.ts`
    **When** the harness for this story runs
    **Then** it proves: a serrano can create an event; a tourist cannot; a non-creator non-admin serrano can neither update nor delete; the creator can; a platform admin can; deleting an event removes its attendance rows; a person cannot write another person's attendance row (NFR11, NFR14)

11. **Given** TDD is mandatory
    **When** the story is claimed done
    **Then** the failing harness case was written before the migration, and `pnpm test`, `pnpm typecheck` and `pnpm lint` are green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — Read the framework docs and the data model** (AC: 1–11)
  - [ ] This Next.js version has breaking changes vs. training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code (per `AGENTS.md`).
  - [ ] Read `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` end to end, including both ⚠️ sections.

- [ ] **T1 — RED: write the failing policy harness first** (AC: 5, 6, 9, 10, 11)
  - [ ] New harness following `scripts/check-membership-request-rls.harness.ts`.
  - [ ] `events`: serrano insert OK; tourist insert rejected; tourist SELECT allowed; creator update/delete OK; platform admin update/delete OK; other serrano update/delete rejected.
  - [ ] `event_attendance`: own-row insert OK; own-row update OK; own-row delete OK; third-party write rejected; SELECT open to any authenticated user.
  - [ ] Cascade: delete an event with attendance rows → the rows are gone.
  - [ ] No `42P17` on any write path.
  - [ ] Verify RED: neither table exists yet.

- [ ] **T2 — GREEN: the migration** (AC: 1, 2, 3, 4, 5, 6, 9)
  - [ ] New file under `supabase/migrations/`, timestamped after the latest existing migration, named for ZER-91.
  - [ ] `create type public.rsvp_estado as enum ('voy', 'quizas', 'no')` — unaccented.
  - [ ] `create table public.events` per AC 1. **No `estado` column.**
  - [ ] `create table public.event_attendance` per AC 2, with `on delete cascade` on `event_id`.
  - [ ] `alter table … enable row level security` on both, then the policies from AC 5–6.
  - [ ] Header comment stating the threat model: ungranted table → `42501`; missing `enable row level security` → world-writable attendance; and why `on delete cascade` is explicit.

- [ ] **T3 — GREEN: close the documentation gap** (AC: 7)
  - [ ] Add the bullet to `docs/roadmap/Seguridad RLS.md`, immediately after the `events` bullet on line 18. Suggested text, matching the surrounding Spanish style:
    > - `event_attendance`: lee autenticado; cada uno gestiona **su propia** asistencia (insert/update/delete solo la fila propia).
  - [ ] This is **not** optional polish. Writing the policies without writing the doc bullet leaves the reference permanently wrong, and the reference is what the next milestone reads.

- [ ] **T4 — Grants verification** (AC: 8)
  - [ ] Run `pnpm db:check-grants` locally; confirm the CI job `db grants (authenticated)` is green.
  - [ ] Run `scripts/zer49-probe-new-table.sql` for both new tables.
  - [ ] Do **not** re-run `GRANT … ON ALL TABLES` as a shortcut.

- [ ] **T5 — Types** (AC: 1, 2, 11)
  - [ ] Regenerate `src/lib/supabase/database.types.ts` so `events`, `event_attendance` and `rsvp_estado` exist before stories 6.6–6.10 start.
  - [ ] Confirm no `estado` field appears on the `events` row type.
  - [ ] `pnpm typecheck` green.

- [ ] **T6 — Verify** (AC: 8, 10, 11)
  - [ ] `pnpm test`, `pnpm db:check-grants`, `pnpm typecheck`, `pnpm lint` green.
  - [ ] Confirm the new bullet is present in `docs/roadmap/Seguridad RLS.md`.

## Dev Notes

### Current state / problem

There are no events tables. `/agenda` is a literal stub page (`src/app/(app)/agenda/page.tsx`) that exists solely so the TabBar navigates without JavaScript — it renders an `<h1>Agenda</h1>` and _"La agenda de eventos llega en un milestone posterior…"_.

`docs/roadmap/Seguridad RLS.md:18` carries the `events` rule in prose — _"`events`: lee autenticado; escribe serrano; edita/borra creador o admin."_ — and has **never** mentioned `event_attendance`.

### This story owns the documentation gap

This is a genuine gap in the RLS reference, not an oversight of the spec. `docs/roadmap/Seguridad RLS.md` lists rules for eight tables and says nothing about `event_attendance`. The only source is the PRD's prose: _"cada uno gestiona su propia asistencia."_

The decision recorded in the data model is explicit: **story 6.5 adds that rule to `docs/roadmap/Seguridad RLS.md`**, alongside the `events` bullet, so the reference remains the complete picture of the database's access rules. The doc edit is an acceptance criterion (AC 7) and is re-checked at the milestone gate (story 6.11). It is not a nice-to-have to defer.

### `events` has NO `estado` column

The PRD gives `events` no lifecycle column. The **only** `estado` in this bundle is `event_attendance.estado` (`voy` / `quizas` / `no`). Do not invent `publicado`, `cancelado`, `borrador`, or a soft-delete flag. Cancelling an event in M6 means deleting it (story 6.10), which cascades its attendance rows.

### The two guardrails that must both hold

**Grants rule.** In PostgREST, RLS is evaluated only **after** table privileges. If `authenticated` has no `GRANT`, PostgREST returns `42501 permission denied` and the policies **never run** — the request fails in a way that looks exactly like a policy bug. `supabase/migrations/20260919011500_zer49_default_privileges_for_role.sql` (ZER-49) declares `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public`, so tables created by later migrations inherit DML for `anon` / `authenticated` / `service_role`. **Those default privileges grant access to the table; they do not enable RLS.** Verify with `pnpm db:check-grants` (CI job `db grants (authenticated)`) and probe with `scripts/zer49-probe-new-table.sql`.

**Recursion rule.** A policy that reads its own table is the shape that caused **ZER-65**: a self-referencing subquery in a `membership_requests` policy re-triggered the policies on the same table and aborted every insert with `42P17 infinite recursion detected in policy for relation "membership_requests"`. The app mapped it to a generic error, so the whole tourist → serrano path was dead for every user and nobody noticed from the UI. `event_attendance` policies compare `profile_id` to `auth.uid()` directly, so they are low risk — but any policy that grows a parent lookup (for example "is the parent event still open?") must go through a `security definer` helper, never an inline subquery, and must be covered by a test that actually writes.

### "admin" means platform admin here

| Milestone | "admin" means                                        | Helper                       |
| --------- | ---------------------------------------------------- | ---------------------------- |
| **M5**    | `project_members.rol='admin'` scoped by `project_id` | `public.is_project_admin()`  |
| **M6**    | `profiles.is_platform_admin`                         | `public.is_platform_admin()` |

Event edit/delete admin is `profiles.is_platform_admin`, unlike M5 where "admin" is scoped to a project. Do not cross-wire them.

### The cascade is explicit, and it is tested

`on delete cascade` on `event_attendance.event_id` is what makes story 6.10's delete correct. Relying on Postgres's default (`no action`) would make the delete fail with a foreign-key violation the moment anyone has RSVP'd — which is exactly the case that matters. Declare it, and prove it with a harness case that deletes an event that has attendance rows.

### Files to touch

| Area          | Path                                                                             | Notes                                                                        |
| ------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| NEW migration | `supabase/migrations/<ts>_zer91_events_event_attendance.sql`                     | Enum, both tables, cascade, `enable row level security`, policies — one file |
| **EDIT doc**  | `docs/roadmap/Seguridad RLS.md`                                                  | **AC 7** — add the `event_attendance` bullet after line 18                   |
| NEW harness   | `scripts/check-events-rls.harness.ts`                                            | Follows `check-membership-request-rls.harness.ts`                            |
| Types         | `src/lib/supabase/database.types.ts`                                             | Regenerate — do not hand-edit                                                |
| Prior art     | `supabase/migrations/20260821223400_fix_rls_recursion_profiles.sql`              | `is_platform_admin()` definer pattern                                        |
| Prior art     | `supabase/migrations/20260918220000_zer43_tarifa_hora_visibility.sql`            | `is_non_tourist()` definer pattern                                           |
| Prior art     | `supabase/migrations/20260919021000_zer65_membership_requests_rls_recursion.sql` | The `42P17` incident                                                         |
| Grants tool   | `scripts/zer49-probe-new-table.sql`, `pnpm db:check-grants`                      | Must be green                                                                |

### Testing requirements

- **TDD mandatory (NFR11):** the failing harness case is written **before** the migration.
- The harness must **write**, not just read.
- Authorization is enforced in the database (NFR14): every negative case asserts the database rejected the write.
- The cascade case must delete an event that **has** attendance rows and assert the rows are gone.
- The third-party attendance write must be attempted directly, not via a UI that hides the control.
- Assert the tourist **can** read events (they are not excluded from SELECT) but cannot insert — the asymmetry is deliberate and easy to get wrong.
- `pnpm test` and `pnpm db:check-grants` green before done.
- Confirm `docs/roadmap/Seguridad RLS.md` contains the new bullet — story 6.11 re-checks it.

### Out of scope

- Any UI. This story ships schema, policy, and one documentation bullet.
- The agenda screen, event create/detail/edit, RSVP UI — stories 6.6 → 6.10.
- An `estado` / lifecycle column on `events`.
- Recurring events, ICS/calendar export, external calendar sync, capacity limits, waitlists — none appear in the PRD or the milestone scope.
- Event reminders or RSVP nudges — push notifications are parked in `docs/roadmap/Backlog.md`.
- Birthdays — computed from `fecha_nacimiento` in M7, not here.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** ship `create table` in one migration and `enable row level security` in another. Same file, always.
- **Do NOT** add an `estado`, `publicado`, `cancelado`, or soft-delete column to `events`.
- **Do NOT** accent `quizas` in the enum. The UI label may read "quizás"; the stored value does not.
- **Do NOT** omit `on delete cascade`, and do not emulate it with a trigger or application-level cleanup.
- **Do NOT** skip the `docs/roadmap/Seguridad RLS.md` bullet. It is AC 7 and it is gated again in story 6.11.
- **Do NOT** use a project-scoped admin check — M6 admin is `profiles.is_platform_admin`.
- **Do NOT** re-run `GRANT … ON ALL TABLES IN SCHEMA public`.
- **Do NOT** restrict `events` SELECT to serranos — tourists read events; they just cannot write.
- **Do NOT** hand-edit `database.types.ts`.
- **Do NOT** accept a green `pnpm test` as proof of policy — the Vitest suite mocks Supabase.

### References

- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "### ⚠️ `event_attendance` has NO rule in `docs/roadmap/Seguridad RLS.md` … The only source is the PRD's prose: _\"cada uno gestiona su propia asistencia.\"_"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "**Decision taken:** story **6.5** … **adds that rule to `docs/roadmap/Seguridad RLS.md`** … Writing the policies without writing the doc bullet leaves the reference permanently wrong, and the reference is what the next milestone reads."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "> - `event_attendance`: lee autenticado; cada uno gestiona **su propia** asistencia (insert/update/delete solo la fila propia)."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "`events` has **no `estado` column** in the PRD. The only `estado` in this bundle is `event_attendance.estado` (`voy/quizas/no`). Do not invent a published/cancelled lifecycle for events."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "Deleting an event must cascade its `event_attendance` rows; the FK should declare `on delete cascade` explicitly."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "In M6, \"admin\" always means `profiles.is_platform_admin` … This differs from M5 … Do not cross-wire them."]
- [Source: `docs/roadmap/Seguridad RLS.md:18` — "`events`: lee autenticado; escribe serrano; edita/borra creador o admin."]
- [Source: `AGENTS.md` — "Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- **Shipped before this story file existed.** ZER-91 landed on `main` as `ddb121e` (PR #63, `feat(db): events + event_attendance schema and RLS`) while this ticketisation branch was still open. This file was written from the same sources (PRD §6, `docs/roadmap/Seguridad RLS.md`, the M6 milestone doc), not consumed by the implementer, so its ACs are a **post-hoc contract**, not the input that drove the work. Treat any mismatch as something to reconcile against `ddb121e`, not as a defect in the shipped migration.
- Verified present on `main` at rebase time: the migration, an RLS harness, schema tests, regenerated Supabase types, and the `event_attendance` bullet in `docs/roadmap/Seguridad RLS.md` — which is AC 7 of this story, the documentation gap this story was meant to close.

### Change Log

| Date | Change |
| --- | --- |
| 2026-09-20 | Story file authored during M5–M6 ticketisation; immediately marked `done` because ZER-91 was already merged. |

### File List

Shipped under `ddb121e` (PR #63), not by this story:

- `supabase/migrations/20260920180000_zer91_events_event_attendance.sql`
- `scripts/check-events-rls.harness.ts`
- `src/lib/db/events-schema.ts`, `src/lib/db/events-schema.test.ts`
- `src/lib/supabase/database.types.ts`
- `docs/roadmap/Seguridad RLS.md`
- `vitest.db-rls.config.ts`
