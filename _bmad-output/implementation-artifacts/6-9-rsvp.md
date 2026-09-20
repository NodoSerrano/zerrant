# Story 6.9: RSVP — voy / quizás / no

Status: backlog

## Linear

- **ZER-95** — Story 6.9: RSVP (voy / quizás / no)
- URL: https://linear.app/zerrant/issue/ZER-95
- Branch: `juantandil123/zer-95-story-69-rsvp-voy-quizas-no`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- Unblocks M6 DoD bullet _"Se crea un evento, **la gente confirma** y se ve la lista de asistentes."_ — the confirming half.
- Depends on stories 6.5 (ZER-91) and 6.8 (ZER-94, the screen the control mounts on).

## Story

As a serrano,
I want to confirm whether I am going to an event and change my mind later,
so that the organizer knows who to expect.

## Acceptance Criteria

1. **Given** an event detail screen and a signed-in serrano
   **When** I choose `voy`, `quizas`, or `no`
   **Then** an `event_attendance` row is **upserted** on the primary key `(event_id, profile_id)` with that `estado` (FR48)

2. **Given** I already answered
   **When** I change my answer
   **Then** that **one** row is updated — never a second row created — and the composite PK is what guarantees it (FR48, FR43)

3. **Given** my current RSVP
   **When** the detail screen renders
   **Then** it is visible to me, and the attendee list (story 6.8) reflects my change after I answer (FR48, FR47)

4. **Given** a client that bypasses the UI
   **When** it attempts to write or modify an `event_attendance` row whose `profile_id` is not `auth.uid()`
   **Then** the write is **rejected by RLS**, not merely hidden by the UI (FR48, NFR14)

5. **Given** a tourist
   **When** they attempt to RSVP by any path
   **Then** the write is rejected — reading the attendee list is open to any authenticated user, writing is not (FR43, NFR14)

6. **Given** the enum fidelity rule
   **When** the control is built
   **Then** the UI labels may be accented Spanish ("quizás") while the stored enum value stays `quizas` (NFR15)

7. **Given** the design-system constraint
   **When** the control is rendered
   **Then** it is composed from existing primitives and mounted on the story 6.8 detail screen — not a second detail implementation (NFR17)

8. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and cover setting an RSVP, changing it, and the unauthorized third-party write; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — Read the framework docs** (AC: 1–7)
  - [ ] Read the server-actions guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).
  - [ ] This story has **no Pencil frame of its own**: the RSVP control lives on `5.1 · Detalle de evento`, whose node id story 6.8 already resolved into `screen-inventory.md`. Do not invent a separate RSVP screen.

- [ ] **T1 — RED: failing policy harness first** (AC: 1, 2, 4, 5, 8)
  - [ ] Extend `scripts/check-events-rls.harness.ts`: own-row insert OK; own-row update OK (and the row count stays 1); third-party insert rejected; third-party update rejected; third-party delete rejected; tourist write rejected.
  - [ ] An explicit case asserting that answering twice leaves exactly **one** row for `(event_id, profile_id)`.
  - [ ] Verify RED.

- [ ] **T2 — RED: failing action/component tests** (AC: 1, 2, 3, 6, 8)
  - [ ] Action test: the write is an upsert keyed on `(event_id, profile_id)` with `profile_id = auth.uid()` — never a plain insert, and never a client-supplied `profile_id`.
  - [ ] Action test: only `voy` / `quizas` / `no` are accepted; anything else is rejected by an allow-list.
  - [ ] Component test: the three options render with accented labels; the viewer's current answer is marked.
  - [ ] Component test: the submitted value is the unaccented enum value.
  - [ ] Verify RED.

- [ ] **T3 — GREEN: the action** (AC: 1, 2, 6)
  - [ ] `setRsvp(eventId, estado)` in `src/features/events/actions.ts`.
  - [ ] `upsert({ event_id, profile_id: user.id, estado }, { onConflict: "event_id,profile_id" })` — `profile_id` comes from the session, **never** from the form.
  - [ ] Validate `estado` against an explicit three-value allow-list, following `oneOf()` in `src/features/tasks/actions.ts`.
  - [ ] `revalidatePath` the detail route so the attendee list re-reads real rows.
  - [ ] Treat a 0-row result as a failure.

- [ ] **T4 — GREEN: the control** (AC: 3, 6, 7)
  - [ ] `src/features/events/RsvpControl.tsx`, composed from DS primitives, mounted at the seam story 6.8 left on `EventDetail`.
  - [ ] Reuse the label map from `src/features/events/attendance.ts` (story 6.8) — one label map, not two.
  - [ ] Show the viewer's current answer as selected.

- [ ] **T5 — Verify** (AC: 2, 4, 8)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Policy harness green; `pnpm db:check-grants` still green.
  - [ ] Manual: answer, change the answer, confirm the attendee list moves the person between groups and the row count stays 1.

## Dev Notes

### Current state / problem

After story 6.8 the attendee list renders real `event_attendance` rows, and nothing in the app can write one. The RSVP policies from story 6.5 exist and have never been exercised by a real write path.

### Approach

One server action doing an upsert on the composite primary key, and one control mounted on the existing detail screen.

### Upsert on the PK, not insert-then-update

`event_attendance` has PK `(event_id, profile_id)`: one RSVP row per person per event. Changing an answer is an upsert on that key, never a second row. A read-then-decide implementation (`select` … then `insert` or `update`) is both slower and racy — two rapid taps can produce a `23505` or a lost update. Use the upsert with an explicit `onConflict` on both columns.

### `profile_id` comes from the session

The one way this story leaks is a form field carrying `profile_id`. The action must take it from `auth.getUser()` and nowhere else. Even with the correct RLS policy in place, accepting a client-supplied `profile_id` means the app's behaviour depends entirely on the policy never regressing — and AC 4's harness case is what keeps that honest.

### Labels vs values

| Stored `estado` | UI label |
| --------------- | -------- |
| `voy`           | Voy      |
| `quizas`        | Quizás   |
| `no`            | No       |

The stored enum value is unaccented. Reuse the label map story 6.8 created; two copies drift.

### "own row only" is the whole policy

`event_attendance` INSERT / UPDATE / DELETE are all `profile_id = auth.uid()`, and the writer must be a serrano. SELECT is open to any authenticated user. There is no admin override on attendance — a platform admin does not RSVP for other people, and story 6.5 adds no such clause. The doc bullet story 6.5 writes into `docs/roadmap/Seguridad RLS.md` states exactly this: _"cada uno gestiona **su propia** asistencia."_

### Files to touch

| Area      | Path                                           | Notes                                                         |
| --------- | ---------------------------------------------- | ------------------------------------------------------------- |
| EDIT      | `src/features/events/actions.ts` (+ tests)     | `setRsvp` upsert keyed on `(event_id, profile_id)`            |
| NEW       | `src/features/events/RsvpControl.tsx` (+ test) | Three-option control from DS primitives                       |
| EDIT      | `src/features/events/EventDetail.tsx` (+ test) | Mount the control; show the viewer's current answer           |
| REUSE     | `src/features/events/attendance.ts`            | The label map and grouping helper from story 6.8              |
| EDIT      | `scripts/check-events-rls.harness.ts`          | Own-row OK; third-party and tourist rejected; one-row proof   |
| Prior art | `src/features/tasks/actions.ts`                | `oneOf()` allow-list, Spanish error constants, 0-row handling |
| Prior art | `src/features/roles/` (self-assignment flows)  | Session-derived `profile_id` discipline                       |

### Testing requirements

- **TDD mandatory (NFR11):** failing harness case first.
- **Every rejection AC is a database assertion (NFR14).** The third-party write is attempted directly against a real database.
- One harness case counts rows after two answers and asserts exactly 1.
- One action test asserts the upsert payload's `profile_id` equals the session user and is not read from the form.
- One action test asserts a bogus `estado` is refused before reaching the database.
- `pnpm test` and `pnpm db:check-grants` green before done.

### Out of scope

- The event detail screen itself — story 6.8.
- Editing or deleting the event — story 6.10.
- Withdrawing an RSVP entirely (deleting the row) — the policy permits it, but no AC or frame asks for the affordance. Raise it rather than inventing it.
- Notifying the organizer of an RSVP — push notifications are parked.
- Capacity limits, waitlists, or a `voy` cap.
- An admin RSVP-ing on someone else's behalf — no such policy clause exists and none is added.
- Guest counts ("+1") — not in the data model.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** read `profile_id` from the form, the URL, or a prop. Session only.
- **Do NOT** implement the write as select-then-insert-or-update. Upsert on the PK.
- **Do NOT** create a second attendance row for a changed answer.
- **Do NOT** store the accented `quizás`.
- **Do NOT** duplicate the label map.
- **Do NOT** cast `formData.get("estado")` — validate against the allow-list.
- **Do NOT** add an admin override for writing someone else's attendance.
- **Do NOT** build a separate RSVP screen — the control lives on `5.1`.
- **Do NOT** treat a 0-row result as success.
- **Do NOT** rely on hiding the control as the tourist block.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR48: RSVP `voy` / `quizas` / `no` can be set and changed from event detail as an upsert on `(event_id, profile_id)`; a person can write only their own attendance row."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** changing my answer updates that one row rather than creating a second (FR48, FR43)"]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** the UI labels may be accented Spanish (\"quizás\") while the stored enum value stays `quizas` (NFR15)"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "`event_attendance` has a **composite primary key** `(event_id, profile_id)`: one RSVP row per person per event. Changing an answer is an upsert on that key, never a second row."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "`event_attendance` | INSERT | **Own row only** (`profile_id = auth.uid()`), and the viewer must be a serrano"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "> - `event_attendance`: lee autenticado; cada uno gestiona **su propia** asistencia (insert/update/delete solo la fila propia)."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
