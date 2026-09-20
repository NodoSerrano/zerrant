# Story 6.8: Event detail and attendee list (`5.1 · Detalle de evento`)

Status: backlog

## Linear

- **ZER-94** — Story 6.8: Detalle de evento con lista de asistentes (5.1)
- URL: https://linear.app/zerrant/issue/ZER-94
- Branch: `juantandil123/zer-94-story-68-detalle-de-evento-con-lista-de-asistentes-51`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- Unblocks M6 DoD bullet _"Se crea un evento, la gente confirma y **se ve la lista de asistentes**."_ — the attendee list is this screen.
- Depends on stories 6.5 (ZER-91), 6.6 (ZER-92) and 6.7 (ZER-93). Story 6.9 (ZER-95) adds the RSVP control to this screen.

## Story

As a member,
I want to open an event and see who is coming,
so that I can decide whether to go.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and the node id for `5.1 · Detalle de evento` reads `TBD`
   **When** this story starts
   **Then** the node id is resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** an event detail route
   **When** it renders
   **Then** it shows titulo, descripcion, lugar, inicio and fin, matching frame `5.1` at ~390px (FR47, UX-DR24, UX-DR28)

3. **Given** an event with RSVPs
   **When** the detail renders
   **Then** the attendee list is grouped by RSVP `estado` (`voy`, `quizas`, `no`) and read from real `event_attendance` rows — **never** a count computed or faked on the client (FR47, NFR12)

4. **Given** the stored enum values are unaccented
   **When** the groups are labelled
   **Then** the Spanish UI labels may carry accents ("quizás") while the stored value stays `quizas` (NFR15)

5. **Given** any event
   **When** the detail renders
   **Then** the event's creator is identifiable on the screen (FR47)

6. **Given** the design-system constraint
   **When** attendees are rendered
   **Then** they are composed from existing primitives (`Avatar`, `Chip`) rather than page-local styling (NFR17)

7. **Given** an event with no RSVPs
   **When** the detail renders
   **Then** an empty attendee state is shown rather than a broken or blank section (FR47)

8. **Given** `event_attendance` SELECT is open to any authenticated user
   **When** a tourist opens an event
   **Then** they see the event and its attendee list — reading is public to the app; only writing is restricted (FR43)

9. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and cover the grouped list, the creator affordance, and the no-RSVP branch; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — BLOCKING prerequisite: resolve the Pencil node id** (AC: 1)
  - [ ] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [ ] Use `mcp__pencil__get_app_state` to locate frame `5.1 · Detalle de evento`; read its contents with the design-context tooling.
  - [ ] Record the resolved node id into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, replacing `TBD`.
  - [ ] **This story is not ready for development until this task is done.**

- [ ] **T1 — Read the framework docs** (AC: 2–8)
  - [ ] Read the dynamic-route / server-component guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).

- [ ] **T2 — RED: failing tests first** (AC: 2, 3, 5, 7, 9)
  - [ ] Pure grouping helper test: a mixed list of attendance rows groups into `voy` / `quizas` / `no` in a stable order, with empty groups handled.
  - [ ] Page test: the five event fields render.
  - [ ] Page test: attendees appear under their group with accented labels and unaccented stored values.
  - [ ] Page test: an event with zero attendance rows renders the empty attendee state.
  - [ ] Page test: the creator is identifiable.
  - [ ] Verify RED.

- [ ] **T3 — GREEN: data read** (AC: 2, 3, 5, 8)
  - [ ] Server component reads the `events` row and its `event_attendance` rows joined to `profiles` for names/avatars.
  - [ ] Resolve the creator from `creado_por` → `profiles`.
  - [ ] Group in a pure helper (`src/features/events/attendance.ts`) so story 6.9 can reuse it after an RSVP change.
  - [ ] Do not `select *` on `profiles` — ZER-43 revoked base-column SELECT on `tarifa_hora`. Select explicit columns.

- [ ] **T4 — GREEN: the screen** (AC: 2, 4, 6, 7)
  - [ ] Compose from `Avatar`, `Chip`, and the detail-screen shape used by `src/features/plantel/MemberDetail.tsx`.
  - [ ] Label map: `voy` → "Voy", `quizas` → "Quizás", `no` → "No". Labels are presentation only.
  - [ ] Empty attendee state per the frame.
  - [ ] Leave a clear seam where story 6.9 mounts the viewer's own RSVP control.

- [ ] **T5 — Verify** (AC: 2, 9)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Visual acceptance: frame `5.1` vs the live route at ~390px, populated and empty.

## Dev Notes

### Current state / problem

After story 6.6 the agenda lists events, but tapping one goes nowhere. The attendee list is half of the M6 events DoD bullet and does not exist.

### Approach

A server-component detail route reading the event plus its attendance rows joined to `profiles`, a pure grouping helper, and DS-composed rendering with an empty branch.

The RSVP **control** is story 6.9. This story renders the list and leaves an obvious mount point for it. Keeping them separate means the read path and the write path get their own tests instead of one entangled suite.

### Real rows, never a faked count

> the list reads real `event_attendance` rows, never a count faked from the client.

No optimistic increments, no "12 asistentes" derived from anything but the rows, no seeded sample attendees. If the read returns nothing, the screen shows the empty state. This is NFR12's production bar applied to the one number on this screen a user will actually trust.

### Accented labels, unaccented values

| Stored `estado` | UI label |
| --------------- | -------- |
| `voy`           | Voy      |
| `quizas`        | Quizás   |
| `no`            | No       |

The label is presentation; the enum value is data. Never store `quizás`, and never compare against the accented form.

### Reading is public to the app

`event_attendance` SELECT is open to any authenticated user — the attendee list is public within the app. `events` SELECT is likewise open, tourists included. Only writes are restricted (own row only, story 6.9). Do not add a serrano-only gate on this read.

### `events` has no `estado`

Nothing on this screen reflects an event lifecycle because there is none. Do not render a "cancelado" badge or similar.

### Files to touch

| Area      | Path                                                             | Notes                                                 |
| --------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| Spec      | `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md` | Record the resolved node id for `5.1` (T0)            |
| NEW       | `src/app/(app)/agenda/[id]/page.tsx` (+ `page.test.tsx`)         | Event detail route                                    |
| NEW       | `src/features/events/EventDetail.tsx` (+ test)                   | Presentational; composed from DS primitives           |
| NEW       | `src/features/events/attendance.ts` (+ `attendance.test.ts`)     | Pure grouping helper + label map; reused by story 6.9 |
| EDIT      | `src/features/events/EventCard.tsx`                              | Link each agenda card to the detail route             |
| EDIT      | `src/features/events/types.ts`                                   | Detail view-model type                                |
| Prior art | `src/features/plantel/MemberDetail.tsx`                          | Detail-screen composition, `SectionTitle`, Avatar use |
| Prior art | `src/features/tasks/TaskDetailView.tsx`                          | Detail + contextual action pattern                    |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- The grouping helper is unit-tested independently of rendering, including the all-empty case and a group with zero members while others have rows.
- Assert the labels are accented and the values are not.
- Assert the no-RSVP branch renders an empty state rather than three empty headings or nothing at all.
- Assert the creator is rendered.
- Keep `pnpm db:check-grants` green — this story changes no schema but reads `profiles`, which carries the ZER-43 column mask.
- `pnpm test` green before done.
- Visual acceptance per UX-DR28 at ~390px.

### Out of scope

- Setting or changing an RSVP — story 6.9 (the control mounts here, the behaviour ships there).
- Editing or deleting the event — story 6.10.
- Creating an event — story 6.7.
- Comments, chat, or a discussion thread on an event — chat is parked.
- Inviting people or notifying attendees — push notifications are parked.
- Capacity limits or waitlists.
- An event lifecycle badge.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** open the `.pen` file with a filesystem tool, and do not start before the node id is recorded.
- **Do NOT** compute or fake an attendee count on the client.
- **Do NOT** render sample attendees when the read returns nothing.
- **Do NOT** store or compare the accented `quizás`.
- **Do NOT** `select *` on `profiles` — ZER-43 revoked base-column SELECT on `tarifa_hora`.
- **Do NOT** gate the read on `is_non_tourist()` — events and attendance are readable by any authenticated user.
- **Do NOT** render an event lifecycle badge; there is no `estado` column on `events`.
- **Do NOT** implement the RSVP write here.
- **Do NOT** hand-roll avatars or chips.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR47: Event detail (`5.1`) shows the event fields and the attendee list grouped by RSVP `estado`, read from real `event_attendance` rows."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** the attendee list is grouped by RSVP `estado` (`voy`, `quizas`, `no`) and read from real `event_attendance` rows — never a count computed or faked on the client (FR47, NFR12)"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "`event_attendance` | SELECT | Any authenticated user — the attendee list is public to the app"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "`event_attendance.estado` has exactly `voy`, `quizas`, `no` (no accent on `quizas` in the enum, whatever the UI label says)."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "UX-DR24: Event detail with attendee list grouped by RSVP and the viewer's own RSVP control per frame `5.1 · Detalle de evento`."]
- [Source: `docs/roadmap/Seguridad RLS.md:13` — "Base table reads must omit `tarifa_hora` / avoid `select *`."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
