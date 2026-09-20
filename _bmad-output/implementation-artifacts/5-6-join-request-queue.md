# Story 5.6: Join-request queue (`4.5 · Solicitudes de ingreso`)

Status: review

## Linear

- **ZER-83** — Story 5.6: Cola de solicitudes de ingreso (4.5)
- URL: https://linear.app/zerrant/issue/ZER-83
- Branch: `juantandil123/zer-83-story-56-cola-de-solicitudes-de-ingreso-45`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 5 — Proyectos**
- Unblocks M5 DoD bullet _"Un serrano crea un proyecto por aprobación; otro solicita y **el admin lo aprueba**."_ — the approval half closes here.
- Depends on stories 5.1 (ZER-78), 5.4 (ZER-81) and 5.5 (ZER-82, which writes the `pendiente` rows).

## Story

As a project admin,
I want a queue of people asking to join my project,
so that I can approve or reject each request.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and the node id for `4.5 · Solicitudes de ingreso` reads `TBD`
   **When** this story starts
   **Then** the node id is resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** I am a `rol='admin'`, `estado='aprobado'` member of a project
   **When** I open that project's queue
   **Then** I see its `project_members` rows with `estado='pendiente'`, each with an approve and a reject affordance, matching frame `4.5` at ~390px (FR34, UX-DR19, UX-DR28)

3. **Given** a pending request
   **When** I approve it
   **Then** that row's `estado` becomes `aprobado` and the person appears in the project detail member list (FR34, FR32)

4. **Given** a pending request
   **When** I reject it
   **Then** the `pendiente` row is removed — no third enum value is introduced — and the person may request again afterwards (FR34)

5. **Given** a serrano who is **not** an admin of that project
   **When** they attempt to read the queue or perform either action by any path, including one that bypasses the route
   **Then** the database rejects it — route guarding is ergonomics, RLS is the guard (FR34, NFR14)

6. **Given** the admin check
   **When** it is evaluated
   **Then** it is scoped to that `project_id` and does **not** silently accept `profiles.is_platform_admin` (FR28)

7. **Given** an approve action
   **When** it runs
   **Then** it can only move `pendiente` → `aprobado`; it cannot set `rol`, cannot touch another project's rows, and a write that matched zero rows is reported as a failure rather than redirecting as if it had worked (FR34, NFR12)

8. **Given** a project with no pending requests
   **When** the queue renders
   **Then** a designed empty state is shown rather than a broken or blank section (FR34)

9. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and cover approve, reject, the empty queue, and the non-admin rejection; `pnpm test` and the policy harness are green (NFR11)

## Tasks / Subtasks

- [x] **T0 — BLOCKING prerequisite: resolve the Pencil node id** (AC: 1)
  - [x] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [x] Use `mcp__pencil__get_app_state` to locate frame `4.5 · Solicitudes de ingreso`; read its contents with the design-context tooling.
  - [x] Record the resolved node id into `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`, replacing `TBD`.
  - [x] **This story is not ready for development until this task is done.**

- [x] **T1 — Read the framework docs** (AC: 2–8)
  - [x] Read the server-actions / dynamic-route guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).

- [x] **T2 — RED: failing policy harness first** (AC: 3, 4, 5, 6, 7, 9)
  - [x] Extend `scripts/check-projects-rls.harness.ts`: project admin can update `pendiente` → `aprobado`; project admin can delete a `pendiente` row; a plain `miembro` cannot; a non-member cannot; a `pendiente` requester cannot self-approve; a **platform admin who is not a project admin** cannot.
  - [x] Verify RED.

- [x] **T3 — RED: failing page/action tests** (AC: 2, 3, 4, 7, 8, 9)
  - [x] Queue page test: renders one row per `pendiente` request, with both affordances.
  - [x] Queue page test: empty state.
  - [x] Action tests: approve updates `estado` only; reject deletes; 0-row result → error, not redirect.
  - [x] Verify RED.

- [x] **T4 — GREEN: the queue route** (AC: 2, 8)
  - [x] Route under `src/app/(app)/nodo/projects/[id]/requests/` (adjust only if the resolved Pencil IA demands it).
  - [x] Read `project_members` where `estado='pendiente'` for this project, joined to `profiles` for names and avatars.
  - [x] Compose rows from DS primitives (`Avatar`, `PrimaryButton`, `SecondaryButton`) — `src/components/RequestCard.tsx` is the closest prior art for an approve/reject row and is worth reading, but it is bound to `membership_requests`; do not repurpose it blind (NFR17).

- [x] **T5 — GREEN: approve / reject actions** (AC: 3, 4, 7)
  - [x] `approveProjectJoin` / `rejectProjectJoin` in `src/features/projects/actions.ts`.
  - [x] Approve: `update … set estado='aprobado' where project_id = … and profile_id = … and estado='pendiente'`, then check the row count.
  - [x] Reject: delete the row. No third enum value, no soft-delete flag.
  - [x] `revalidatePath` the queue and the detail route.
  - [x] Spanish error copy following `src/features/tasks/actions.ts`.

- [x] **T6 — Verify** (AC: 2, 5, 9)
  - [x] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [x] Policy harness green; `pnpm db:check-grants` still green.
  - [x] Visual acceptance: frame `4.5` vs the live route at ~390px.

## Dev Notes

### Current state / problem

Story 5.5 writes `pendiente` rows for `ingreso='aprobacion'` projects. Without this story those rows have nowhere to go: the requester waits forever and the project admin has no surface. This screen is the second half of the M5 approval DoD bullet.

### Approach

A queue route scoped to one project, reading its `pendiente` rows, with per-row approve (update to `aprobado`) and reject (delete the row) actions. The policies that authorise both already exist from story 5.1 — this story proves them and adds the surface.

### Rejection removes the row

`project_members.estado` has exactly two values: `pendiente` and `aprobado`. Rejecting therefore **deletes** the row rather than introducing a `rechazado` state. The consequence is deliberate and recorded in the SPEC: the person may request again. Do not add a third enum value, a `rechazado_en` column, or a soft-delete flag to "keep history" — that is a schema change nobody approved.

### The admin check is per-project, and platform admin is not a shortcut

The check is `project_members.rol='admin'` **and** `estado='aprobado'` **and** the same `project_id`, resolved through the story 5.1 `security definer` helper. `profiles.is_platform_admin` is the M6 meaning of "admin" and has no per-project powers here. The harness must contain an explicit case: a platform admin who is not a project admin is **rejected**. Without that case, a well-meaning `or public.is_platform_admin()` can be added later and no test will notice.

### 0-row writes

PostgREST does not error when an update's filters match nothing — the update simply touches nothing and the action redirects as if it had worked. `src/features/tasks/actions.ts` already carries dedicated `*_REJECTED` constants for exactly this. Apply the same discipline: an approve that matched no `pendiente` row is a failure, not a success.

### Files to touch

| Area      | Path                                                                        | Notes                                                            |
| --------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Spec      | `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`                  | Record the resolved node id for `4.5` (T0)                       |
| NEW       | `src/app/(app)/nodo/projects/[id]/requests/page.tsx` (+ `page.test.tsx`)    | Queue route                                                      |
| NEW       | `src/features/projects/JoinRequestRow.tsx` (+ test)                         | Approve/reject row from DS primitives                            |
| EDIT      | `src/features/projects/actions.ts` (+ tests)                                | `approveProjectJoin`, `rejectProjectJoin`                        |
| EDIT      | `src/features/projects/ProjectDetail.tsx`                                   | Queue entry point for project admins only                        |
| EDIT      | `scripts/check-projects-rls.harness.ts`                                     | Admin OK / miembro / non-member / self / platform-admin rejected |
| Prior art | `src/app/(app)/admin/membresias/page.tsx`, `src/components/RequestCard.tsx` | Approve/reject queue shape (bound to `membership_requests`)      |
| Prior art | `src/features/tasks/actions.ts`                                             | 0-row handling, Spanish error constants                          |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- **Negative paths assert against RLS (NFR14).** AC 5 is proven by a direct write from a non-admin against a real database, not by asserting the button is absent.
- Include the platform-admin-is-not-a-project-admin case explicitly.
- Include the 0-row approve case.
- Include the empty queue render.
- `pnpm test` and `pnpm db:check-grants` green before done.
- Visual acceptance per UX-DR28 at ~390px.

### Out of scope

- Bulk approve/reject — no frame asks for it.
- A history or "rechazadas" tab — rejection deletes the row; there is nothing to list.
- Notifying the requester — push notifications are parked in `docs/roadmap/Backlog.md`.
- Promoting a member to admin — story 5.7.
- Removing an approved member from a project — not in the M5 scope bullets. Raise it rather than inventing it.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** open the `.pen` file with a filesystem tool, and do not start before the node id is recorded.
- **Do NOT** add a `rechazado` enum value, a `rechazado_en` column, or a soft-delete flag.
- **Do NOT** fold `profiles.is_platform_admin` into the project-admin check, not even "for support".
- **Do NOT** rely on the route guard as the access control.
- **Do NOT** let an approve action also set `rol`, or touch rows from another `project_id`.
- **Do NOT** treat a 0-row update as success.
- **Do NOT** reuse `RequestCard.tsx` as-is — it is shaped for `membership_requests` and its approve path goes through the M3 RPC.
- **Do NOT** render `pendiente` people anywhere they could be mistaken for members.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR34: A project admin works the join-request queue (`4.5`): sees `pendiente` rows for that project and approves (→ `aprobado`) or rejects (row removed); non-admins of that project cannot."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** the admin check is scoped to that `project_id` and does not silently accept `profiles.is_platform_admin` (FR28)"]
- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "**Rejection semantics:** rejecting a join request removes the `pendiente` row (the person may request again) rather than introducing a third `estado` value — the PRD enum has exactly two values."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "a platform admin's global powers are not silently assumed to include per-project governance unless a policy grants it explicitly."]
- [Source: `src/features/tasks/actions.ts` — "When the filters match no rows, PostgREST doesn't return an error: the update simply touches nothing. Without telling that case apart, the action redirects as if it had worked."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "UX-DR19: Join-request queue with per-row approve/reject affordances per frame `4.5 · Solicitudes de ingreso`."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Resolved Pencil frame `4.5` node id `c8G0S` into screen-inventory.
- Queue route `/nodo/projects/[id]/requests` with empty state + JoinRequestRow approve/reject.
- `approveProjectJoin` / `rejectProjectJoin` with 0-row failure handling; RLS harness covers platform-admin and non-member denies.
- Visual IA matches frame c8G0S (back + title, project name, count, card with Aprobar/Rechazar).

### Change Log

### File List

- `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`
- `src/app/(app)/nodo/projects/[id]/requests/page.tsx`
- `src/app/(app)/nodo/projects/[id]/requests/page.test.tsx`
- `src/features/projects/JoinRequestQueue.tsx`
- `src/features/projects/JoinRequestQueue.test.tsx`
- `src/features/projects/JoinRequestRow.tsx`
- `src/features/projects/JoinRequestRow.test.tsx`
- `src/features/projects/join-request-transform.ts`
- `src/features/projects/join-request-transform.test.ts`
- `src/features/projects/actions.ts`
- `src/features/projects/actions.test.ts`
- `scripts/check-projects-rls.harness.ts`
