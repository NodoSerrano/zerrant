---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: ready-for-development
inputDocuments:
  - _bmad-output/specs/spec-m5-proyectos/SPEC.md
  - _bmad-output/specs/spec-m5-proyectos/screen-inventory.md
  - _bmad-output/specs/spec-m5-proyectos/data-model.md
  - _bmad-output/specs/spec-m6-aportes-eventos/SPEC.md
  - _bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md
  - _bmad-output/specs/spec-m6-aportes-eventos/data-model.md
  - docs/roadmap/M5 · Proyectos.md
  - docs/roadmap/M6 · Aportes y eventos.md
  - docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md
  - docs/roadmap/Seguridad RLS.md
  - docs/roadmap/Glosario.md
  - design/nodo-serrano.pen
---

# nodo - Epic Breakdown (M5 · Proyectos, M6 · Aportes y eventos)

## Overview

This document provides the complete epic and story breakdown for milestones **M5 · Proyectos** and **M6 · Aportes y eventos**, decomposing the requirements from `SPEC-m5-proyectos`, `SPEC-m6-aportes-eventos`, the PRD, and the RLS reference into implementable stories.

**Numbering:** `_bmad-output/planning-artifacts/epics.md` (the UI-fidelity M0–M2 breakdown) is a closed artifact ending at **FR26**, **NFR10**, and **UX-DR14**. This file continues from **FR27**, **NFR11**, and **UX-DR15** so identifiers never collide across the two files. Epic numbering continues from Epic 4 → **Epic 5** and **Epic 6**, matching the milestone numbers.

**Prerequisite that applies to every UI story:** the Pencil node ids for all M5 and M6 frames are unresolved (`TBD` in both `screen-inventory.md` files). Each UI story must resolve its frame's node id through the `mcp__pencil` tools before implementation begins. `design/nodo-serrano.pen` is encrypted and must never be opened with filesystem tools.

## Requirements Inventory

### Functional Requirements

**M5 · Proyectos**

FR27: `projects` and `project_members` tables exist with the PRD enums — `projects.estado` (`idea/en_curso/pausado/terminado`), `projects.ingreso` (`abierto/aprobacion`), `project_members.rol` (`miembro/admin`), `project_members.estado` (`pendiente/aprobado`) — and composite PK `(project_id, profile_id)`.
FR28: Project RLS is enabled with explicit policies: create = any serrano; edit config and approve joins = admins **of that project** (`project_members.rol='admin'` scoped by `project_id`); read = any authenticated user.
FR29: The Nodo hub Proyectos sub-tab (`2.4`) is a live route listing real projects, replacing the inert `<span … cursor-default>Proyectos</span>` at `src/app/(app)/nodo/tasks/page.tsx:84`.
FR30: The zero-project state matches Pencil frame `7.3 · Vacío Proyectos`.
FR31: Any serrano creates a project (`4.4`) with nombre, descripcion, `estado`, and `ingreso`; the creator is seated as `project_members` with `rol='admin'`, `estado='aprobado'` in the same transaction; tourists are blocked by RLS.
FR32: Project detail (`4.3`) shows nombre, descripcion, `estado`, the approved member list, and which members are admins; only `estado='aprobado'` rows count as members.
FR33: Joining follows the project's `ingreso` door — `abierto` writes `estado='aprobado'` immediately, `aprobacion` writes `estado='pendiente'` — and the door is enforced by an RLS `WITH CHECK` clause, not only by the server action.
FR34: A project admin works the join-request queue (`4.5`): sees `pendiente` rows for that project and approves (→ `aprobado`) or rejects (row removed); non-admins of that project cannot.
FR35: A project admin designates further admins by promoting an approved member to `project_members.rol='admin'`.
FR36: The serrano profile menu row "Mis proyectos" at `src/app/(app)/profile/SerranoMenu.tsx:55` is enabled, shows a real count, and navigates to the viewer's projects.
FR37: The "Proyectos" section of plantel member detail (`src/features/plantel/MemberDetail.tsx:78`) lists that member's approved projects instead of the hardcoded "Todavía no hay proyectos." line, and `src/features/plantel/MemberDetail.test.tsx:101` is updated accordingly.
FR38: The M5 DoD is demonstrated end-to-end on staging against real tables under RLS.

**M6 · Aportes y eventos**

FR39: The `aportes` table exists with `tipo` as exactly the nine PRD values (`economico, donacion, prestamo, charla, actividad, mantenimiento, administracion, yerba, otro`), nullable `monto`, `fecha`, `profile_id`, `registrado_por`; RLS enabled with explicit policies (read = serranos; insert = owner or platform admin).
FR40: An aporte is registered (`4.6`) with tipo, descripcion, fecha, and optional monto; self-load writes `profile_id = registrado_por = auth.uid()`; a platform admin can register for another `profile_id`; a non-admin cannot write someone else's aporte (enforced by RLS).
FR41: "Mis aportes" (`3.4`) lists the viewer's own aportes ordered by `fecha` with tipo, descripcion, fecha, and monto when present, plus a designed empty state; the "Mis aportes" row at `src/app/(app)/profile/SerranoMenu.tsx:64` is enabled with a real count.
FR42: The "Aportes" section of plantel member detail (`src/features/plantel/MemberDetail.tsx:72`) lists that member's real aportes instead of the "Todavía no hay aportes." placeholder, feeding M4's directory.
FR43: `events` (titulo, descripcion, lugar, inicio, fin, creado_por) and `event_attendance` (PK `event_id + profile_id`, `estado` enum `voy/quizas/no`) exist with RLS enabled and explicit policies, **and** the missing `event_attendance` rule is added to `docs/roadmap/Seguridad RLS.md`.
FR44: The agenda (`2.5`) renders a day strip and the selected day's events from the `events` table, replacing the ZER-50 stub at `src/app/(app)/agenda/page.tsx` while preserving the `/agenda` route and the `agenda` tab in `src/components/TabBar.tsx`.
FR45: The zero-event state matches Pencil frame `7.4 · Vacío Agenda`.
FR46: Any serrano creates an event (`5.2`) with titulo, descripcion, lugar, inicio, fin; `fin` is validated as not before `inicio`; tourists are blocked by RLS.
FR47: Event detail (`5.1`) shows the event fields and the attendee list grouped by RSVP `estado`, read from real `event_attendance` rows.
FR48: RSVP `voy` / `quizas` / `no` can be set and changed from event detail as an upsert on `(event_id, profile_id)`; a person can write only their own attendance row.
FR49: An event is edited or deleted (`5.3`) by its creator or a platform admin; delete cascades `event_attendance`; other serranos can do neither.
FR50: The M6 DoD is demonstrated end-to-end on staging against real tables under RLS.

### NonFunctional Requirements

NFR11: TDD mandatory (Vitest + Testing Library) — failing test first, then implementation; `pnpm test` green before any story is claimed done.
NFR12: Production-ready bar — no stubbed backends, no fake counts or attendee numbers, no "fix later" inside in-scope work. A screen is done only when it reads and writes real rows under real policy.
NFR13: Every new table enables RLS explicitly and ships its policies in the same migration; `pnpm db:check-grants` (CI job `db grants (authenticated)`) passes. Default privileges from ZER-49 grant table access — they do not enable RLS.
NFR14: Authorization is enforced in the database. Server actions may add ergonomics; a rule that exists only in a server action does not exist.
NFR15: Code identifiers in English; user-facing UI strings in Spanish as in Pencil; domain enum values in Spanish exactly as the PRD writes them (unaccented: `economico`, `donacion`, `prestamo`, `quizas`).
NFR16: `design/nodo-serrano.pen` is the sole visual SSOT. It is encrypted — access only via `mcp__pencil` tools, never `Read`/`bat`/`rg`. Each UI story resolves its frame's node id before implementation.
NFR17: Compose from the design-system primitives delivered by `SPEC-ui-fidelity-m0-m2`. New domain components (ProjectCard, AporteItem, EventCard) are shared components, not page-local CSS.
NFR18: Mobile-first composition; visual acceptance at ~390px width.
NFR19: No regression in auth, session, onboarding, profile, plantel, or tasks behavior. The Tareas half of the Nodo hub and no-JavaScript TabBar navigation must keep working.
NFR20: Migrations are forward-only, versioned, and timestamped; RLS policies live in migrations, never in application code. Policies that must read their own table use a `security definer` helper (the `public.is_platform_admin()` / `public.is_non_tourist()` pattern) to avoid the `42P17` recursion class that caused ZER-65.

### Additional Requirements

- Brownfield: Next.js App Router + TypeScript + Tailwind + Supabase SSR already running; M0–M4 shipped.
- Dead chrome to activate: Nodo hub Proyectos span, profile "Mis proyectos" and "Mis aportes" rows, member-detail Aportes/Proyectos placeholders, `/agenda` stub page.
- `src/features/plantel/MemberDetail.test.tsx:101` pins the current placeholder text and must be updated by stories 5.8 and 6.4.
- Existing helpers to reuse: `public.is_platform_admin()` (`20260821223400_fix_rls_recursion_profiles.sql`), `public.is_non_tourist()` (`20260918220000_zer43_tarifa_hora_visibility.sql`).
- Existing policy-test pattern to follow: `scripts/check-membership-request-rls.harness.ts`.
- Grants tooling: `pnpm db:check-grants`, `scripts/zer49-probe-new-table.sql`, migration `20260919011500_zer49_default_privileges_for_role.sql`.
- `3.4 · Mis aportes` was attempted in PR #27 (ZER-35), **closed without merging**. Story 6.3 is a clean story from scratch; the closed PR is at most a UI reference and is not reopened.
- Parked in `docs/roadmap/Backlog.md` ("No borrar: son decisiones tomadas de posponer"): Puntos Serrano, project budgets/invoicing, on-chain payments, push notifications, chat. None are implemented or scaffolded.
- The `puntos` column on `aportes` stays commented out in the data model.
- Aportes are **recorded, never charged** — no payment UI anywhere in M6.
- `events` has no `estado` column; the only `estado` in M6 is `event_attendance.estado`.

### UX Design Requirements

UX-DR15: Nodo hub segmented control — the Proyectos half becomes a live control with correct active-state treatment on both halves, per frame `2.4 · Nodo — Proyectos`.
UX-DR16: Zero-project empty state per frame `7.3 · Vacío Proyectos`.
UX-DR17: Project detail IA — estado, miembros, admins, and a single contextual join affordance — per frame `4.3 · Detalle de proyecto`.
UX-DR18: Create-project form IA, labels, enum selectors, and primary CTA per frame `4.4 · Crear proyecto`.
UX-DR19: Join-request queue with per-row approve/reject affordances per frame `4.5 · Solicitudes de ingreso`.
UX-DR20: Register-aporte form IA, tipo selector over the nine values, optional monto field, and primary CTA per frame `4.6 · Registrar aporte`.
UX-DR21: "Mis aportes" list rows and empty state per frame `3.4 · Mis aportes`.
UX-DR22: Agenda day strip and day-scoped event list per frame `2.5 · Agenda`.
UX-DR23: Zero-event empty state per frame `7.4 · Vacío Agenda`.
UX-DR24: Event detail with attendee list grouped by RSVP and the viewer's own RSVP control per frame `5.1 · Detalle de evento`.
UX-DR25: Create-event form IA, datetime controls, and primary CTA per frame `5.2 · Crear evento`.
UX-DR26: Edit-event form with prefilled values and the delete affordance per frame `5.3 · Editar evento`.
UX-DR27: **Node ids are `TBD`.** Every UI story resolves its frame's node id via `mcp__pencil` (`get_app_state` / design-context tooling) and records it back into the relevant `screen-inventory.md` before implementation. A UI story without its resolved node id is not ready for development.
UX-DR28: Acceptance method — Pencil frame vs live route at ~390px; fail on IA, primary-CTA placement, or key-copy divergence; minor subpixel differences OK. Additionally, fail if any activated control still renders in its disabled/placeholder form.

### FR Coverage Map

FR27: Epic 5 — Story 5.1 (`projects` + `project_members` schema and enums)
FR28: Epic 5 — Story 5.1 (project RLS policies + grants check)
FR29: Epic 5 — Story 5.2 (Proyectos sub-tab live)
FR30: Epic 5 — Story 5.2 (empty state `7.3`)
FR31: Epic 5 — Story 5.3 (create project, creator seated as admin)
FR32: Epic 5 — Story 5.4 (project detail)
FR33: Epic 5 — Story 5.5 (join semantics `abierto` / `aprobacion`)
FR34: Epic 5 — Story 5.6 (join-request queue)
FR35: Epic 5 — Story 5.7 (designate project admins)
FR36: Epic 5 — Story 5.8 (profile "Mis proyectos" row)
FR37: Epic 5 — Story 5.8 (member-detail Proyectos section + test update)
FR38: Epic 5 — Story 5.9 (M5 DoD on staging)
FR39: Epic 6 — Story 6.1 (`aportes` schema, nine-value enum, RLS)
FR40: Epic 6 — Story 6.2 (register aporte, own and admin load)
FR41: Epic 6 — Story 6.3 (Mis aportes `3.4` + profile row)
FR42: Epic 6 — Story 6.4 (aportes in member detail)
FR43: Epic 6 — Story 6.5 (`events` + `event_attendance` schema, RLS, and the Seguridad RLS.md bullet)
FR44: Epic 6 — Story 6.6 (agenda day strip, stub replaced)
FR45: Epic 6 — Story 6.6 (empty state `7.4`)
FR46: Epic 6 — Story 6.7 (create event)
FR47: Epic 6 — Story 6.8 (event detail + attendee list)
FR48: Epic 6 — Story 6.9 (RSVP voy/quizas/no)
FR49: Epic 6 — Story 6.10 (edit/delete event)
FR50: Epic 6 — Story 6.11 (M6 DoD on staging)

## Epic List

### Epic 5: Proyectos

Serranos create community projects with two membership doors (`abierto` / `aprobacion`), project admins govern joins and admin designation, and every person's projects surface on their profile and in the plantel directory — replacing the dead Proyectos chrome left by M0–M2.
**FRs covered:** FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38

### Epic 6: Aportes y eventos

Serranos register aportes that show on their profile and in member detail, and the node runs a real agenda — create, browse by day, open, RSVP, edit, delete — replacing the `/agenda` stub. Aportes are recorded, never charged.
**FRs covered:** FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47, FR48, FR49, FR50

## Epic 5: Proyectos

Serranos create and join community projects; project admins hold the approval gate; projects become visible wherever identity lives.

### Story 5.1: `projects` and `project_members` migration, enums, and RLS

As a platform engineer,
I want `projects` and `project_members` created with the PRD enums, RLS enabled, and verified grants,
So that every projects screen reads and writes real rows under real policy instead of placeholder data.

**Acceptance Criteria:**

**Given** the PRD §6 draft and `_bmad-output/specs/spec-m5-proyectos/data-model.md`
**When** the migration is applied
**Then** `projects` exists with `id`, `nombre`, `descripcion`, `estado` enum (`idea`, `en_curso`, `pausado`, `terminado`, default `idea`), `ingreso` enum (`abierto`, `aprobacion`, default `aprobacion`), `creado_por` → `profiles.id`, and `created_at` (FR27)
**And** `project_members` exists with `project_id` → `projects.id`, `profile_id` → `profiles.id`, `rol` enum (`miembro`, `admin`, default `miembro`), `estado` enum (`pendiente`, `aprobado`, default `pendiente`), and composite primary key `(project_id, profile_id)` (FR27)
**And** both tables have `enable row level security` plus explicit policies in the same migration: read for any authenticated user; insert on `projects` for any serrano via `public.is_non_tourist()`; update on `projects` and update/delete on `project_members` only for a `rol='admin'`, `estado='aprobado'` member of that same `project_id` (FR28, NFR14)
**And** the project-admin check is implemented as a `security definer` helper function rather than an inline subquery over `project_members`, and a policy test proves no `42P17` recursion on any path (NFR20)
**And** `pnpm db:check-grants` passes and the CI job `db grants (authenticated)` is green (FR28, NFR13)
**And** a policy harness following `scripts/check-membership-request-rls.harness.ts` proves a serrano can insert a project, a tourist cannot, and a non-admin of a project cannot update its config (NFR11, NFR14)

### Story 5.2: Nodo Proyectos sub-tab and empty state

As a member browsing the Nodo,
I want the Proyectos half of the segmented control to open a real list of projects,
So that the hub stops showing a control that does nothing.

**Acceptance Criteria:**

**Given** Pencil frames `2.4 · Nodo — Proyectos` and `7.3 · Vacío Proyectos`, with their node ids resolved via `mcp__pencil` and recorded in `screen-inventory.md` (UX-DR27, NFR16)
**When** I tap "Proyectos" in the Nodo hub
**Then** the inert `<span className="… cursor-default">Proyectos</span>` at `src/app/(app)/nodo/tasks/page.tsx:84` is gone and the control navigates to the projects route (FR29)
**And** the projects list renders real rows from the `projects` table, matching the Pencil frame at ~390px (FR29, UX-DR15, UX-DR28)
**And** the Tareas/Proyectos control keeps its active-state treatment on both routes, and the Tareas list behaves exactly as before (NFR19)
**And** with no visible projects the screen matches frame `7.3 · Vacío Proyectos` (FR30, UX-DR16)
**And** tests cover the list render, the empty branch, and the segmented-control navigation; `pnpm test` passes (NFR11)

### Story 5.3: Create project

As a serrano with an initiative,
I want to create a project with a nombre, descripcion, estado, and ingreso door,
So that other serranos can find it and join it.

**Acceptance Criteria:**

**Given** Pencil frame `4.4 · Crear proyecto` with its node id resolved via `mcp__pencil` (UX-DR27)
**When** I submit the create-project form as a serrano
**Then** the form collects nombre, descripcion, an `estado` selector over `idea/en_curso/pausado/terminado`, and an `ingreso` selector over `abierto/aprobacion`, matching the Pencil frame at ~390px (FR31, UX-DR18, UX-DR28)
**And** a `projects` row is inserted with `creado_por` = my profile id (FR31)
**And** a `project_members` row is written for me with `rol='admin'` and `estado='aprobado'` in the same transaction (FR31)
**And** the new project appears immediately in the Proyectos list and its detail route resolves (FR31)
**And** a tourist attempting the same insert is rejected by RLS, not only hidden by the UI (FR31, NFR14)
**And** tests cover a successful create, the creator-admin seating, validation of required fields, and the tourist rejection (NFR11, NFR12)

### Story 5.4: Project detail

As a member,
I want to open a project and see its estado, members, and admins,
So that I can understand what it is and who runs it before deciding to join.

**Acceptance Criteria:**

**Given** Pencil frame `4.3 · Detalle de proyecto` with its node id resolved via `mcp__pencil` (UX-DR27)
**When** I open a project's detail route
**Then** the screen renders nombre, descripcion, `estado`, the list of members, and which of them are admins, matching the Pencil frame at ~390px (FR32, UX-DR17, UX-DR28)
**And** only `project_members` rows with `estado='aprobado'` are rendered as members — `pendiente` rows never appear in the member list (FR32)
**And** members are composed from existing design-system primitives (Avatar, Chip/RoleChip) rather than page-local styling (NFR17)
**And** the join affordance is contextual: "Unirse" for an `ingreso='abierto'` project, "Solicitar ingreso" for `aprobacion`, a pending indicator when I already have a `pendiente` row, and no affordance when I am already an approved member (FR32)
**And** tests cover each of those four viewer states and the exclusion of `pendiente` rows from the member list (NFR11)

### Story 5.5: Join a project — `abierto` immediate vs `aprobacion` pending

As a serrano who found a project,
I want joining to be immediate on an open project and a request on an approval project,
So that the project's chosen door actually governs who gets in.

**Acceptance Criteria:**

**Given** a project with `ingreso='abierto'`
**When** I tap "Unirse"
**Then** a `project_members` row is written with `estado='aprobado'` and I appear in the member list without any admin action (FR33)

**Given** a project with `ingreso='aprobacion'`
**When** I tap "Solicitar ingreso"
**Then** a `project_members` row is written with `estado='pendiente'`, I do not appear in the member list, and the detail screen shows my pending state (FR33)
**And** the request appears in that project's join-request queue (FR33, FR34)

**Given** a client that bypasses the server action
**When** it attempts to insert `estado='aprobado'` into a project whose `ingreso='aprobacion'`
**Then** the insert is rejected by the RLS `WITH CHECK` clause, which reads the parent project's `ingreso` (FR33, NFR14)
**And** a second join attempt on the same project collides on the composite primary key rather than creating a duplicate row (FR27)
**And** a policy test covers both doors and the bypass attempt; `pnpm test` passes (NFR11, NFR12)

### Story 5.6: Join-request queue

As a project admin,
I want a queue of people asking to join my project,
So that I can approve or reject each request.

**Acceptance Criteria:**

**Given** Pencil frame `4.5 · Solicitudes de ingreso` with its node id resolved via `mcp__pencil` (UX-DR27)
**When** I open the queue as an admin of that project
**Then** I see the `project_members` rows with `estado='pendiente'` for that project, with per-row approve and reject affordances, matching the Pencil frame at ~390px (FR34, UX-DR19, UX-DR28)
**And** approving sets `estado='aprobado'` and the person appears in the project detail member list (FR34)
**And** rejecting removes the `pendiente` row, and the person may request again (FR34)
**And** a serrano who is not an admin of that project cannot open the queue or perform either action — enforced by RLS, not only by route guarding (FR34, NFR14)
**And** the admin check is scoped to that `project_id` and does not silently accept `profiles.is_platform_admin` (FR28)
**And** tests cover approve, reject, the empty queue, and the non-admin rejection (NFR11)

### Story 5.7: Designate project admins

As a project admin,
I want to promote an approved member to admin,
So that I am not the only person who can govern the project.

**Acceptance Criteria:**

**Given** a project where I hold `rol='admin'`, `estado='aprobado'`
**When** I promote an approved member from the project detail screen
**Then** their `project_members.rol` changes from `miembro` to `admin` (FR35)
**And** they immediately gain access to the join-request queue and project config editing (FR34, FR28)
**And** they are shown as an admin in the project detail member list (FR32)
**And** a `miembro`, a `pendiente` row, and a non-member each cannot perform the promotion — enforced by RLS (FR35, NFR14)
**And** demotion is out of scope and is not implemented; if a frame implies it, it is raised rather than invented (FR35)
**And** tests cover a successful promotion and each unauthorized actor (NFR11)

### Story 5.8: Projects on profile and member detail

As a serrano,
I want my projects visible on my profile and on my plantel card,
So that what I work on is part of who I am in the node.

**Acceptance Criteria:**

**Given** the greyed row at `src/app/(app)/profile/SerranoMenu.tsx:55`
**When** I open my profile
**Then** the "Mis proyectos" row is enabled, shows a real count of my approved projects instead of the `—` placeholder, and navigates to my projects (FR36, NFR12)

**Given** the hardcoded "Todavía no hay proyectos." line at `src/features/plantel/MemberDetail.tsx:78`
**When** I open a member's detail in the plantel
**Then** the "Proyectos" section lists that member's `estado='aprobado'` projects (FR37)
**And** a member with no approved projects still renders a sensible empty line rather than a broken section (FR37)
**And** `src/features/plantel/MemberDetail.test.tsx:101` — the `renders empty aportes and proyectos previews` case that pins `"Todavía no hay proyectos."` — is updated to assert the new behavior (FR37, NFR11)
**And** no regression in the rest of member detail (roles, skills, tarifa visibility) (NFR19)
**And** `pnpm test` passes (NFR11)

### Story 5.9: QA — M5 DoD end-to-end on staging

As the product owner,
I want the M5 Done criteria demonstrated on staging with real accounts,
So that the milestone is closed on evidence, not on merged PRs.

**Acceptance Criteria:**

**Given** stories 5.1–5.8 deployed to staging against the real tables under RLS
**When** serrano A creates a project with `ingreso='aprobacion'`, serrano B requests to join, and serrano A approves from the queue
**Then** _"Un serrano crea un proyecto por aprobación; otro solicita y el admin lo aprueba."_ is satisfied and B appears in the project member list (FR38)

**Given** a project with `ingreso='abierto'`
**When** serrano B taps "Unirse"
**Then** _"En un proyecto abierto, unirse es inmediato."_ is satisfied — B is an approved member with no admin action (FR38)
**And** every in-scope Pencil frame (`2.4`, `4.3`, `4.4`, `4.5`, `7.3`) is compared against its live route at ~390px and accepted (FR38, UX-DR28)
**And** the Nodo Proyectos control, the profile "Mis proyectos" row, and the member-detail "Proyectos" section all show real data — no dead chrome remains in the projects surface (FR29, FR36, FR37, NFR12)
**And** `pnpm test` and `pnpm db:check-grants` are green on the deployed commit (NFR11, NFR13)

## Epic 6: Aportes y eventos

Contributions become a real ledger on the profile and in the directory; the agenda becomes a real calendar with RSVP. Aportes are recorded, never charged.

### Story 6.1: `aportes` migration, nine-value tipo enum, and RLS

As a platform engineer,
I want the `aportes` table with the PRD's exact tipo enum and its RLS policies,
So that contributions are stored and read under real policy rather than rendered as placeholders.

**Acceptance Criteria:**

**Given** the PRD §6 draft and `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md`
**When** the migration is applied
**Then** `aportes` exists with `id`, `profile_id` → `profiles.id`, `tipo`, `descripcion`, `monto` (numeric, **nullable**), `fecha` (date), `registrado_por` → `profiles.id`, and `created_at` (FR39)
**And** the `tipo` enum has **exactly nine** unaccented values in PRD order: `economico`, `donacion`, `prestamo`, `charla`, `actividad`, `mantenimiento`, `administracion`, `yerba`, `otro` (FR39, NFR15)
**And** no `puntos` column is added — it stays commented out in the data model until Puntos Serrano leaves the backlog (FR39)
**And** RLS is enabled with explicit policies in the same migration: read for serranos via `public.is_non_tourist()`; insert for the owner (`profile_id = auth.uid()`) or a platform admin via `public.is_platform_admin()`; no update or delete policy, so both are denied (FR39, NFR14)
**And** `pnpm db:check-grants` passes and the CI job `db grants (authenticated)` is green (FR39, NFR13)
**And** a policy harness proves a tourist can neither read nor write, a serrano can insert their own aporte, a platform admin can insert for another `profile_id`, a non-admin serrano cannot, `monto` accepts null, and `tipo` rejects a tenth value (NFR11, NFR14)

### Story 6.2: Register aporte

As a serrano,
I want to register a contribution I made,
So that my aportes are on record and back my tier and rol.

**Acceptance Criteria:**

**Given** Pencil frame `4.6 · Registrar aporte` with its node id resolved via `mcp__pencil` (UX-DR27)
**When** I submit the register-aporte form for myself
**Then** the form collects tipo (selector over the nine values), descripcion, fecha, and an optional monto, matching the Pencil frame at ~390px (FR40, UX-DR20, UX-DR28)
**And** an `aportes` row is written with `profile_id = registrado_por = my profile id` (FR40)
**And** leaving monto empty stores `null`, not `0` (FR40, FR39)
**And** the screen contains no payment, checkout, or "pagar" affordance — the aporte is recorded, never charged (FR40, NFR12)

**Given** I am a platform admin
**When** I register an aporte on behalf of another serrano
**Then** the row is written with `profile_id` = that person and `registrado_por` = me (FR40)
**And** a serrano who is not a platform admin cannot write an aporte for someone else — rejected by RLS, not only hidden by the UI (FR40, NFR14)
**And** tests cover self-load, admin-load, the null monto, and the unauthorized third-party write (NFR11)

### Story 6.3: Mis aportes

As a serrano,
I want a screen listing my own aportes,
So that I can see my contribution history in one place.

**Acceptance Criteria:**

**Given** Pencil frame `3.4 · Mis aportes` with its node id resolved via `mcp__pencil`, built as a **clean story from scratch** against the real `aportes` table — PR #27 (ZER-35) was closed without merging and is at most a UI reference, not a base to reopen or cherry-pick (UX-DR27, FR41)
**When** I open my aportes from the profile
**Then** the screen lists my own aportes ordered by `fecha`, showing tipo, descripcion, fecha, and monto when present, matching the Pencil frame at ~390px (FR41, UX-DR21, UX-DR28)
**And** an aporte with no monto renders without an empty or zeroed amount slot (FR41)
**And** with no aportes the screen renders the designed empty state (FR41, UX-DR21)
**And** the greyed "Mis aportes" row at `src/app/(app)/profile/SerranoMenu.tsx:64` is enabled, shows a real count instead of the `—` placeholder, and navigates here (FR41, NFR12)
**And** the list is composed from a shared AporteItem component rather than page-local styling (NFR17)
**And** tests cover the populated list, the null-monto row, the empty state, and the profile row count; `pnpm test` passes (NFR11)

### Story 6.4: Aportes in member detail

As a serrano browsing the plantel,
I want to see another member's aportes on their detail screen,
So that the directory reflects what people actually contribute.

**Acceptance Criteria:**

**Given** the hardcoded "Todavía no hay aportes." line at `src/features/plantel/MemberDetail.tsx:72`
**When** I open a member's detail in the plantel
**Then** the "Aportes" section lists that member's real aportes (FR42)
**And** a member with no aportes still renders a sensible empty line rather than a broken section (FR42)
**And** aportes read follows the serrano-only read policy — a tourist viewing the app sees no aportes data (FR39, NFR14)
**And** `src/features/plantel/MemberDetail.test.tsx:101` — the `renders empty aportes and proyectos previews` case that pins `"Todavía no hay aportes."` — is updated to assert the new behavior (FR42, NFR11)
**And** no regression in the rest of member detail (roles, skills, tarifa visibility, and the Proyectos section from story 5.8) (NFR19)
**And** `pnpm test` passes (NFR11)

### Story 6.5: `events` and `event_attendance` migration, RSVP enum, RLS, and the Seguridad RLS.md rule

As a platform engineer,
I want the events tables with their policies **and** the missing `event_attendance` rule written into the RLS reference,
So that the agenda runs on real policy and the security reference stays the complete picture.

**Acceptance Criteria:**

**Given** the PRD §6 draft and `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md`
**When** the migration is applied
**Then** `events` exists with `id`, `titulo`, `descripcion`, `lugar`, `inicio` (timestamptz), `fin` (timestamptz), `creado_por` → `profiles.id`, and `created_at`, and has **no** `estado` column (FR43)
**And** `event_attendance` exists with `event_id` → `events.id`, `profile_id` → `profiles.id`, `estado` enum (`voy`, `quizas`, `no` — unaccented), and composite primary key `(event_id, profile_id)` (FR43, NFR15)
**And** the `event_attendance.event_id` foreign key declares `on delete cascade` explicitly (FR43, FR49)
**And** RLS is enabled with explicit policies in the same migration: `events` read for any authenticated user, insert for any serrano, update/delete for `creado_por = auth.uid()` or `public.is_platform_admin()`; `event_attendance` read for any authenticated user, insert/update/delete for the **own row only** (`profile_id = auth.uid()`) (FR43, NFR14)
**And** `docs/roadmap/Seguridad RLS.md` — which today has **no** `event_attendance` rule, only the PRD prose _"cada uno gestiona su propia asistencia"_ — gains an `event_attendance` bullet next to the `events` bullet stating that each person manages their own attendance row (FR43)
**And** `pnpm db:check-grants` passes and the CI job `db grants (authenticated)` is green (FR43, NFR13)
**And** a policy harness proves a serrano can create an event, a tourist cannot, a non-creator non-admin serrano cannot update or delete, deleting an event removes its attendance rows, and a person cannot write another person's attendance row (NFR11, NFR14)

### Story 6.6: Agenda day strip and empty state

As a member,
I want an agenda that shows the node's events by day,
So that `/agenda` stops being a placeholder that apologizes for itself.

**Acceptance Criteria:**

**Given** Pencil frames `2.5 · Agenda` and `7.4 · Vacío Agenda` with their node ids resolved via `mcp__pencil` (UX-DR27)
**When** I open `/agenda`
**Then** the ZER-50 stub copy in `src/app/(app)/agenda/page.tsx` — _"La agenda de eventos llega en un milestone posterior…"_ — is deleted, not hidden or conditionally rendered (FR44, NFR12)
**And** the screen renders a day strip plus the selected day's events read from the `events` table, matching the Pencil frame at ~390px (FR44, UX-DR22, UX-DR28)
**And** selecting a different day in the strip updates the listed events (FR44)
**And** with no events the screen matches frame `7.4 · Vacío Agenda` (FR45, UX-DR23)
**And** the `/agenda` route and the `agenda` tab in `src/components/TabBar.tsx` still work, including navigation without JavaScript (FR44, NFR19)
**And** tests cover the day strip, day selection, the populated list, and the empty branch; `pnpm test` passes (NFR11)

### Story 6.7: Create event

As a serrano,
I want to create an event,
So that the node can gather around it.

**Acceptance Criteria:**

**Given** Pencil frame `5.2 · Crear evento` with its node id resolved via `mcp__pencil` (UX-DR27)
**When** I submit the create-event form as a serrano
**Then** the form collects titulo, descripcion, lugar, inicio, and fin, matching the Pencil frame at ~390px (FR46, UX-DR25, UX-DR28)
**And** an `events` row is written with `creado_por` = my profile id (FR46)
**And** submitting a `fin` earlier than `inicio` is rejected with a clear message and no row is written (FR46)
**And** the new event appears on its day in the agenda immediately and its detail route resolves (FR46, FR44)
**And** a tourist attempting the same insert is rejected by RLS, not only hidden by the UI (FR46, NFR14)
**And** tests cover a successful create, the `fin`/`inicio` validation, and the tourist rejection (NFR11)

### Story 6.8: Event detail and attendee list

As a member,
I want to open an event and see who is coming,
So that I can decide whether to go.

**Acceptance Criteria:**

**Given** Pencil frame `5.1 · Detalle de evento` with its node id resolved via `mcp__pencil` (UX-DR27)
**When** I open an event's detail route
**Then** the screen renders titulo, descripcion, lugar, inicio, and fin, matching the Pencil frame at ~390px (FR47, UX-DR24, UX-DR28)
**And** the attendee list is grouped by RSVP `estado` (`voy`, `quizas`, `no`) and read from real `event_attendance` rows — never a count computed or faked on the client (FR47, NFR12)
**And** the event's creator is identifiable on the screen (FR47)
**And** attendees are composed from existing design-system primitives (Avatar, Chip) rather than page-local styling (NFR17)
**And** an event with no RSVPs renders an empty attendee state rather than a broken section (FR47)
**And** tests cover the grouped list, the creator affordance, and the no-RSVP branch (NFR11)

### Story 6.9: RSVP — voy / quizás / no

As a serrano,
I want to confirm whether I am going to an event and change my mind later,
So that the organizer knows who to expect.

**Acceptance Criteria:**

**Given** an event detail screen and a signed-in serrano
**When** I choose `voy`, `quizas`, or `no`
**Then** an `event_attendance` row is upserted on the primary key `(event_id, profile_id)` with that `estado` (FR48)
**And** changing my answer updates that one row rather than creating a second (FR48, FR43)
**And** my current RSVP is visible on the detail screen and the attendee list reflects the change (FR48, FR47)
**And** a client attempting to write or modify another person's attendance row is rejected by RLS (FR48, NFR14)
**And** the UI labels may be accented Spanish ("quizás") while the stored enum value stays `quizas` (NFR15)
**And** tests cover setting, changing, and the unauthorized third-party write; `pnpm test` passes (NFR11)

### Story 6.10: Edit and delete event

As an event creator or a platform admin,
I want to edit or delete an event,
So that wrong details and cancelled plans do not stay on the agenda.

**Acceptance Criteria:**

**Given** Pencil frame `5.3 · Editar evento` with its node id resolved via `mcp__pencil` (UX-DR27)
**When** I open the edit screen as the event's creator or as a platform admin
**Then** the form prefills the event's current titulo, descripcion, lugar, inicio, and fin, and the delete affordance is present, matching the Pencil frame at ~390px (FR49, UX-DR26, UX-DR28)
**And** saving persists the changes and the agenda and detail reflect them (FR49)
**And** the `fin` not-before-`inicio` validation from story 6.7 applies on edit too (FR46)
**And** deleting removes the event and cascades its `event_attendance` rows; the event disappears from the agenda and its detail route no longer resolves (FR49, FR43)
**And** a serrano who is neither the creator nor a platform admin can neither edit nor delete — rejected by RLS, not only by route guarding (FR49, NFR14)
**And** tests cover prefill, save, delete with cascade, and the unauthorized actor (NFR11)

### Story 6.11: QA — M6 DoD end-to-end on staging

As the product owner,
I want the M6 Done criteria demonstrated on staging with real accounts,
So that the milestone is closed on evidence, not on merged PRs.

**Acceptance Criteria:**

**Given** stories 6.1–6.10 deployed to staging against the real tables under RLS
**When** a serrano registers an aporte and opens their profile
**Then** _"Se registra un aporte y aparece en el perfil."_ is satisfied — the aporte appears in "Mis aportes" and in that person's plantel member detail (FR50, FR41, FR42)

**Given** a serrano creates an event and others respond
**When** serranos B and C set their RSVP and anyone opens the event
**Then** _"Se crea un evento, la gente confirma y se ve la lista de asistentes."_ is satisfied — the attendee list shows B and C under their chosen `estado` (FR50, FR47, FR48)
**And** every in-scope Pencil frame (`4.6`, `3.4`, `2.5`, `5.1`, `5.2`, `5.3`, `7.4`) is compared against its live route at ~390px and accepted (FR50, UX-DR28)
**And** `/agenda` no longer serves the ZER-50 stub copy, and the profile "Mis aportes" row and member-detail "Aportes" section show real data (FR44, FR41, FR42, NFR12)
**And** no payment, checkout, or charging affordance exists anywhere in the aportes surface (NFR12)
**And** `docs/roadmap/Seguridad RLS.md` contains the `event_attendance` bullet (FR43)
**And** `pnpm test` and `pnpm db:check-grants` are green on the deployed commit (NFR11, NFR13)
