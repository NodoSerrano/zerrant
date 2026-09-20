# Story 6.6: Agenda day strip and empty state (`2.5 · Agenda`, `7.4 · Vacío Agenda`)

Status: backlog

## Linear

- **ZER-92** — Story 6.6: Agenda — tira de días (2.5) + vacío (7.4)
- URL: https://linear.app/zerrant/issue/ZER-92
- Branch: `juantandil123/zer-92-story-66-agenda-tira-de-dias-25-vacio-74`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- Unblocks M6 DoD bullet _"Se crea un evento, la gente confirma y se ve la lista de asistentes."_ — this is where an event first becomes visible — and the milestone requirement that `/agenda` no longer serves the ZER-50 stub copy.
- Depends on story 6.5 (ZER-91).

## Story

As a member,
I want an agenda that shows the node's events by day,
so that `/agenda` stops being a placeholder that apologizes for itself.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and the node ids for `2.5 · Agenda` and `7.4 · Vacío Agenda` read `TBD`
   **When** this story starts
   **Then** both node ids are resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** the ZER-50 stub copy in `src/app/(app)/agenda/page.tsx` — _"La agenda de eventos llega en un milestone posterior. Por ahora este destino existe para que la navegación del TabBar funcione sin JavaScript."_
   **When** this story lands
   **Then** that copy is **deleted** — not hidden, not conditionally rendered, not moved behind a flag (FR44, NFR12)

3. **Given** I open `/agenda`
   **When** it renders
   **Then** it shows a day strip plus the selected day's events, read from the `events` table, matching frame `2.5` at ~390px (FR44, UX-DR22, UX-DR28)

4. **Given** the day strip
   **When** I select a different day
   **Then** the listed events update to that day's events (FR44)

5. **Given** a day with no events
   **When** the agenda renders
   **Then** the screen matches frame `7.4 · Vacío Agenda` — not the tasks empty state's "No hay tareas" copy (FR45, UX-DR23, UX-DR28)

6. **Given** the `/agenda` route and the `agenda` tab in `src/components/TabBar.tsx`
   **When** this story lands
   **Then** both are **preserved**: the route path stays `/agenda`, the `agenda` entry in the `tabs` array (line 24) is unchanged, the tab keeps its active-state treatment, and **navigation to `/agenda` still works with JavaScript disabled** — which was ZER-50's entire purpose (FR44, NFR19)

7. **Given** the design-system constraint
   **When** an event row is built
   **Then** it is a shared `EventCard` component composed from existing primitives, not page-local styling (NFR17)

8. **Given** events read policy is open to any authenticated user
   **When** a tourist opens `/agenda`
   **Then** they see the events — the asymmetry is deliberate: tourists read events, they just cannot create them (FR43, FR46)

9. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and cover the day strip, day selection, the populated list, and the empty branch; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — BLOCKING prerequisite: resolve the Pencil node ids** (AC: 1)
  - [ ] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [ ] Use `mcp__pencil__get_app_state` to locate frames `2.5 · Agenda` and `7.4 · Vacío Agenda`; read their contents with the design-context tooling.
  - [ ] Record both resolved node ids into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, replacing `TBD`.
  - [ ] **This story is not ready for development until this task is done.**

- [ ] **T1 — Read the framework docs** (AC: 2–8)
  - [ ] Read the App Router guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`). Pay attention to how this version handles search params in server components, since day selection should work without JavaScript.

- [ ] **T2 — RED: failing tests first** (AC: 2, 3, 4, 5, 6, 9)
  - [ ] Page test: the stub copy string is **absent** from the rendered output.
  - [ ] Page test: the day strip renders; the selected day is marked.
  - [ ] Page test: selecting another day lists that day's events.
  - [ ] Page test: a day with no events renders the `7.4` empty state.
  - [ ] Regression test: `src/components/TabBar.test.tsx` still asserts the `agenda` tab links to `/agenda` and gets the active treatment.
  - [ ] Verify RED.

- [ ] **T3 — GREEN: day selection without JavaScript** (AC: 4, 6)
  - [ ] Drive the selected day from a URL search param (e.g. `/agenda?dia=YYYY-MM-DD`), with each day in the strip a `next/link`.
  - [ ] Default to today when the param is absent or unparseable.
  - [ ] This keeps the screen working with JavaScript disabled, which is the constraint the whole `/agenda` route was created for.

- [ ] **T4 — GREEN: the agenda** (AC: 2, 3, 5, 7, 8)
  - [ ] Rewrite `src/app/(app)/agenda/page.tsx` as a server component: auth guard, then read `events` for the selected day by `inicio` range.
  - [ ] Delete the stub `<p>` entirely.
  - [ ] Build `src/features/events/EventCard.tsx` from DS primitives; export it from `src/components/index.ts` if generic enough.
  - [ ] Empty branch per frame `7.4`. `src/components/EmptyState.tsx` hardcodes the `ClipboardList` icon and the heading "No hay tareas" — see Dev Notes before reusing it.

- [ ] **T5 — Verify** (AC: 2, 5, 6, 9)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Visual acceptance: frames `2.5` and `7.4` vs the live route at ~390px.
  - [ ] **Manual no-JavaScript check:** disable JavaScript, navigate to `/agenda` from the TabBar, and change the selected day. Both must work.
  - [ ] `rg "milestone posterior" src/` returns nothing.

## Dev Notes

### Current state / problem

`src/app/(app)/agenda/page.tsx` is eleven lines and exists only so the TabBar navigates without JavaScript:

```tsx
export default function AgendaPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-[22px] font-bold text-text-primary">Agenda</h1>
      <p className="font-body text-sm text-text-secondary leading-relaxed">
        La agenda de eventos llega en un milestone posterior. Por ahora este destino existe para que
        la navegación del TabBar funcione sin JavaScript.
      </p>
    </div>
  );
}
```

`src/components/TabBar.tsx:24` points at it: `{ id: "agenda", label: "AGENDA", href: "/agenda" }`.

### The stub is replaced, not extended

The SPEC is explicit: _"The `/agenda` stub is replaced, not extended. The placeholder copy shipped by ZER-50 must be gone; the route and the TabBar entry survive."_ Deleting the copy while keeping the route and the tab is the whole shape of this story. A conditional that shows the stub "when there are no events" is the wrong answer twice over — it keeps dead copy alive and it hides frame `7.4`.

### Preserve what ZER-50 bought

ZER-50 created this route for one reason: **the TabBar must navigate without JavaScript.** `TabBar.tsx` renders `next/link` elements, which are plain anchors — the navigation works because `/agenda` is a real route with a real page. That property must survive this story, and it extends to the new day strip: build day selection on links and a search param, not on `useState`. If the strip is a client component with click handlers, a JavaScript-disabled user gets a frozen agenda showing only today — a regression of exactly the thing the stub existed to guarantee (NFR19).

Do not change `src/components/TabBar.tsx`. `screen-inventory.md` lists it as "No change expected — the `agenda` tab must keep working."

### `EmptyState` is tasks-specific today

`src/components/EmptyState.tsx` hardcodes `ClipboardList`, the `<h2>` "No hay tareas", and the default action label "Publicar tarea". Rendering it unchanged on `7.4` would put "No hay tareas" on the agenda empty screen, failing UX-DR28 on key copy. Story 5.2 or 6.3 may already have generalised it (icon + title as props, tasks values kept as defaults) — check first, and either reuse the generalised version or do the generalisation here. Keep `src/components/EmptyState.test.tsx` and the tasks usage green either way.

### Day strip, not a calendar grid

The milestone scope says _"tira de días"_. A month-grid calendar view is explicitly out of scope. Build what frame `2.5` shows and nothing more.

### `events` has no `estado`

There is no published/cancelled lifecycle. Every row in `events` is a real event; there is nothing to filter out. If an event should not be on the agenda, it is deleted (story 6.10).

### Files to touch

| Area        | Path                                                             | Notes                                                             |
| ----------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| Spec        | `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md` | Record the resolved node ids for `2.5` and `7.4` (T0)             |
| REWRITE     | `src/app/(app)/agenda/page.tsx` (+ `page.test.tsx`)              | Stub copy deleted; real agenda                                    |
| NEW         | `src/features/events/DayStrip.tsx` (+ test)                      | Link-based day selection, no-JS safe                              |
| NEW         | `src/features/events/EventCard.tsx` (+ test)                     | Shared DS component                                               |
| NEW         | `src/features/events/types.ts`                                   | Event view-model types                                            |
| MAYBE EDIT  | `src/components/EmptyState.tsx` (+ test)                         | Generalise icon/title if not already done                         |
| DO NOT EDIT | `src/components/TabBar.tsx`                                      | The `agenda` tab stays exactly as it is                           |
| VERIFY      | `src/components/TabBar.test.tsx`                                 | Must stay green                                                   |
| Prior art   | `src/app/(app)/nodo/tasks/page.tsx`                              | Search-param-driven filtering with `next/link` pills (no-JS safe) |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- Assert the stub string is **absent** — a positive assertion that the copy is gone, so nobody can reintroduce it.
- Assert day selection changes the listed events, driven by the search param.
- Assert the empty branch renders `7.4`'s copy, not "No hay tareas".
- Keep `TabBar.test.tsx` green untouched.
- Manual no-JavaScript verification is part of done, not optional.
- `pnpm test` green before done.
- Visual acceptance per UX-DR28 at ~390px for both frames.

### Out of scope

- Creating an event — story 6.7.
- Event detail and the attendee list — story 6.8.
- RSVP — story 6.9.
- Editing or deleting an event — story 6.10.
- A month-grid calendar view — explicitly out of scope; the scope says "tira de días".
- Recurring events, ICS export, external calendar sync, capacity limits, waitlists.
- Event reminders / push notifications — parked.
- Birthdays on the agenda — M7, computed from `fecha_nacimiento`.
- Changing `TabBar.tsx`.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** open the `.pen` file with a filesystem tool, and do not start before the node ids are recorded.
- **Do NOT** keep the stub copy behind a condition, a flag, or an `isEmpty` branch. Delete it.
- **Do NOT** build day selection on `useState` / click handlers only — no-JavaScript navigation must keep working.
- **Do NOT** change the `/agenda` route path or the `agenda` entry in `TabBar.tsx`.
- **Do NOT** render "No hay tareas" on the agenda empty screen.
- **Do NOT** build a month calendar grid.
- **Do NOT** filter events by a nonexistent `estado` column.
- **Do NOT** render seeded or sample events to make the strip look populated.
- **Do NOT** restrict the read to serranos — events SELECT is open to any authenticated user.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR44: The agenda (`2.5`) renders a day strip and the selected day's events from the `events` table, replacing the ZER-50 stub at `src/app/(app)/agenda/page.tsx` while preserving the `/agenda` route and the `agenda` tab in `src/components/TabBar.tsx`."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** the `/agenda` route and the `agenda` tab in `src/components/TabBar.tsx` still work, including navigation without JavaScript (FR44, NFR19)"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md` — "the placeholder copy is deleted, not hidden or conditionally rendered; the route path `/agenda` and the `agenda` tab in `TabBar.tsx` are preserved … no-JavaScript navigation to `/agenda` must still work after the replacement."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "A month-grid calendar view. The milestone scope says _\"tira de días\"_ (day strip); a full calendar grid is not in scope."]
- [Source: `src/app/(app)/agenda/page.tsx:6` — "La agenda de eventos llega en un milestone posterior."]
- [Source: `src/components/TabBar.tsx:24` — `{ id: "agenda", label: "AGENDA", href: "/agenda" },`]
- [Source: `src/components/EmptyState.tsx` — `<h2 className="font-display text-[20px] font-bold text-text-primary">No hay tareas</h2>`]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
