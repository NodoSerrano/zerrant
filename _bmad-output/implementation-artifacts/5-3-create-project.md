# Story 5.3: Create project (`4.4 · Crear proyecto`)

Status: backlog

## Linear

- **ZER-80** — Story 5.3: Crear proyecto (4.4)
- URL: https://linear.app/zerrant/issue/ZER-80
- Branch: `juantandil123/zer-80-story-53-crear-proyecto-44`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 5 — Proyectos**
- Unblocks M5 DoD bullet _"Un serrano crea un proyecto por aprobación; otro solicita y el admin lo aprueba."_ — the first half of it starts here.
- Depends on stories 5.1 (ZER-78, tables) and 5.2 (ZER-79, the list to return to).

## Story

As a serrano with an initiative,
I want to create a project with a nombre, descripcion, estado, and ingreso door,
so that other serranos can find it and join it.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and the node id for `4.4 · Crear proyecto` reads `TBD`
   **When** this story starts
   **Then** the node id is resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** the create-project route as a serrano
   **When** the form renders
   **Then** it collects nombre, descripcion, an `estado` selector over `idea` / `en_curso` / `pausado` / `terminado`, and an `ingreso` selector over `abierto` / `aprobacion`, with the Pencil frame's labels, IA and primary CTA placement at ~390px (FR31, UX-DR18, UX-DR28)
   **And** the stored values are the unaccented Spanish enum values exactly as the PRD writes them, whatever the Spanish UI labels say (NFR15)

3. **Given** a valid submission
   **When** the server action runs
   **Then** a `projects` row is inserted with `creado_por` = my profile id and the submitted `estado` / `ingreso` (FR31)

4. **Given** the same submission
   **When** it succeeds
   **Then** a `project_members` row is written for me with `rol='admin'` and `estado='aprobado'` **in the same transaction** as the project row — never as a best-effort second write that can leave an admin-less project behind (FR31)

5. **Given** a successful create
   **When** I return to the projects list
   **Then** the new project appears immediately and its detail route resolves (FR31)

6. **Given** required fields are missing or blank
   **When** I submit
   **Then** the form reports the problem in Spanish and no `projects` row is written (FR31, NFR12)

7. **Given** a tourist
   **When** a client bypasses the UI and attempts the same insert directly
   **Then** the insert is **rejected by RLS**, not merely hidden by the UI — the negative test asserts against the database, not against rendering (FR31, NFR14)

8. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and cover a successful create, the creator-admin seating, required-field validation, and the tourist rejection; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — BLOCKING prerequisite: resolve the Pencil node id** (AC: 1)
  - [ ] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [ ] Use `mcp__pencil__get_app_state` to locate frame `4.4 · Crear proyecto`; read its contents with the design-context tooling.
  - [ ] Record the resolved node id into `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`, replacing `TBD`.
  - [ ] **This story is not ready for development until this task is done.**

- [ ] **T1 — Read the framework docs** (AC: 2–7)
  - [ ] Read the App Router / server-actions guide in `node_modules/next/dist/docs/` — this Next.js version has breaking changes vs. training data (per `AGENTS.md`).

- [ ] **T2 — RED: failing tests first** (AC: 3, 4, 6, 7, 8)
  - [ ] Action test: valid submit → `projects` insert with `creado_por`, then the creator `project_members` row with `rol='admin'`, `estado='aprobado'`.
  - [ ] Action test: blank nombre → error returned, no insert.
  - [ ] Action test: invalid `estado` / `ingreso` value → rejected by the enum allow-list, not cast blindly.
  - [ ] Page test: the four inputs render with the frame's labels and the enum options.
  - [ ] Harness case (real database): tourist insert rejected by RLS.
  - [ ] Verify RED.

- [ ] **T3 — GREEN: server action** (AC: 3, 4, 6)
  - [ ] `src/features/projects/actions.ts` with `createProject`.
  - [ ] Validate with an explicit allow-list per enum, following `oneOf()` in `src/features/tasks/actions.ts` — never a blind `as TaskEstado`-style cast.
  - [ ] Write both rows atomically. Two sequential PostgREST calls are **not** atomic: prefer a `security definer` RPC (`create_project_with_admin`) that inserts both rows in one statement block, or an equivalent single-transaction path. If an RPC is used, `revoke execute … from public` and `grant execute … to authenticated`, and keep the RLS rules mirrored inside it.
  - [ ] Spanish error copy in the style of `src/features/tasks/actions.ts` (`"No pudimos crear el proyecto. Probá de nuevo."`).
  - [ ] `revalidatePath` the projects list, then redirect.

- [ ] **T4 — GREEN: the form** (AC: 2, 5)
  - [ ] Route under `src/app/(app)/nodo/projects/new/` (adjust only if the resolved Pencil IA demands it).
  - [ ] Compose from `Input`, `PrimaryButton` and the other DS primitives — no page-local CSS for controls (NFR17).
  - [ ] Guard the route for tourists as ergonomics; the real guard is the RLS policy.

- [ ] **T5 — Verify** (AC: 2, 5, 7, 8)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Visual acceptance: frame `4.4` vs the live route at ~390px.
  - [ ] Confirm the new project appears in the list and its detail route resolves.

## Dev Notes

### Current state / problem

There is no create-project surface at all. After story 5.1 the tables exist and after 5.2 the list route exists, but nothing can put a row in `projects`. The PRD is explicit that _"El creador es admin del proyecto"_, so creating a project without seating its creator produces an ungovernable project: nobody can approve joins, nobody can edit config, and no later story can repair it because promotion itself requires an existing admin.

### Approach

A create form matching frame `4.4`, a server action that validates against explicit enum allow-lists, and an atomic write of the `projects` row plus the creator's `project_members` admin row.

**Atomicity is the sharp edge here.** Two separate PostgREST calls can leave a project with no admin if the second fails. A `security definer` RPC that does both inserts in one statement block is the straightforward fix — but a `security definer` function bypasses RLS, so it must re-assert the rules it skips (caller is a serrano; `creado_por = auth.uid()`; the seeded member row is the caller with `rol='admin'`, `estado='aprobado'`) and must `revoke execute … from public` before granting to `authenticated`. That is the same discipline the M3 `approve_membership_request` RPC got wrong and had to be patched for.

### Enum fidelity

| Field     | Stored values (exact)                      |
| --------- | ------------------------------------------ |
| `estado`  | `idea`, `en_curso`, `pausado`, `terminado` |
| `ingreso` | `abierto`, `aprobacion`                    |

Spanish UI labels are presentation; the enum value is data. `aprobacion` has no accent in the database whatever the label reads.

### Files to touch

| Area      | Path                                                               | Notes                                                           |
| --------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Spec      | `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`         | Record the resolved node id for `4.4` (T0)                      |
| NEW       | `src/app/(app)/nodo/projects/new/page.tsx` (+ `page.test.tsx`)     | Create-project route                                            |
| NEW       | `src/features/projects/actions.ts` (+ `actions.test.ts`)           | `createProject` with enum allow-lists                           |
| NEW       | `src/features/projects/types.ts`                                   | `ProjectEstado`, `ProjectIngreso`, `ProjectMemberRol`           |
| NEW       | `src/features/projects/ProjectForm.tsx`                            | Composed from DS primitives                                     |
| MAYBE NEW | `supabase/migrations/<ts>_zer80_create_project_with_admin_rpc.sql` | Atomic project + creator-admin insert, if the RPC path is taken |
| EDIT      | `scripts/check-projects-rls.harness.ts`                            | Add the tourist-insert-rejected case                            |
| Types     | `src/lib/supabase/database.types.ts`                               | Regenerate if an RPC is added                                   |
| Prior art | `src/features/tasks/actions.ts`                                    | `oneOf()` allow-list, Spanish error constants, 0-row handling   |
| Prior art | `src/features/tasks/TaskForm.tsx`                                  | Form composition from DS primitives                             |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- Action tests mock Supabase and assert the exact insert payloads, including `rol='admin'` / `estado='aprobado'` on the creator row.
- **The tourist rejection is a database assertion (NFR14).** A test that only proves the button is hidden does not satisfy AC 7. Add the case to the projects RLS harness against a real database.
- Watch the 0-row trap documented in `src/features/tasks/actions.ts`: PostgREST does not error when filters match nothing, so an action can redirect as if it had worked. Check the row count.
- `pnpm test` green before done.

### Out of scope

- Joining a project — story 5.5 owns both doors.
- Editing project config after creation — not in the M5 scope bullets; raise it rather than inventing it.
- Deleting a project — out of M5 scope, no policy, denied.
- Image/cover upload for a project — no frame asks for it.
- Project budgets or invoicing — parked in `docs/roadmap/Backlog.md`.
- Attaching tasks to a project — the relation does not exist in the PRD data model.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** open the `.pen` file with a filesystem tool, and do not start before the node id is recorded.
- **Do NOT** write the project row and the creator's member row as two independent, non-atomic calls.
- **Do NOT** ship a `security definer` RPC without `revoke execute … from public` and without re-asserting the RLS rules it bypasses.
- **Do NOT** cast `formData.get("estado") as ProjectEstado`. Validate against the allow-list.
- **Do NOT** rely on the route guard as the tourist block — authorization lives in the database (NFR14).
- **Do NOT** seat the creator with `rol='miembro'` and "promote later". The creator is admin at creation.
- **Do NOT** add an `is_platform_admin` shortcut anywhere in this flow — M5 "admin" is `project_members.rol='admin'` scoped by `project_id`.
- **Do NOT** default `ingreso` in the UI to something other than the frame shows; the database default is `aprobacion`.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR31: Any serrano creates a project (`4.4`) with nombre, descripcion, `estado`, and `ingreso`; the creator is seated as `project_members` with `rol='admin'`, `estado='aprobado'` in the same transaction; tourists are blocked by RLS."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "The creator is _also_ seated as a `project_members` row with `rol='admin'`, `estado='aprobado'` in the same transaction — per PRD §5.7, \"El creador es admin del proyecto\"."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "tourists cannot reach or submit the form (blocked by RLS, not only by UI)"]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "NFR14: Authorization is enforced in the database. Server actions may add ergonomics; a rule that exists only in a server action does not exist."]
- [Source: `src/features/tasks/actions.ts` — "/** Validates against the enum list instead of blindly casting. */ function oneOf<T extends string>(…)"]
- [Source: `src/features/tasks/actions.ts` — "When the filters match no rows, PostgREST doesn't return an error: the update simply touches nothing."]
- [Source: `AGENTS.md` — "Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
