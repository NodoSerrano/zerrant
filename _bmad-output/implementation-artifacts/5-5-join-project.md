# Story 5.5: Join a project — `abierto` immediate vs `aprobacion` pending

Status: review

## Linear

- **ZER-82** — Story 5.5: Unirse a un proyecto (puerta abierta vs por aprobación)
- URL: https://linear.app/zerrant/issue/ZER-82
- Branch: `juantandil123/zer-82-story-55-unirse-a-un-proyecto-puerta-abierta-vs-por`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 5 — Proyectos**
- Unblocks **both** M5 DoD bullets: _"En un proyecto abierto, unirse es inmediato."_ directly, and _"otro solicita…"_ — the first half of the approval bullet.
- Depends on stories 5.1 (ZER-78) and 5.4 (ZER-81, which renders the affordance). Story 5.6 (ZER-83) consumes the `pendiente` rows this story writes.

## Story

As a serrano who found a project,
I want joining to be immediate on an open project and a request on an approval project,
so that the project's chosen door actually governs who gets in.

## Acceptance Criteria

1. **Given** a project with `ingreso='abierto'`
   **When** I tap "Unirse"
   **Then** a `project_members` row is written with `estado='aprobado'` and I appear in the member list with no admin action required (FR33)

2. **Given** a project with `ingreso='aprobacion'`
   **When** I tap "Solicitar ingreso"
   **Then** a `project_members` row is written with `estado='pendiente'`, I do **not** appear in the member list, and the detail screen shows my pending state (FR33, FR32)
   **And** the request appears in that project's join-request queue (FR33, FR34)

3. **Given** a client that bypasses the server action entirely
   **When** it attempts to insert `estado='aprobado'` into a project whose `ingreso='aprobacion'`
   **Then** the insert is **rejected by the RLS `WITH CHECK` clause**, which reads the parent project's `ingreso` — not by the server action (FR33, NFR14)

4. **Given** the same bypass path
   **When** a client attempts to insert a `project_members` row with a `profile_id` that is not `auth.uid()`
   **Then** the insert is rejected by policy — a person may only join on their own behalf (FR33, NFR14)

5. **Given** the same bypass path
   **When** a client attempts to self-insert with `rol='admin'`
   **Then** the insert is rejected — admin is granted by an existing project admin (story 5.7) or by being the creator (story 5.3), never claimed at join time (FR33, FR35, NFR14)

6. **Given** I already have a `project_members` row on a project
   **When** a second join attempt is made
   **Then** it collides on the composite primary key `(project_id, profile_id)` rather than creating a duplicate row, and the UI reports it in Spanish instead of surfacing a raw `23505` (FR27, FR33)

7. **Given** a tourist
   **When** they attempt to join any project by any path
   **Then** the insert is rejected by RLS (FR33, NFR14)

8. **Given** the `WITH CHECK` clause must read the parent `projects` row
   **When** it is written
   **Then** it does not re-trigger `project_members` policies on itself; if a lookup over `project_members` is needed anywhere in this path it goes through a `security definer` helper, and a policy test that actually inserts proves no `42P17` (NFR20, NFR11)

9. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and cover both doors, the bypass attempt, the third-party insert, the `rol='admin'` claim, the PK collision, and the tourist rejection; `pnpm test` and the policy harness are green (NFR11, NFR12)

## Tasks / Subtasks

- [x] **T0 — Read the framework docs and the data model** (AC: 1–8)
  - [x] Read the server-actions guide in `node_modules/next/dist/docs/` — this Next.js version has breaking changes vs. training data (per `AGENTS.md`).
  - [x] Re-read the "The `ingreso` door must be enforced in the database" section of `_bmad-output/specs/spec-m5-proyectos/data-model.md`. It is the single most important policy in this milestone.

- [x] **T1 — RED: failing policy harness first** (AC: 1, 2, 3, 4, 5, 6, 7, 8, 9)
  - [x] Extend `scripts/check-projects-rls.harness.ts` (from story 5.1) with: `abierto` → `aprobado` allowed; `aprobacion` → `pendiente` allowed; `aprobacion` + self-inserted `aprobado` **rejected**; third-party `profile_id` rejected; self-inserted `rol='admin'` rejected; second join hits the PK; tourist rejected; no `42P17` on any path.
  - [x] Verify RED against the story 5.1 policy scaffold.

- [x] **T2 — RED: failing action tests** (AC: 1, 2, 6, 9)
  - [x] Action test: `abierto` project → insert payload carries `estado='aprobado'`.
  - [x] Action test: `aprobacion` project → insert payload carries `estado='pendiente'`.
  - [x] Action test: `23505` from the PK collision → Spanish message, no crash.
  - [x] Verify RED.

- [x] **T3 — GREEN: the migration that pins the door** (AC: 3, 4, 5, 7, 8)
  - [x] New migration, timestamped after story 5.1's, replacing the `project_members` INSERT policy with the door-enforcing version.
  - [x] `WITH CHECK` asserts all of: `profile_id = auth.uid()`; `public.is_non_tourist()`; `rol = 'miembro'`; and `estado` constrained by the parent project's `ingreso` — `abierto` permits `aprobado`, `aprobacion` permits only `pendiente`.
  - [x] The parent lookup reads `public.projects`, not `public.project_members`, so the plain subquery is safe there; anything that must read `project_members` goes through the `security definer` helper from story 5.1.
  - [x] Header comment stating why: _a server action that "sets the right estado" is ergonomics, not a guard._

- [x] **T4 — GREEN: the join actions** (AC: 1, 2, 6)
  - [x] `joinProject(projectId)` in `src/features/projects/actions.ts`: read the project's `ingreso`, insert the corresponding `estado`, `revalidatePath` the detail route.
  - [x] Map `23505` to a Spanish message ("Ya sos parte de este proyecto." / "Ya enviaste una solicitud.") following the `createMembershipRequest` precedent.
  - [x] Handle the PostgREST 0-row trap: a write that touched nothing is not a success.
  - [x] Wire both CTAs from the story 5.4 detail screen.

- [x] **T5 — Verify** (AC: 1, 2, 3, 9)
  - [x] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [x] Policy harness green against a real database.
  - [x] `pnpm db:check-grants` still green.

## Dev Notes

### Current state / problem

After story 5.1 the `project_members` INSERT policy exists as a scaffold; after 5.4 the detail screen renders "Unirse" or "Solicitar ingreso" but neither does anything. The `ingreso` column is meaningless until a policy enforces it.

### Approach

Two thin server actions and — the real deliverable — an RLS `WITH CHECK` clause that reads the parent project's `ingreso` and constrains the inserted `estado`. Everything else in this story is ergonomics on top of that clause.

The contract, stated plainly:

| `projects.ingreso` | Permitted self-inserted `project_members.estado` |
| ------------------ | ------------------------------------------------ |
| `abierto`          | `aprobado`                                       |
| `aprobacion`       | `pendiente` **only**                             |

> The single most important policy in this milestone: a client must not be able to self-insert `estado='aprobado'` into a project whose `ingreso='aprobacion'`. … A server action that "sets the right estado" is ergonomics, not a guard — if the policy does not enforce it, the approval gate does not exist.

This is why AC 3 is written as a bypass test. A test that calls the server action and observes `estado='pendiente'` proves the action works; it proves nothing about the gate. The proof is an insert that skips the action and gets rejected by the database.

### Recursion note

The `WITH CHECK` clause reads `public.projects` — a **different** table from the one the policy protects — so a plain subquery there does not recurse. The `42P17` hazard in this story is anything that reaches back into `project_members` (for example "am I already a member?" or "am I an admin?"). That belongs in the `security definer` helper from story 5.1 (`public.is_project_admin()`, pattern: `public.is_platform_admin()` / `public.is_non_tourist()`), never inline. ZER-65 is the incident this rule exists to prevent: a self-referencing subquery in a `membership_requests` policy aborted every insert with `42P17` and the app showed a generic error, so the whole tourist → serrano path was dead for every user and nobody noticed from the UI.

### Duplicate joins and the composite PK

`project_members` has PK `(project_id, profile_id)`. A second join attempt raises `23505`, which is the correct and stronger behaviour — unlike a `WITH CHECK` subquery, a unique index cannot be defeated by two concurrent transactions. `createMembershipRequest` already maps `23505` to a user-facing Spanish message; follow that precedent instead of surfacing the raw code or swallowing it into a generic "no pudimos…".

### Files to touch

| Area          | Path                                                                             | Notes                                                       |
| ------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| NEW migration | `supabase/migrations/<ts>_zer82_project_members_ingreso_door.sql`                | The `WITH CHECK` clause that is this story                  |
| EDIT          | `src/features/projects/actions.ts` (+ tests)                                     | `joinProject`; `23505` → Spanish copy                       |
| EDIT          | `src/features/projects/ProjectDetail.tsx`                                        | Wire the two CTAs from story 5.4                            |
| EDIT          | `scripts/check-projects-rls.harness.ts`                                          | Both doors, the bypass, third-party, `rol='admin'`, tourist |
| Prior art     | `supabase/migrations/20260919021000_zer65_membership_requests_rls_recursion.sql` | Recursion incident + the unique-index argument              |
| Prior art     | `supabase/migrations/20260813210000_membership_requests_one_pending.sql`         | Partial unique index as the integrity guarantee             |
| Prior art     | `src/features/membership/` (`createMembershipRequest`)                           | `23505` → user-facing Spanish message                       |

### Testing requirements

- **TDD mandatory (NFR11):** the failing harness case comes before the migration.
- **Negative paths assert against RLS, not rendering (NFR14).** Every rejection AC in this story is proven by a direct insert against a real database that the policy refuses. A hidden button is not evidence.
- The harness must exercise all four rejection shapes: wrong `estado` for the door, third-party `profile_id`, self-claimed `rol='admin'`, tourist.
- The `42P17` check must be an actual insert, not a `select`.
- `pnpm test` and `pnpm db:check-grants` green before done.

### Out of scope

- Approving or rejecting a `pendiente` row — story 5.6.
- Promoting a member to admin — story 5.7.
- Leaving a project or cancelling your own pending request — not in the M5 scope bullets. Raise it rather than inventing the rule.
- Notifying a requester that their join was approved — push notifications are parked in `docs/roadmap/Backlog.md`.
- A third `estado` value for "rejected" — the PRD enum has exactly two.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** let the server action be the only thing that decides `estado`. That is precisely the failure this story exists to prevent.
- **Do NOT** write the `WITH CHECK` clause with a subquery over `project_members` — use the `security definer` helper.
- **Do NOT** swallow `23505` into a generic error, and do not surface the raw Postgres code to the user.
- **Do NOT** treat a 0-row PostgREST write as success.
- **Do NOT** add an "already requested" `WITH CHECK` subquery to prevent duplicates. The composite PK already does it, atomically — that is the exact lesson from ZER-65.
- **Do NOT** permit `rol='admin'` in a self-insert.
- **Do NOT** add a `rechazado` enum value or a soft-delete flag.
- **Do NOT** claim this story done from a UI walkthrough. The gate is a database assertion.

### References

- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "The single most important policy in this milestone: a client must not be able to self-insert `estado='aprobado'` into a project whose `ingreso='aprobacion'`. The `WITH CHECK` clause has to read the parent project's `ingreso` and constrain the inserted `estado` accordingly."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "A server action that \"sets the right estado\" is ergonomics, not a guard — if the policy does not enforce it, the approval gate does not exist."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR33: Joining follows the project's `ingreso` door … and the door is enforced by an RLS `WITH CHECK` clause, not only by the server action."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/data-model.md` — "A second join attempt collides on the PK rather than creating a duplicate row."]
- [Source: `supabase/migrations/20260919021000_zer65_membership_requests_rls_recursion.sql` — "The index is also the stronger guarantee: a WITH CHECK subquery cannot stop two concurrent transactions from both passing the check."]
- [Source: `docs/roadmap/Seguridad RLS.md:16` — "`ingreso=abierto` → entra aprobado, `aprobacion` → pendiente."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- ZER-82 join door: RLS WITH CHECK pins projects.ingreso → project_members.estado; grant allows estado (not rol); joinProject action + ProjectJoinButton on detail CTAs; harness covers bypass/third-party/admin claim/PK/tourist/abierto.

### Change Log

### File List

- supabase/migrations/20260920203000_zer82_project_members_ingreso_door.sql
- scripts/check-projects-rls.harness.ts
- src/features/projects/actions.ts
- src/features/projects/actions.test.ts
- src/features/projects/ProjectJoinButton.tsx
- src/features/projects/ProjectDetail.tsx
- src/features/projects/ProjectDetail.test.tsx
- src/lib/db/projects-schema.ts
- src/lib/db/projects-schema.test.ts
