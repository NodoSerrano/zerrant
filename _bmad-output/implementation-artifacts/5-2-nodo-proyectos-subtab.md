# Story 5.2: Nodo Proyectos sub-tab and empty state (`2.4 · Nodo — Proyectos`, `7.3 · Vacío Proyectos`)

Status: review

## Linear

- **ZER-79** — Story 5.2: Sub-pestaña Proyectos en el hub Nodo (2.4) + vacío (7.3)
- URL: https://linear.app/zerrant/issue/ZER-79
- Branch: `juantandil123/zer-79-story-52-sub-pestana-proyectos-en-el-hub-nodo-24-vacio-73`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 5 — Proyectos**
- Unblocks the M5 "no dead chrome" acceptance: the Nodo Proyectos control must show real data before the milestone closes.
- Depends on story 5.1 (ZER-78) — the `projects` table must exist.

## Story

As a member browsing the Nodo,
I want the Proyectos half of the segmented control to open a real list of projects,
so that the hub stops showing a control that does nothing.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and its node ids for `2.4 · Nodo — Proyectos` and `7.3 · Vacío Proyectos` read `TBD`
   **When** this story starts
   **Then** both node ids are resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** the Nodo hub
   **When** I tap "Proyectos"
   **Then** the inert `<span className="flex-1 text-center py-2 font-display text-sm font-medium text-text-muted cursor-default">Proyectos</span>` at `src/app/(app)/nodo/tasks/page.tsx:87–89` is gone, replaced by a real navigation control (FR29, NFR12)

3. **Given** the projects route
   **When** it renders with projects in the table
   **Then** it lists real rows read from `projects` — nombre, descripcion and `estado` at minimum — matching Pencil frame `2.4 · Nodo — Proyectos` at ~390px (FR29, UX-DR15, UX-DR28)

4. **Given** the segmented control
   **When** I am on `/nodo/tasks` and when I am on the projects route
   **Then** the Tareas/Proyectos control keeps its correct active-state treatment on **both** halves and on **both** routes (UX-DR15, UX-DR28)
   **And** the Tareas list, its filters, and the task create affordance behave exactly as before — no regression (NFR19)

5. **Given** no visible projects
   **When** the projects route renders
   **Then** the screen matches Pencil frame `7.3 · Vacío Proyectos` at ~390px, with the frame's own copy and CTA — not the tasks empty state's hardcoded "No hay tareas" heading (FR30, UX-DR16, UX-DR28)

6. **Given** the design-system constraint
   **When** a project row/card is built
   **Then** it is a shared component (e.g. `src/components/ProjectCard.tsx`) composed from existing primitives, not page-local CSS (NFR17)

7. **Given** the activated-control rule
   **When** the route is reviewed
   **Then** no control in the Nodo hub still renders in its disabled or placeholder form (`cursor-default`, `text-muted/40`, `—` count) now that its backing data exists (UX-DR28, NFR12)

8. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and cover: the populated list render, the empty branch, the segmented-control navigation in both directions, and the active-state on both routes; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [x] **T0 — BLOCKING prerequisite: resolve the Pencil node ids** (AC: 1)
  - [ ] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [ ] Use `mcp__pencil__get_app_state` to locate frames `2.4 · Nodo — Proyectos` and `7.3 · Vacío Proyectos`; read their contents with the design-context tooling.
  - [ ] Record both resolved node ids into the `Node id` column of `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`, replacing `TBD`.
  - [ ] **This story is not ready for development until this task is done.** Do not start implementing from an invented layout.

- [x] **T1 — Read the framework docs** (AC: 2–7)
  - [ ] This Next.js version has breaking changes vs. training data. Read the relevant App Router guide in `node_modules/next/dist/docs/` before writing any code (per `AGENTS.md`).

- [x] **T2 — RED: failing tests first** (AC: 3, 4, 5, 8)
  - [ ] Page test for the projects route: renders rows from a mocked `projects` query.
  - [ ] Page test for the empty branch.
  - [ ] Segmented-control tests on both routes: both halves are links, the right one is active.
  - [ ] Regression assertion on `src/app/(app)/nodo/tasks/page.test.tsx`: Tareas half still active on `/nodo/tasks`, filters unchanged.
  - [ ] Verify RED.

- [x] **T3 — GREEN: extract the segmented control** (AC: 2, 4, 7)
  - [ ] Extract the Tareas/Proyectos control out of `src/app/(app)/nodo/tasks/page.tsx` into a shared component taking the active half as a prop.
  - [ ] Both halves are `next/link` navigations; neither is a `<span … cursor-default>` any more.
  - [ ] Mount it on both routes.

- [x] **T4 — GREEN: the projects route** (AC: 3, 6)
  - [ ] New route under `src/app/(app)/nodo/projects/` (adjust the path only if the resolved Pencil IA demands it — the frame is the binding part, the route is the expected shape).
  - [ ] Server component: auth guard, then read `projects`. Read is allowed for any authenticated user (story 5.1 policy).
  - [ ] Build `src/components/ProjectCard.tsx` from DS primitives and export it from `src/components/index.ts`.

- [x] **T5 — GREEN: the empty state** (AC: 5, 6)
  - [ ] Match frame `7.3 · Vacío Proyectos`.
  - [ ] `src/components/EmptyState.tsx` today hardcodes the `ClipboardList` icon and the heading "No hay tareas" — see Dev Notes. Either generalise it (icon + title as props, tasks defaults preserved) or ship a sibling component. Do **not** render "No hay tareas" on a projects screen.

- [x] **T6 — Verify** (AC: 4, 5, 8)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Visual acceptance: Pencil frame vs live route at ~390px, for both `2.4` and `7.3`.
  - [ ] Confirm no-JavaScript navigation still reaches both halves of the control.

## Dev Notes

### Current state / problem

`src/app/(app)/nodo/tasks/page.tsx` renders the segmented control at lines 83–90:

```tsx
<div className="flex rounded-pill bg-surface p-0.5 border border-border">
  <span className="flex-1 text-center py-2 font-display text-sm font-semibold bg-primary text-on-primary rounded-pill">
    Tareas
  </span>
  <span className="flex-1 text-center py-2 font-display text-sm font-medium text-text-muted cursor-default">
    Proyectos
  </span>
</div>
```

Both halves are `<span>`s. The Tareas half is styled active and the Proyectos half is dead chrome — it is not a link, has no handler, and `cursor-default` advertises that it does nothing.

**Line-number drift:** `epics-m5-m6.md` (FR29) and `screen-inventory.md` both cite `src/app/(app)/nodo/tasks/page.tsx:84`. On `main` today line 84 is the **Tareas** span's `className`; the inert Proyectos span opens at **line 87** and its label is on **line 88**. Cite 87–89 when you touch it.

### Approach

Extract the control into a shared component that takes which half is active, mount it on both routes, and make both halves real links. Then add the projects list route reading `projects` (SELECT is open to any authenticated user under the story 5.1 policy), and the `7.3` empty branch.

The route shape in `screen-inventory.md` is `/nodo/projects` — the inventory itself says routes "may be adjusted to match the Pencil IA once node ids are resolved; the frame column is the binding part." If the resolved frame implies a different IA, follow the frame and update the inventory.

### `EmptyState` is tasks-specific today — do not reuse it blind

`src/components/EmptyState.tsx` hardcodes `ClipboardList` as its icon, `"No hay tareas"` as its `<h2>`, and `"Publicar tarea"` as its default action label. Only `subtitle`, `href`, `actionLabel` and `onAction` are props. Rendering it as-is on a projects screen would put "No hay tareas" on frame `7.3 · Vacío Proyectos`, which fails UX-DR28 on key copy. Generalising it (icon + title as props, current values kept as tasks defaults) is the cleaner path and keeps NFR17 satisfied; a parallel component is acceptable if the resolved frame diverges structurally. Either way the existing `src/components/EmptyState.test.tsx` and the tasks usage must stay green.

### Files to touch

| Area      | Path                                                               | Notes                                                             |
| --------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Spec      | `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`         | Record the resolved node ids for `2.4` and `7.3` (T0)             |
| EDIT      | `src/app/(app)/nodo/tasks/page.tsx`                                | Lines 83–90: replace the inline control with the shared component |
| EDIT      | `src/app/(app)/nodo/tasks/page.test.tsx`                           | Keep the Tareas half asserted; add the active-state assertion     |
| NEW       | `src/app/(app)/nodo/projects/page.tsx` (+ `page.test.tsx`)         | Projects list route                                               |
| NEW       | `src/components/NodoTabs.tsx` (name is the implementer's call)     | Shared Tareas/Proyectos segmented control                         |
| NEW       | `src/components/ProjectCard.tsx` (+ test)                          | Shared DS component, not page-local CSS                           |
| EDIT      | `src/components/EmptyState.tsx` (+ test)                           | Generalise icon/title, or ship a sibling — see Dev Notes          |
| EDIT      | `src/components/index.ts`                                          | Export the new shared components                                  |
| Prior art | `src/components/TaskCard.tsx`, `src/app/(app)/nodo/tasks/page.tsx` | Card + list + server-component read patterns                      |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first, then implementation.
- Vitest + Testing Library. Mock `@/lib/supabase/server` following `src/app/(app)/nodo/tasks/page.test.tsx`.
- Cover: populated list, empty branch, both halves navigate, active state on both routes, and the Tareas regression.
- `pnpm test` green before done.
- Visual acceptance is Pencil frame vs live route at ~390px (UX-DR28) — fail on IA, primary-CTA placement, or key-copy divergence; minor subpixel differences are fine.

### Out of scope

- Creating a project — story 5.3.
- Project detail — story 5.4.
- Joining — story 5.5.
- The join-request queue — story 5.6.
- "Mis proyectos" on the profile — story 5.8. This route lists **all** visible projects; the personal cut lives on the profile.
- Filtering or searching projects — no frame asks for it.
- Linking tasks to projects — that relation does not exist in the PRD data model.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** open `design/nodo-serrano.pen` with any filesystem tool. It is encrypted; `mcp__pencil` only.
- **Do NOT** start implementing before the node ids are resolved and written into `screen-inventory.md`.
- **Do NOT** invent an alternate layout when the frame is unclear — raise it.
- **Do NOT** leave the Proyectos half as a `<span>` with an `onClick`. It must be a real link so no-JavaScript navigation works, exactly like the TabBar (ZER-50's whole point).
- **Do NOT** hide the dead span behind a feature flag or conditional. Delete it.
- **Do NOT** render mock/seed projects to make the screen look alive. Real rows or the empty state.
- **Do NOT** render "No hay tareas" on the projects empty screen.
- **Do NOT** regress the Tareas half: the filter pills, the `estado` query param, and the create affordance must behave identically.
- **Do NOT** duplicate the segmented control markup on two routes — one shared component.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR29: The Nodo hub Proyectos sub-tab (`2.4`) is a live route listing real projects, replacing the inert `<span … cursor-default>Proyectos</span>`"]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "UX-DR27: **Node ids are `TBD`.** Every UI story resolves its frame's node id via `mcp__pencil` … and records it back into the relevant `screen-inventory.md` before implementation."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "Never open the `.pen` file with `Read`/`rg`; it is encrypted."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md` — "Routes above are the **expected** shape and may be adjusted to match the Pencil IA once node ids are resolved; the frame column is the binding part."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md` — "fail if any control still renders in its disabled/placeholder form once its backing data exists."]
- [Source: `src/app/(app)/nodo/tasks/page.tsx:87` — `<span className="flex-1 text-center py-2 font-display text-sm font-medium text-text-muted cursor-default">`]
- [Source: `src/components/EmptyState.tsx` — `<h2 className="font-display text-[20px] font-bold text-text-primary">No hay tareas</h2>`]
- [Source: `AGENTS.md` — "UI source of truth: `design/nodo-serrano.pen`. Do not invent alternate layouts."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
