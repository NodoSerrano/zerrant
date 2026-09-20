# Story 6.10: Edit and delete event (`5.3 · Editar evento`)

Status: review

## Linear

- **ZER-96** — Story 6.10: Editar y eliminar evento (5.3)
- URL: https://linear.app/zerrant/issue/ZER-96
- Branch: `juantandil123/zer-96-story-610-editar-y-eliminar-evento-53`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- No DoD bullet of its own; it is what keeps the agenda honest — _"wrong details and cancelled plans do not stay on the agenda."_
- Depends on stories 6.5 (ZER-91), 6.7 (ZER-93, the validator and form shell) and 6.8 (ZER-94).

## Story

As an event creator or a platform admin,
I want to edit or delete an event,
so that wrong details and cancelled plans do not stay on the agenda.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and the node id for `5.3 · Editar evento` reads `TBD`
   **When** this story starts
   **Then** the node id is resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** I am the event's creator or a platform admin
   **When** I open the edit screen
   **Then** the form prefills the event's current titulo, descripcion, lugar, inicio and fin, and the delete affordance is present, matching frame `5.3` at ~390px (FR49, UX-DR26, UX-DR28)

3. **Given** edited values
   **When** I save
   **Then** the changes persist and both the agenda and the detail screen reflect them (FR49)

4. **Given** an edit where `fin` is earlier than `inicio`
   **When** I save
   **Then** it is rejected with a clear Spanish message and nothing is written — the same pure validator story 6.7 wrote, not a second implementation (FR46, FR49)

5. **Given** an event with `event_attendance` rows
   **When** I delete it
   **Then** the event is removed, its attendance rows are removed by the `on delete cascade` FK, it disappears from the agenda, and its detail route no longer resolves (FR49, FR43)

6. **Given** a serrano who is neither the creator nor a platform admin
   **When** a client bypasses the route and attempts an update or a delete
   **Then** the database rejects both — route guarding is ergonomics, RLS is the guard (FR49, NFR14)

7. **Given** the M6 meaning of "admin"
   **When** the authorization is evaluated
   **Then** it is `profiles.is_platform_admin` via `public.is_platform_admin()` — never a project-scoped `project_members.rol='admin'` (FR49)

8. **Given** `events` has no `estado` column
   **When** delete is implemented
   **Then** it is a real `delete`, not a soft-delete flag or a "cancelado" state (FR43, FR49)

9. **Given** deletion is destructive
   **When** I tap delete
   **Then** a confirmation step precedes it, in Spanish (FR49, NFR12)

10. **Given** TDD is mandatory
    **When** the story is claimed done
    **Then** failing tests were written first and cover prefill, save, delete with cascade, and the unauthorized actor; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [x] **T0 — BLOCKING prerequisite: resolve the Pencil node id** (AC: 1)
  - [x] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [x] Use `mcp__pencil__get_app_state` to locate frame `5.3 · Editar evento`; read its contents with the design-context tooling.
  - [x] Record the resolved node id into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, replacing `TBD`.
  - [x] **This story is not ready for development until this task is done.**

- [x] **T1 — Read the framework docs** (AC: 2–9)
  - [x] Read the server-actions / dynamic-route guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).

- [x] **T2 — RED: failing policy harness first** (AC: 5, 6, 7, 10)
  - [x] Extend `scripts/check-events-rls.harness.ts`: creator update OK; creator delete OK; platform admin update/delete OK; other serrano update rejected; other serrano delete rejected; tourist rejected.
  - [x] Cascade case: delete an event that **has** attendance rows, assert both the event and the rows are gone.
  - [x] Verify RED against the story 6.5 policies (some cases may already pass — the new ones are the update/delete paths exercised through the real write shape).

- [x] **T3 — RED: failing action/page tests** (AC: 2, 3, 4, 9, 10)
  - [x] Page test: the form prefills all five fields from the event row.
  - [x] Action test: save updates the row, scoped to that `id`.
  - [x] Action test: an invalid range is rejected by `validateEventRange` and no update is issued.
  - [x] Action test: a 0-row update is a failure, not a redirect.
  - [x] Component test: delete requires confirmation.
  - [x] Verify RED.

- [x] **T4 — GREEN: edit** (AC: 2, 3, 4)
  - [x] Route under `src/app/(app)/agenda/[id]/edit/` (adjust only if the resolved Pencil IA demands it).
  - [x] Reuse `EventForm` from story 6.7 with prefilled values — not a second form implementation.
  - [x] Reuse `validateEventRange` from `src/features/events/validation.ts` — not a second rule.
  - [x] `updateEvent` in `src/features/events/actions.ts`; `revalidatePath` the agenda and the detail route.

- [x] **T5 — GREEN: delete** (AC: 5, 8, 9)
  - [x] `deleteEvent` in `src/features/events/actions.ts`: a real `delete` scoped to the event id.
  - [x] Confirmation step before the destructive action, in Spanish.
  - [x] Redirect to `/agenda` afterwards; `revalidatePath` it.
  - [x] No soft-delete flag, no `cancelado` state.

- [x] **T6 — Verify** (AC: 2, 5, 6, 10)
  - [x] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [x] Policy harness green; `pnpm db:check-grants` still green.
  - [x] Visual acceptance: frame `5.3` vs the live route at ~390px.
  - [x] Manual: delete an event with RSVPs; confirm the agenda drops it and `/agenda/[id]` no longer resolves.

## Dev Notes

### Current state / problem

After stories 6.7–6.9 an event can be created, browsed and RSVP'd to, and it can never be corrected or removed. A typo in a location or a cancelled gathering stays on the agenda forever.

### Approach

An edit route reusing story 6.7's `EventForm` and `validateEventRange`, plus a delete path that relies on the `on delete cascade` FK story 6.5 declared.

**Reuse, not reimplementation, is the point of both.** FR46 is explicitly re-cited in this story precisely so the range rule is the _same_ rule: _"the `fin` not-before-`inicio` validation from story 6.7 applies on edit too."_ Two implementations of a validation rule drift, and the drift shows up as "creating works but editing lets me save a backwards event".

### The cascade does the work

`event_attendance.event_id` carries `on delete cascade` (story 6.5, AC 3). Deleting the event removes its attendance rows in one statement. Do **not** delete attendance rows manually first — that is a second, racier implementation of a constraint the database already enforces, and it hides a missing cascade instead of failing loudly. The harness case must delete an event that **has** rows, because a cascade that was never declared only fails once someone has RSVP'd.

### "admin" means platform admin here

| Milestone | "admin" means                                        | Helper                       |
| --------- | ---------------------------------------------------- | ---------------------------- |
| **M5**    | `project_members.rol='admin'` scoped by `project_id` | `public.is_project_admin()`  |
| **M6**    | `profiles.is_platform_admin`                         | `public.is_platform_admin()` |

Event edit/delete admin is `profiles.is_platform_admin` — _"edita/borra creador o admin"_ — unlike M5, where "admin" is scoped to a project. Do not cross-wire them.

### Delete is delete

`events` has no `estado` column and no soft-delete concept in the PRD. Cancelling an event in M6 means deleting it. Do not add `cancelado`, `activo`, or `deleted_at` — that is a schema change nobody approved, and story 6.5 explicitly forbids inventing a lifecycle.

### 0-row writes

PostgREST does not error when an update or delete matches nothing. `src/features/tasks/actions.ts` carries dedicated `*_REJECTED` constants for exactly this case. An update that touched no row is a failure, not a silent success — and here it is the shape a bypassed authorization check would take.

### Files to touch

| Area      | Path                                                               | Notes                                                |
| --------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Spec      | `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`   | Record the resolved node id for `5.3` (T0)           |
| NEW       | `src/app/(app)/agenda/[id]/edit/page.tsx` (+ `page.test.tsx`)      | Edit route with prefill                              |
| EDIT      | `src/features/events/actions.ts` (+ tests)                         | `updateEvent`, `deleteEvent`                         |
| REUSE     | `src/features/events/EventForm.tsx`                                | Prefilled — do not fork it                           |
| REUSE     | `src/features/events/validation.ts`                                | The same `validateEventRange`                        |
| EDIT      | `src/features/events/EventDetail.tsx`                              | Edit entry point for creator / platform admin        |
| EDIT      | `scripts/check-events-rls.harness.ts`                              | Update/delete authorised and rejected paths; cascade |
| Prior art | `src/features/tasks/actions.ts`, `src/features/tasks/TaskMenu.tsx` | Destructive action + confirmation + 0-row discipline |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- **Every rejection AC is a database assertion (NFR14).** AC 6 is proven by a direct update and a direct delete from a non-creator non-admin.
- The cascade case deletes an event that **has** attendance rows.
- Assert the edit path calls the **shared** validator (e.g. by asserting the same error copy and the same boundary behaviour as story 6.7's suite).
- Assert a 0-row update/delete surfaces as an error.
- Assert delete requires confirmation.
- `pnpm test` and `pnpm db:check-grants` green before done.
- Visual acceptance per UX-DR28 at ~390px.

### Out of scope

- Creating an event — story 6.7.
- RSVP — story 6.9 (attendance rows are only deleted here as a cascade side effect).
- Notifying attendees that an event changed or was cancelled — push notifications are parked.
- A soft-delete / cancelled state.
- Transferring `creado_por` to another person.
- Recurring-event edit semantics ("this occurrence / all occurrences") — recurring events are out of scope.
- Edit history or an audit trail.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** open the `.pen` file with a filesystem tool, and do not start before the node id is recorded.
- **Do NOT** write a second range validator. Reuse `validateEventRange`.
- **Do NOT** fork `EventForm` for the edit screen.
- **Do NOT** delete `event_attendance` rows manually — the FK cascade does it.
- **Do NOT** add `cancelado`, `activo`, `deleted_at`, or any soft-delete column.
- **Do NOT** use a project-scoped admin check — M6 admin is `profiles.is_platform_admin`.
- **Do NOT** rely on the route guard as the authorization.
- **Do NOT** treat a 0-row update or delete as success.
- **Do NOT** ship delete without a confirmation step.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR49: An event is edited or deleted (`5.3`) by its creator or a platform admin; delete cascades `event_attendance`; other serranos can do neither."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** the `fin` not-before-`inicio` validation from story 6.7 applies on edit too (FR46)"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "Deleting an event must cascade its `event_attendance` rows; the FK should declare `on delete cascade` explicitly."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "**Deleting an event cascades** its `event_attendance` rows; there is no soft-delete or `estado` column on `events` in the PRD."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "**Event edit/delete admin** means `profiles.is_platform_admin` (_\"edita/borra creador o admin\"_), unlike M5 where \"admin\" is scoped to a project."]
- [Source: `src/features/tasks/actions.ts` — "When the filters match no rows, PostgREST doesn't return an error: the update simply touches nothing."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "UX-DR26: Edit-event form with prefilled values and the delete affordance per frame `5.3 · Editar evento`."]

## Dev Agent Record

### Agent Model Used

Gentle AI on Hermes (grok-4.5)

### Debug Log References

### Completion Notes List

- Pencil frame `5.3 · Editar evento` node id `u82g5p` recorded in screen-inventory.
- Edit route under `(modal)/agenda/[id]/edit` (focused shell, no TabBar) matching create/edit task pattern and Pencil chevron header.
- Reused `EventForm` + `validateEventRange`; `updateEvent`/`deleteEvent` with 0-row rejection; real DELETE + FK cascade.
- Detail shows edit entry for creator or `profiles.is_platform_admin` only (UX); RLS remains authority.
- Harness covers creator/admin update+delete, other serrano/tourist denied, cascade attendance count after creator delete.

### Change Log

- 2026-09-20: Implement edit/delete event (ZER-96); record Pencil node id `u82g5p`.

### File List

- `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`
- `src/features/events/actions.ts` (+ tests)
- `src/features/events/day.ts` (+ tests)
- `src/features/events/EventDetail.tsx` (+ tests)
- `src/features/events/EventDeleteControl.tsx` (+ tests)
- `src/app/(modal)/agenda/[id]/edit/page.tsx` (+ test, EditEventForm)
- `src/app/(app)/agenda/[id]/page.tsx` (+ test)
- `scripts/check-events-rls.harness.ts`
