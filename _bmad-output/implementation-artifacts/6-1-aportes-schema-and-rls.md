# Story 6.1: `aportes` migration, nine-value tipo enum, and RLS

Status: backlog

## Linear

- **ZER-87** — Story 6.1: Migración `aportes` con enum tipo (9 valores) y RLS
- URL: https://linear.app/zerrant/issue/ZER-87
- Branch: `juantandil123/zer-87-story-61-migracion-aportes-con-enum-tipo-9-valores-y-rls`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- Unblocks M6 DoD bullet _"Se registra un aporte y aparece en el perfil."_ — nothing in the aportes half of the milestone can exist without this table.
- First story of the aportes half. Blocks 6.2, 6.3 and 6.4.

## Story

As a platform engineer,
I want the `aportes` table with the PRD's exact tipo enum and its RLS policies,
so that contributions are stored and read under real policy rather than rendered as placeholders.

## Acceptance Criteria

1. **Given** the PRD §6 draft and `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md`
   **When** the migration is applied
   **Then** `aportes` exists with `id` (uuid PK), `profile_id` uuid → `profiles.id`, `tipo`, `descripcion` (text), `monto` (numeric, **nullable**), `fecha` (date), `registrado_por` uuid → `profiles.id`, and `created_at` timestamptz (FR39)

2. **Given** the `tipo` enum
   **When** it is created
   **Then** it has **exactly nine** unaccented values in PRD order: `economico`, `donacion`, `prestamo`, `charla`, `actividad`, `mantenimiento`, `administracion`, `yerba`, `otro` — no more, no fewer (FR39, NFR15)

3. **Given** Puntos Serrano is parked in `docs/roadmap/Backlog.md`
   **When** the migration is written
   **Then** **no** `puntos` column is added — it stays commented out in the data model, and it is absent from the migration, from `database.types.ts`, and from any UI (FR39)

4. **Given** `monto`
   **When** an aporte is written without an amount
   **Then** the column stores `null`, not `0` — there is no `default 0`, because null means "no amount" and `0` would mean "an amount of zero" (FR39, FR40)

5. **Given** the tables exist
   **When** the migration finishes
   **Then** `alter table public.aportes enable row level security` **plus** the explicit policies ship in the same migration file (FR39, NFR13, NFR20)

6. **Given** the policy set
   **When** it is evaluated
   **Then** SELECT is allowed for serranos via `public.is_non_tourist()`; INSERT is allowed for the owner (`profile_id = auth.uid()`) **or** a platform admin via `public.is_platform_admin()`; there is **no** UPDATE and **no** DELETE policy, so both are denied (FR39, NFR14)

7. **Given** the ZER-49 default privileges
   **When** the table is created by this migration
   **Then** `pnpm db:check-grants` passes and the CI job `db grants (authenticated)` is green (FR39, NFR13)
   **And** `scripts/zer49-probe-new-table.sql` confirms locally that the freshly created table really inherited the grants (NFR13)

8. **Given** any policy that must look up a parent row
   **When** it is written
   **Then** it uses a `security definer` helper (the `public.is_platform_admin()` / `public.is_non_tourist()` pattern) rather than an inline subquery over the same table, and a policy test that actually writes proves no `42P17` recursion (NFR20, NFR11)

9. **Given** the policy harness pattern in `scripts/check-membership-request-rls.harness.ts`
   **When** the harness for this story runs
   **Then** it proves: a tourist can neither read nor write; a serrano can insert their own aporte; a platform admin can insert for another `profile_id`; a non-admin serrano cannot write someone else's; `monto` accepts null; `tipo` rejects a tenth value (NFR11, NFR14)

10. **Given** TDD is mandatory
    **When** the story is claimed done
    **Then** the failing harness case was written before the migration, and `pnpm test`, `pnpm typecheck` and `pnpm lint` are green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — Read the framework docs and the data model** (AC: 1–10)
  - [ ] This Next.js version has breaking changes vs. training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code (per `AGENTS.md`).
  - [ ] Read `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` end to end, including both ⚠️ sections.

- [ ] **T1 — RED: write the failing policy harness first** (AC: 6, 8, 9, 10)
  - [ ] New harness following `scripts/check-membership-request-rls.harness.ts`.
  - [ ] Cases: tourist read rejected; tourist write rejected; serrano self-insert OK; platform admin insert for another `profile_id` OK; non-admin serrano third-party insert rejected; `monto` null accepted; a tenth `tipo` value rejected; update rejected; delete rejected; no `42P17`.
  - [ ] Verify RED: the table does not exist yet.

- [ ] **T2 — GREEN: the migration** (AC: 1, 2, 3, 4, 5, 6, 8)
  - [ ] New file under `supabase/migrations/`, timestamped **after** `20260919143000_zer75_skills_catalog_seed.sql` (and after the M5 migrations if those landed first), named for ZER-87.
  - [ ] `create type public.aporte_tipo as enum (…)` with the nine values in PRD order.
  - [ ] `create table public.aportes` per AC 1. No `puntos`. No `default 0` on `monto`.
  - [ ] `alter table public.aportes enable row level security`, then the policies from AC 6.
  - [ ] Header comment stating the threat model: ungranted table → `42501`; missing `enable row level security` → contribution amounts world-readable and world-writable for every authenticated user, tourists included.

- [ ] **T3 — Grants verification** (AC: 7)
  - [ ] Run `pnpm db:check-grants` locally; confirm the CI job `db grants (authenticated)` is green.
  - [ ] Run `scripts/zer49-probe-new-table.sql` against a local database for `aportes`.
  - [ ] Do **not** re-run `GRANT … ON ALL TABLES` as a shortcut.

- [ ] **T4 — Types** (AC: 1, 2, 3, 10)
  - [ ] Regenerate `src/lib/supabase/database.types.ts` so `aportes` and `aporte_tipo` exist before stories 6.2–6.4 start.
  - [ ] Confirm the generated enum union has exactly nine members and no `puntos` field exists.
  - [ ] `pnpm typecheck` green.

- [ ] **T5 — Verify** (AC: 7, 9, 10)
  - [ ] `pnpm test` green.
  - [ ] `pnpm db:check-grants` green.
  - [ ] `pnpm typecheck && pnpm lint` green.

## Dev Notes

### Current state / problem

There is no `aportes` table. Aportes exist only as a greyed "Mis aportes" row in the serrano profile menu (`src/app/(app)/profile/SerranoMenu.tsx:62–67`) and a hardcoded `"Todavía no hay aportes."` line in plantel member detail (`src/features/plantel/MemberDetail.tsx:73`). `docs/roadmap/Seguridad RLS.md:17` carries the rule in prose — _"`aportes`: lee serranos; inserta dueño o admin (económicos → Tesorería)"_ — and it has never been a policy.

This table holds people's contribution amounts. Of all the tables in M5–M6, it is the one where "inherited DML but forgot `enable row level security`" is worst.

### Approach

One forward-only migration: the nine-value enum, the table, `enable row level security`, and all four policy decisions (read serranos, insert owner-or-admin, no update, no delete) in the same file. Then a policy harness that actually writes.

### The two guardrails that must both hold

**Grants rule.** In PostgREST, RLS is evaluated only **after** table privileges. If `authenticated` has no `GRANT`, PostgREST returns `42501 permission denied` and the policies **never run** — the request fails in a way that looks exactly like a policy bug. `supabase/migrations/20260919011500_zer49_default_privileges_for_role.sql` (ZER-49) declares `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public`, so tables created by later migrations inherit DML for `anon` / `authenticated` / `service_role`. **Those default privileges grant access to the table; they do not enable RLS.** Verify with `pnpm db:check-grants` (CI job `db grants (authenticated)`) and probe locally with `scripts/zer49-probe-new-table.sql`.

**Recursion rule.** A policy that reads its own table is the shape that caused **ZER-65**: a self-referencing subquery in a `membership_requests` policy re-triggered the policies on the same table and aborted every insert with `42P17 infinite recursion detected in policy for relation "membership_requests"`. The app mapped it to a generic error, so the whole tourist → serrano path was dead for every user and nobody noticed from the UI. `aportes` policies compare `profile_id` to `auth.uid()` and call two existing `security definer` helpers, so the direct risk is low — but any policy that grows a parent lookup must go through a `security definer` helper (`set search_path = ''`, tight `grant execute`), never an inline subquery, and must be covered by a test that actually writes.

### "admin" here means platform admin

| Milestone | "admin" means                                        | Helper                       |
| --------- | ---------------------------------------------------- | ---------------------------- |
| **M5**    | `project_members.rol='admin'` scoped by `project_id` | `public.is_project_admin()`  |
| **M6**    | `profiles.is_platform_admin`                         | `public.is_platform_admin()` |

Do not cross-wire them. In the aportes policies, "admin" is `public.is_platform_admin()` from `20260821223400_fix_rls_recursion_profiles.sql` — nothing project-scoped appears here.

_"Económicos → Tesorería"_ in `docs/roadmap/Seguridad RLS.md:17` is an **organizational convention**: Tesorería is a _rol_ in `profile_roles`, not a permission axis in the data model. M6 does not enforce it in a policy. Do not invent a Tesorería clause.

### No update, no delete — by design

The M6 scope bullets say nothing about editing or deleting an aporte. The decision recorded in the data model is: no policy, therefore denied. That is deliberate, not an omission to fill in. If the product wants an edit path, it is raised as a new requirement, not added here.

### `monto` is a ledger entry, never a charge

Nothing in this schema initiates, authorizes, or settles a payment. Aportes are **recorded, never charged** — this is the hard line of the milestone. No `pagado` flag, no `estado_pago`, no payment-provider reference column.

### Files to touch

| Area          | Path                                                                             | Notes                                                         |
| ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| NEW migration | `supabase/migrations/<ts>_zer87_aportes.sql`                                     | Enum, table, `enable row level security`, policies — one file |
| NEW harness   | `scripts/check-aportes-rls.harness.ts`                                           | Follows `check-membership-request-rls.harness.ts`             |
| Types         | `src/lib/supabase/database.types.ts`                                             | Regenerate — do not hand-edit                                 |
| Prior art     | `supabase/migrations/20260821223400_fix_rls_recursion_profiles.sql`              | `is_platform_admin()` definer pattern                         |
| Prior art     | `supabase/migrations/20260918220000_zer43_tarifa_hora_visibility.sql`            | `is_non_tourist()` definer pattern (lines 16–30)              |
| Prior art     | `supabase/migrations/20260919021000_zer65_membership_requests_rls_recursion.sql` | The `42P17` incident                                          |
| Grants tool   | `scripts/zer49-probe-new-table.sql`, `pnpm db:check-grants`                      | Must be green                                                 |

### Testing requirements

- **TDD mandatory (NFR11):** the failing harness case is written **before** the migration.
- The harness must **write**, not just read. A read-only probe cannot see `42P17` on an insert path and cannot see a missing INSERT grant.
- Authorization is enforced in the database (NFR14): every negative case asserts the database rejected the write.
- The tenth-`tipo`-value case is a real insert with a bogus value, proving the enum constrains it — not a TypeScript union check.
- The tourist **read** case matters as much as the write case: `aportes` holds amounts and `is_non_tourist()` is the only thing keeping tourists out.
- `pnpm test` and `pnpm db:check-grants` green before done.

### Out of scope

- Any UI. This story ships schema and policy only.
- `events` and `event_attendance` — story 6.5.
- Puntos Serrano and the `puntos` column — parked.
- Any payment, checkout, wallet or on-chain path — parked, and the hard line of this milestone.
- A Tesorería-specific policy clause.
- Update or delete policies for `aportes`.
- Reporting/aggregation of aportes into tier or rol — that is reporting semantics, not a schema constraint in M6.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** ship `create table` in one migration and `enable row level security` in another. Same file, always.
- **Do NOT** add a tenth `tipo` value, reorder the nine, or accent `economico` / `donacion` / `prestamo`.
- **Do NOT** add a `puntos` column "so it's ready later".
- **Do NOT** give `monto` a `default 0` or a `not null`.
- **Do NOT** add an UPDATE or DELETE policy.
- **Do NOT** re-run `GRANT … ON ALL TABLES IN SCHEMA public` — ZER-49 avoids it deliberately; it would undo the ZER-43 `tarifa_hora` mask.
- **Do NOT** use a project-scoped admin check here; M6 admin is `profiles.is_platform_admin`.
- **Do NOT** add a payment/charge column of any shape.
- **Do NOT** hand-edit `database.types.ts`.
- **Do NOT** accept a green `pnpm test` as proof of policy — the Vitest suite mocks Supabase.

### References

- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "`economico`, `donacion`, `prestamo`, `charla`, `actividad`, `mantenimiento`, `administracion`, `yerba`, `otro`. Nine, no more, no fewer, in that order."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "`aportes.monto` is **nullable**. … Do not default it to `0`; null means \"no amount\", `0` would mean \"an amount of zero\"."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "Inheriting DML without enabling RLS is the worst outcome: `aportes` — which holds people's contribution amounts — would be world-readable and world-writable for every authenticated user, tourists included."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "In M6, \"admin\" always means `profiles.is_platform_admin` … This differs from M5, where \"admin\" is scoped to a single project. Do not cross-wire them."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "`aportes` | UPDATE | Not in the milestone scope bullets — no policy, therefore denied. Raise it rather than inventing a rule"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "The `puntos` column on `aportes` **stays commented out** in the data model; do not add it to the migration, the types, or the UI."]
- [Source: `docs/roadmap/Seguridad RLS.md:17` — "`aportes`: lee serranos; inserta dueño o admin (económicos → Tesorería)."]
- [Source: `AGENTS.md` — "Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
