# Story 6.7: Create event (`5.2 · Crear evento`)

Status: backlog

## Linear

- **ZER-93** — Story 6.7: Crear evento (5.2)
- URL: https://linear.app/zerrant/issue/ZER-93
- Branch: `juantandil123/zer-93-story-67-crear-evento-52`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- Unblocks M6 DoD bullet _"**Se crea un evento**, la gente confirma y se ve la lista de asistentes."_ — the first clause.
- Depends on stories 6.5 (ZER-91) and 6.6 (ZER-92, the agenda the event lands on).

## Story

As a serrano,
I want to create an event,
so that the node can gather around it.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and the node id for `5.2 · Crear evento` reads `TBD`
   **When** this story starts
   **Then** the node id is resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** the create-event route as a serrano
   **When** the form renders
   **Then** it collects titulo, descripcion, lugar, inicio and fin, with the frame's datetime controls, labels and primary-CTA placement at ~390px (FR46, UX-DR25, UX-DR28)

3. **Given** a valid submission
   **When** the action runs
   **Then** an `events` row is written with `creado_por` = my profile id, and `inicio` / `fin` stored as timestamptz (FR46)

4. **Given** a submission where `fin` is earlier than `inicio`
   **When** I submit
   **Then** it is rejected with a clear Spanish message and **no row is written** (FR46)

5. **Given** a successful create
   **When** I return to the agenda
   **Then** the new event appears on its day immediately and its detail route resolves (FR46, FR44)

6. **Given** required fields are missing or blank
   **When** I submit
   **Then** the form reports it in Spanish and no row is written (FR46, NFR12)

7. **Given** a tourist
   **When** a client bypasses the UI and attempts the same insert
   **Then** the insert is **rejected by RLS**, not merely hidden by the UI (FR46, NFR14)

8. **Given** `events` has no `estado` column
   **When** the form is built
   **Then** it offers no draft / publish / cancel control and writes no lifecycle field (FR43)

9. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and cover a successful create, the `fin`/`inicio` validation, and the tourist rejection; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — BLOCKING prerequisite: resolve the Pencil node id** (AC: 1)
  - [ ] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [ ] Use `mcp__pencil__get_app_state` to locate frame `5.2 · Crear evento`; read its contents with the design-context tooling.
  - [ ] Record the resolved node id into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, replacing `TBD`.
  - [ ] **This story is not ready for development until this task is done.**

- [ ] **T1 — Read the framework docs** (AC: 2–8)
  - [ ] Read the server-actions / forms guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).

- [ ] **T2 — RED: failing tests first** (AC: 3, 4, 6, 9)
  - [ ] Pure validator test first: `fin` before `inicio` → invalid; `fin` equal to `inicio` → decide and pin the rule explicitly (the AC says "not before", so equal is allowed); `fin` after `inicio` → valid; unparseable datetimes → invalid.
  - [ ] Action test: valid submit → insert payload with `creado_por` and both timestamps.
  - [ ] Action test: invalid range → error returned, insert **not called**.
  - [ ] Action tests: blank titulo, missing inicio.
  - [ ] Page test: the five controls render per the frame; no publish/draft/cancel control exists.
  - [ ] Harness case (real database): tourist insert rejected.
  - [ ] Verify RED.

- [ ] **T3 — GREEN: the validator and the action** (AC: 3, 4, 6)
  - [ ] `src/features/events/validation.ts` with a pure `validateEventRange({ inicio, fin })` — pure so it can be reused by story 6.10's edit path without duplicating the rule.
  - [ ] `src/features/events/actions.ts` with `createEvent`: auth, validate, insert, `revalidatePath("/agenda")`, redirect.
  - [ ] Spanish error copy in the style of `src/features/tasks/actions.ts`.
  - [ ] Treat a 0-row PostgREST write as a failure, not a success.

- [ ] **T4 — GREEN: the form** (AC: 2, 5, 8)
  - [ ] Route under `src/app/(app)/agenda/new/` (adjust only if the resolved Pencil IA demands it).
  - [ ] Compose from `Input`, `PrimaryButton` and the other DS primitives (NFR17).
  - [ ] Guard the route for tourists as ergonomics; RLS is the guard.

- [ ] **T5 — Verify** (AC: 2, 5, 7, 9)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Policy harness green; `pnpm db:check-grants` still green.
  - [ ] Visual acceptance: frame `5.2` vs the live route at ~390px.
  - [ ] Create an event and confirm it appears on the right day in the agenda.

## Dev Notes

### Current state / problem

After stories 6.5 and 6.6 the `events` table exists and `/agenda` renders it, but nothing can create an event, so the agenda is permanently empty and frame `7.4` is the only state anyone ever sees.

### Approach

A form matching frame `5.2`, a **pure** range validator, and a server action that inserts with `creado_por = auth.uid()`.

Pulling the range rule into its own pure function is deliberate: story 6.10 (edit event) must apply the same rule, and FR46 is explicitly re-cited there. One function, two call sites, one test suite — rather than two subtly different implementations that drift.

### Timezone care

`inicio` and `fin` are `timestamptz`. A datetime input yields a local-time string with no zone; converting it is a decision, not an accident. Pick one approach, write it down in the Completion Notes, and make sure the agenda's day bucketing (story 6.6) and this form agree — otherwise an event created for "today at 23:30" can land on tomorrow's strip. The tests should include at least one near-midnight case.

### `events` has no `estado`

There is no draft, published, or cancelled state. The form creates a real event immediately. Cancelling means deleting (story 6.10). Do not add a lifecycle control because the frame has space for one.

### Tourists read, serranos write

`events` SELECT is open to any authenticated user; INSERT requires `public.is_non_tourist()`. A tourist can browse the agenda and cannot create — the asymmetry is intentional. Hiding the create button from tourists is ergonomics; AC 7 is proven by a direct insert that the database refuses.

### Files to touch

| Area      | Path                                                               | Notes                                                           |
| --------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Spec      | `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`   | Record the resolved node id for `5.2` (T0)                      |
| NEW       | `src/app/(app)/agenda/new/page.tsx` (+ `page.test.tsx`)            | Create-event route                                              |
| NEW       | `src/features/events/actions.ts` (+ `actions.test.ts`)             | `createEvent`                                                   |
| NEW       | `src/features/events/validation.ts` (+ `validation.test.ts`)       | Pure `validateEventRange` — reused by story 6.10                |
| NEW       | `src/features/events/EventForm.tsx`                                | Composed from DS primitives; reused by story 6.10 for prefill   |
| EDIT      | `src/features/events/types.ts`                                     | Form input types                                                |
| EDIT      | `scripts/check-events-rls.harness.ts`                              | Tourist insert rejected                                         |
| EDIT      | `src/app/(app)/agenda/page.tsx`                                    | Entry point to the create route, for serranos                   |
| Prior art | `src/features/tasks/actions.ts`, `src/features/tasks/TaskForm.tsx` | Action + form patterns, Spanish error constants, 0-row handling |

### Testing requirements

- **TDD mandatory (NFR11):** the pure validator test comes first.
- The range rule is tested exhaustively at the boundary: `fin < inicio`, `fin == inicio`, `fin > inicio`, and unparseable input.
- At least one near-midnight case, to pin the timezone decision.
- **The tourist rejection is a database assertion (NFR14).** A hidden button is not evidence.
- Assert the action does **not** call the insert when validation fails.
- `pnpm test` green before done.
- Visual acceptance per UX-DR28 at ~390px.

### Out of scope

- Event detail and the attendee list — story 6.8.
- RSVP — story 6.9.
- Editing or deleting an event — story 6.10 (which reuses the validator and the form shell from this story).
- Recurring events, ICS export, external calendar sync, capacity limits, waitlists.
- Inviting specific people, or notifying anyone — push notifications are parked.
- A draft/publish lifecycle.
- Attaching an image or file to an event — no frame asks for it.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** open the `.pen` file with a filesystem tool, and do not start before the node id is recorded.
- **Do NOT** inline the range rule in the action — story 6.10 needs it too.
- **Do NOT** let an invalid range reach the database and rely on a constraint error for the user-facing message.
- **Do NOT** write a `estado`, `publicado` or `cancelado` value — the column does not exist.
- **Do NOT** rely on the route guard as the tourist block.
- **Do NOT** treat a 0-row PostgREST write as success.
- **Do NOT** silently coerce an unparseable datetime to `now()`.
- **Do NOT** restrict the agenda read to serranos while doing this work.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR46: Any serrano creates an event (`5.2`) with titulo, descripcion, lugar, inicio, fin; `fin` is validated as not before `inicio`; tourists are blocked by RLS."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** submitting a `fin` earlier than `inicio` is rejected with a clear message and no row is written (FR46)"]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** the `fin` not-before-`inicio` validation from story 6.7 applies on edit too (FR46)" (story 6.10)]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "`events` has **no `estado` column** in the PRD."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "Read scope for events is any authenticated user, including tourists."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "UX-DR25: Create-event form IA, datetime controls, and primary CTA per frame `5.2 · Crear evento`."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
