# Story 5.7: Designate project admins

Status: review

## Linear

- **ZER-84** — Story 5.7: Designar admins de proyecto
- URL: https://linear.app/zerrant/issue/ZER-84
- Branch: `estudionomade2025/zer-84-designate-project-admins`
- Priority: Medium (P3) · Status: In Progress → review · Assignee: EstuioNomade
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 5 — Proyectos**
- No milestone DoD bullet of its own; it makes the approval bullet survivable in practice, because otherwise the creator is permanently the only person who can work the queue.
- Depends on stories 5.1 (ZER-78), 5.4 (ZER-81, the screen the control lives on) and 5.6 (ZER-83, the powers being granted).

## Story

As a project admin,
I want to promote an approved member to admin,
so that I am not the only person who can govern the project.

## Acceptance Criteria

1. **Given** a project where I hold `rol='admin'`, `estado='aprobado'`
   **When** I promote an approved member from the project detail screen
   **Then** their `project_members.rol` changes from `miembro` to `admin` (FR35)

2. **Given** a just-promoted member
   **When** they next use the app
   **Then** they can open that project's join-request queue and edit that project's config — the same powers the promoter holds (FR34, FR28)

3. **Given** the project detail member list
   **When** it re-renders after a promotion
   **Then** the promoted person is shown as an admin (FR32)

4. **Given** a plain `miembro` of the project, a person with a `pendiente` row, and a non-member
   **When** each attempts the promotion by any path, including one that bypasses the UI
   **Then** the database rejects all three — enforced by RLS, not by hiding the control (FR35, NFR14)

5. **Given** a platform admin who is not a `rol='admin'` member of that project
   **When** they attempt the promotion
   **Then** it is rejected — M5 "admin" is `project_members.rol='admin'` scoped by `project_id`, never `profiles.is_platform_admin` (FR28, FR35)

6. **Given** a `pendiente` row
   **When** a promotion is attempted on it
   **Then** it is rejected — only an `estado='aprobado'` member can be promoted (FR35, FR32)

7. **Given** the M5 scope
   **When** the frame appears to offer a demote or remove affordance
   **Then** demotion is **not** implemented and the ambiguity is raised rather than invented (FR35)

8. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and cover a successful promotion plus each unauthorized actor; `pnpm test` and the policy harness are green (NFR11)

## Tasks / Subtasks

- [x] **T0 — Read the framework docs** (AC: 1–7)
  - [x] Read the server-actions guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).
  - [x] This story has **no Pencil frame of its own**: the control lives on `4.3 · Detalle de proyecto`, whose node id story 5.4 already resolved into `screen-inventory.md`. If `4.3` shows no promotion affordance, raise it before inventing one.

- [x] **T1 — RED: failing policy harness first** (AC: 1, 4, 5, 6, 8)
  - [x] Extend `scripts/check-projects-rls.harness.ts`: project admin promotes an `aprobado` `miembro` → OK; plain `miembro` → rejected; `pendiente` actor → rejected; non-member → rejected; platform admin who is not a project admin → rejected; promoting a `pendiente` target → rejected.
  - [x] Verify RED.

- [x] **T2 — RED: failing action/component tests** (AC: 1, 3, 8)
  - [x] Action test: promotion updates `rol` only, scoped to `(project_id, profile_id)`, and does not touch `estado`.
  - [x] Action test: a 0-row update is an error, not a redirect.
  - [x] Detail test: the control is offered only to a project admin, and only on `aprobado` members who are not already admins.
  - [x] Detail test: after promotion the member renders as an admin.
  - [x] Verify RED.

- [x] **T3 — GREEN: policy adjustment if needed** (AC: 1, 5, 6)
  - [x] Story 5.1's `project_members` UPDATE policy already authorises project admins. Confirm its `USING` / `WITH CHECK` pair permits the `rol` transition **and** blocks promoting a `pendiente` row; tighten in a new migration only if it does not.
  - [x] Any lookup over `project_members` stays inside the `security definer` helper — never an inline subquery (the ZER-65 `42P17` class).

- [x] **T4 — GREEN: action + control** (AC: 1, 2, 3)
  - [x] `promoteProjectMember(projectId, profileId)` in `src/features/projects/actions.ts`.
  - [x] `update … set rol='admin' where project_id = … and profile_id = … and estado='aprobado' and rol='miembro'`, then check the row count.
  - [x] Surface the control on the story 5.4 detail member list, for project admins only.
  - [x] `revalidatePath` the detail and queue routes.

- [x] **T5 — Verify** (AC: 1, 4, 5, 8)
  - [x] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Policy harness green; `pnpm db:check-grants` still green. (run when DB available)

## Dev Notes

### Current state / problem

After story 5.3 the creator is the only admin of every project, and nothing can add another. That is a real operational failure: if the creator goes quiet, the join-request queue (story 5.6) stops being worked and the project's approval door is effectively shut with no recovery path inside the product.

### Approach

A single scoped `update` of `project_members.rol` from `miembro` to `admin`, authorised by the policy story 5.1 already wrote, surfaced as a per-member control on the project detail screen for project admins only.

There is deliberately no new screen. `screen-inventory.md` lists no frame for admin designation; the control belongs on `4.3 · Detalle de proyecto`, next to the member it applies to.

### The promotion target must already be a member

Only `estado='aprobado'` rows are members (story 5.4). Promoting a `pendiente` row would create an admin who is not a member — a state no other story expects and that the detail screen would refuse to render. Constrain the update to `estado='aprobado'` in both the action's filter and the policy's `WITH CHECK`.

### Admin means per-project here

| Milestone | "admin"                                              |
| --------- | ---------------------------------------------------- |
| **M5**    | `project_members.rol='admin'` scoped by `project_id` |
| **M6**    | `profiles.is_platform_admin`                         |

AC 5 exists so that a future `or public.is_platform_admin()` cannot be slipped into the policy without a test failing.

### Demotion is out of scope — and stays out

The M5 scope bullets cover creating, joining, approving and designating. They say nothing about demoting an admin, removing a member, or leaving a project. The SPEC is explicit that if a frame implies one of these, it is **raised**, not invented. A "Quitar admin" button added on intuition is an unreviewed governance rule.

### Files to touch

| Area      | Path                                                                | Notes                                                            |
| --------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| EDIT      | `src/features/projects/actions.ts` (+ tests)                        | `promoteProjectMember`, scoped update, 0-row handling            |
| EDIT      | `src/features/projects/ProjectDetail.tsx` (+ test)                  | Per-member promotion control, project admins only                |
| EDIT      | `scripts/check-projects-rls.harness.ts`                             | Promotion authorised / four rejected actors / `pendiente` target |
| MAYBE NEW | `supabase/migrations/<ts>_zer84_project_admin_promotion.sql`        | Only if the story 5.1 UPDATE policy needs tightening             |
| Prior art | `src/features/tasks/actions.ts`                                     | Scoped update + 0-row `*_REJECTED` discipline                    |
| Prior art | `supabase/migrations/20260821223400_fix_rls_recursion_profiles.sql` | `security definer` helper pattern                                |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- **Every negative AC is a database assertion (NFR14).** Four unauthorized actors (plain `miembro`, `pendiente` actor, non-member, platform admin) each get a harness case that attempts the write directly.
- One case asserts the `pendiente` **target** is refused.
- One case asserts a 0-row update surfaces as an error.
- `pnpm test` and `pnpm db:check-grants` green before done.

### Out of scope

- Demoting an admin (`admin` → `miembro`) — explicitly not in M5 scope.
- Removing a member from a project.
- Leaving a project.
- Transferring `projects.creado_por`.
- Any notification to the promoted person — push notifications are parked.
- A dedicated admin-management screen — no frame exists.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** implement demotion, removal, or leaving, even if a frame seems to show it. Raise it.
- **Do NOT** accept `profiles.is_platform_admin` as authority to promote.
- **Do NOT** promote a `pendiente` row.
- **Do NOT** let the update touch `estado`, `project_id`, or any other column.
- **Do NOT** write an inline `exists (select … from project_members …)` in a `project_members` policy — that is the ZER-65 `42P17` shape.
- **Do NOT** treat a 0-row update as success.
- **Do NOT** invent a new screen for this. The control lives on `4.3`.
- **Do NOT** rely on hiding the control as the access control.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR35: A project admin designates further admins by promoting an approved member to `project_members.rol='admin'`."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** demotion is out of scope and is not implemented; if a frame implies it, it is raised rather than invented (FR35)"]
- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "Leaving a project, deleting a project, or demoting an admin — not in the M5 scope bullets; if a frame implies one, raise it rather than inventing the rule."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "`project_members` | UPDATE | Admins of that project — approving (`pendiente` → `aprobado`) and designating admins (`rol` `miembro` → `admin`)"]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "\"Admins **de ese proyecto**\" is `project_members.rol='admin'` scoped by `project_id`, **not** `profiles.is_platform_admin`. Do not fold a platform-admin override in silently."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md` — no frame is listed for admin designation; the control belongs to `4.3 · Detalle de proyecto`.]

## Dev Agent Record

### Agent Model Used

grok-4.5 (opencode)

### Debug Log References

### Completion Notes List

- Claim pivot: ZER-95 (Santiago In Progress + #78 open), ZER-83/85 (Juan In Progress) → claimed **ZER-84**.
- `promoteProjectMember` FormData action: updates only `rol='admin'` with filters `estado=aprobado` + `rol=miembro`; 0-row → error.
- `PromoteMemberButton` on ProjectDetail member rows when `canPromoteMembers` (viewer project admin); no demote.
- Migration `20260920210000_zer84_project_admin_promotion.sql`: WITH CHECK blocks `rol=admin` unless `estado=aprobado`.
- Harness extended: admin promote OK; miembro/platform-admin/non-member/pendiente-actor denied; pendiente target denied.
- Verify: 119 files / 1239 tests, typecheck, lint green.

### Change Log

- 2026-09-20: Implement ZER-84 designate project admins (promote aprobado miembro).

### File List

- scripts/check-projects-rls.harness.ts
- src/features/projects/actions.ts
- src/features/projects/actions.test.ts
- src/features/projects/PromoteMemberButton.tsx
- src/features/projects/PromoteMemberButton.test.tsx
- src/features/projects/ProjectDetail.tsx
- src/features/projects/ProjectDetail.test.tsx
- src/features/projects/types.ts
- src/app/(app)/nodo/projects/[id]/page.tsx
- src/app/(app)/nodo/projects/[id]/page.test.tsx
- supabase/migrations/20260920210000_zer84_project_admin_promotion.sql
- _bmad-output/implementation-artifacts/5-7-designate-project-admins.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
