# Story 5.4: Project detail (`4.3 · Detalle de proyecto`)

Status: backlog

## Linear

- **ZER-81** — Story 5.4: Detalle de proyecto (4.3)
- URL: https://linear.app/zerrant/issue/ZER-81
- Branch: `juantandil123/zer-81-story-54-detalle-de-proyecto-43`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 5 — Proyectos**
- Unblocks both M5 DoD bullets: the member list on this screen is where _"el admin lo aprueba"_ and _"unirse es inmediato"_ are both observed.
- Depends on stories 5.1 (ZER-78) and 5.3 (ZER-80). Story 5.5 (ZER-82) wires the join affordance this screen renders.

## Story

As a member,
I want to open a project and see its estado, members, and admins,
so that I can understand what it is and who runs it before deciding to join.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and the node id for `4.3 · Detalle de proyecto` reads `TBD`
   **When** this story starts
   **Then** the node id is resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** a project detail route
   **When** it renders
   **Then** the screen shows nombre, descripcion, `estado`, the member list, and which of those members are admins, matching frame `4.3` at ~390px (FR32, UX-DR17, UX-DR28)

3. **Given** a project with both `aprobado` and `pendiente` `project_members` rows
   **When** the detail renders
   **Then** only `estado='aprobado'` rows appear as members — `pendiente` rows **never** appear in the member list (FR32)

4. **Given** the design-system constraint
   **When** members are rendered
   **Then** they are composed from existing primitives (`Avatar`, `Chip`/`RoleChip`) rather than page-local styling (NFR17)

5. **Given** a project with `ingreso='abierto'` and a viewer who is not a member
   **When** the detail renders
   **Then** the single contextual affordance reads "Unirse" (FR32, UX-DR17)

6. **Given** a project with `ingreso='aprobacion'` and a viewer who is not a member
   **When** the detail renders
   **Then** the single contextual affordance reads "Solicitar ingreso" (FR32, UX-DR17)

7. **Given** a viewer who already has a `pendiente` row on this project
   **When** the detail renders
   **Then** a pending indicator is shown and no join affordance is offered (FR32)

8. **Given** a viewer who is already an `aprobado` member
   **When** the detail renders
   **Then** no join affordance is offered at all (FR32)

9. **Given** a viewer who is a `rol='admin'`, `estado='aprobado'` member
   **When** the detail renders
   **Then** the route to the join-request queue (story 5.6) is reachable from this screen; for a non-admin it is not offered — and route-guarding it is ergonomics, the RLS policy is the guard (FR34, NFR14)

10. **Given** TDD is mandatory
    **When** the story is claimed done
    **Then** failing tests were written first and cover all four viewer states of AC 5–8 plus the `pendiente` exclusion of AC 3; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — BLOCKING prerequisite: resolve the Pencil node id** (AC: 1)
  - [ ] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [ ] Use `mcp__pencil__get_app_state` to locate frame `4.3 · Detalle de proyecto`; read its contents with the design-context tooling.
  - [ ] Record the resolved node id into `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`, replacing `TBD`.
  - [ ] **This story is not ready for development until this task is done.**

- [ ] **T1 — Read the framework docs** (AC: 2–9)
  - [ ] Read the dynamic-route / server-component guide in `node_modules/next/dist/docs/` — this Next.js version has breaking changes vs. training data (per `AGENTS.md`).

- [ ] **T2 — RED: failing tests first** (AC: 2, 3, 5, 6, 7, 8, 10)
  - [ ] A pure view-model helper (e.g. `resolveJoinAffordance({ ingreso, viewerMembership })`) with a case per viewer state — this is the piece worth unit-testing hard.
  - [ ] Component/page tests: fields render; `pendiente` rows excluded from the member list; admins marked; the right affordance per state.
  - [ ] Verify RED.

- [ ] **T3 — GREEN: data read** (AC: 2, 3, 9)
  - [ ] Server component reads the `projects` row and its `project_members` joined to `profiles` for names/avatars.
  - [ ] Filter members to `estado='aprobado'` **in the query**, not only in the render.
  - [ ] Read the viewer's own membership row (any `estado`) separately to drive the affordance.

- [ ] **T4 — GREEN: the screen** (AC: 2, 4, 5, 6, 7, 8, 9)
  - [ ] Compose from `Avatar`, `Chip`/`RoleChip`, `PrimaryButton`.
  - [ ] Render exactly one contextual affordance — never two join buttons.
  - [ ] Surface the queue entry point for project admins only.

- [ ] **T5 — Verify** (AC: 2, 10)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Visual acceptance: frame `4.3` vs the live route at ~390px.

## Dev Notes

### Current state / problem

No project detail route exists. After 5.1 and 5.3 there are rows to read, but nowhere to read them. This screen is also where two rules become visible and therefore easy to get wrong: a `pendiente` row is **not** a member, and "admin" here is `project_members.rol='admin'` scoped by this `project_id` — not `profiles.is_platform_admin`.

### Approach

Server-component read of the project plus its approved members, a small pure helper that maps `(project.ingreso, viewerMembership)` to exactly one affordance, and DS-composed rendering.

The affordance table:

| `project.ingreso` | viewer's `project_members` row | Affordance                |
| ----------------- | ------------------------------ | ------------------------- |
| `abierto`         | none                           | "Unirse"                  |
| `aprobacion`      | none                           | "Solicitar ingreso"       |
| either            | `estado='pendiente'`           | pending indicator, no CTA |
| either            | `estado='aprobado'`            | none                      |

Keeping that in a pure function means the four states are unit-testable without rendering, and story 5.5 wires the two CTAs to their actions without touching the decision logic.

### `pendiente` is not membership

`project_members` rows with `estado='pendiente'` are the join-request queue, not the project. They must never be counted in a member count, rendered in the member list, or included in the "Mis proyectos" count on the profile (story 5.8). Filter in the query so a later refactor of the render cannot leak them.

### Admin scoping

M5 "admin" = `project_members.rol='admin'` **and** `estado='aprobado'` **and** the same `project_id`. M6 "admin" = `profiles.is_platform_admin`. These are different axes and must never be cross-wired. A platform admin has no per-project powers unless an explicit reviewed policy clause grants them — and story 5.1 does not add one.

### Files to touch

| Area      | Path                                                            | Notes                                                          |
| --------- | --------------------------------------------------------------- | -------------------------------------------------------------- |
| Spec      | `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`      | Record the resolved node id for `4.3` (T0)                     |
| NEW       | `src/app/(app)/nodo/projects/[id]/page.tsx` (+ `page.test.tsx`) | Detail route                                                   |
| NEW       | `src/features/projects/ProjectDetail.tsx` (+ test)              | Presentational; composed from DS primitives                    |
| NEW       | `src/features/projects/membership.ts` (+ `membership.test.ts`)  | `resolveJoinAffordance` pure helper                            |
| EDIT      | `src/features/projects/types.ts`                                | Detail view-model type                                         |
| Prior art | `src/features/plantel/MemberDetail.tsx`                         | Detail-screen composition, `SectionTitle`, Avatar/RoleChip use |
| Prior art | `src/features/plantel/transform.ts`, `visibility.ts`            | Pure view-model + pure rule helpers, unit-tested separately    |
| Prior art | `src/features/tasks/TaskDetailView.tsx`                         | Detail + contextual action pattern                             |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- The four viewer states are the core of this story — one test each, against the pure helper, plus render assertions.
- Assert the `pendiente` exclusion explicitly: a fixture with one `aprobado` and one `pendiente` row must render exactly one member.
- Assert that a project admin is visually distinguishable from a plain `miembro`.
- `pnpm test` green before done.
- Visual acceptance per UX-DR28 at ~390px.

### Out of scope

- Performing the join — story 5.5 owns the actions and the `WITH CHECK` proof.
- The join-request queue screen itself — story 5.6.
- Promoting a member to admin — story 5.7 (the promotion control lives on this screen, but the action and its policy ship there).
- Editing project config, deleting a project, leaving a project, demoting an admin — out of M5 scope.
- Project chat, files, or attached tasks — out of scope.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** open the `.pen` file with a filesystem tool, and do not start before the node id is recorded.
- **Do NOT** render `pendiente` rows as members, anywhere, including in a count.
- **Do NOT** show two join affordances, or a disabled join button for an existing member. Exactly one contextual affordance, or none.
- **Do NOT** treat `profiles.is_platform_admin` as a project admin.
- **Do NOT** compute "is admin" from the project's `creado_por`. The creator holds an admin `project_members` row (story 5.3); read the row, not the author column — story 5.7 will add admins who did not create the project.
- **Do NOT** invent a leave/delete/demote affordance because the frame seems to imply one. Raise it.
- **Do NOT** hand-roll avatars or chips; use `Avatar`, `Chip`, `RoleChip`.
- **Do NOT** rely on hiding the queue link as the queue's access control — RLS is the guard.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR32: Project detail (`4.3`) shows nombre, descripcion, `estado`, the approved member list, and which members are admins; only `estado='aprobado'` rows count as members."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "the primary affordance is \"Unirse\" for an `ingreso='abierto'` project, \"Solicitar ingreso\" for `aprobacion`, a pending indicator for a viewer with a `pendiente` row, and no join affordance for an existing approved member."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "Only `estado='aprobado'` rows count as project membership. `pendiente` rows are the join-request queue and must never be rendered as members."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "a platform admin's global powers are not silently assumed to include per-project governance unless a policy grants it explicitly."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "UX-DR17: Project detail IA — estado, miembros, admins, and a single contextual join affordance — per frame `4.3 · Detalle de proyecto`."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "NFR17: Compose from the design-system primitives delivered by `SPEC-ui-fidelity-m0-m2`."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
