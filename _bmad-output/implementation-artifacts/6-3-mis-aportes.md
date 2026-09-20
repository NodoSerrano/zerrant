# Story 6.3: Mis aportes (`3.4 · Mis aportes`)

Status: backlog

## Linear

- **ZER-89** — Story 6.3: Mis aportes (3.4)
- URL: https://linear.app/zerrant/issue/ZER-89
- Branch: `juantandil123/zer-89-story-63-mis-aportes-34`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- Unblocks M6 DoD bullet _"Se registra un aporte y **aparece en el perfil**."_ — this is where it appears.
- Depends on stories 6.1 (ZER-87) and 6.2 (ZER-88).
- ⚠️ Supersedes the closed PR #27 (ZER-35). See "PR #27 is not reopened" in Dev Notes.

## Story

As a serrano,
I want a screen listing my own aportes,
so that I can see my contribution history in one place.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and the node id for `3.4 · Mis aportes` reads `TBD`
   **When** this story starts
   **Then** the node id is resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** PR #27 (ZER-35) was **closed without merging**
   **When** this story is built
   **Then** it is a clean story from scratch against the real `aportes` table — the closed PR is **not** reopened, **not** rebased, and **not** cherry-picked; it is at most a UI reference and nothing in it is treated as an existing contract (FR41)

3. **Given** I open my aportes from the profile
   **When** the screen renders
   **Then** it lists **only my own** aportes, ordered by `fecha`, showing tipo, descripcion, fecha, and monto when present, matching frame `3.4` at ~390px (FR41, UX-DR21, UX-DR28)

4. **Given** an aporte with `monto = null`
   **When** its row renders
   **Then** it renders without an empty or zeroed amount slot — no `0`, no `USD —`, no blank gap where a number would be (FR41)

5. **Given** I have no aportes
   **When** the screen renders
   **Then** it shows the designed empty state from frame `3.4`, not a blank page and not the tasks empty state's "No hay tareas" copy (FR41, UX-DR21, UX-DR28)

6. **Given** the greyed row at `src/app/(app)/profile/SerranoMenu.tsx:62–67` (the `Mis aportes` label is on line 64)
   **When** I open my profile
   **Then** that row is enabled, shows a real count instead of the `—` placeholder, and navigates here (FR41, NFR12)
   **And** none of the `text-text-primary/40`, `text-brand-green/40`, `text-text-muted/40` disabled treatments remain on it (UX-DR28)

7. **Given** I have zero aportes
   **When** the profile renders
   **Then** the row shows a real `0`, never the `—` placeholder and never a fake number (NFR12)

8. **Given** the design-system constraint
   **When** a list row is built
   **Then** it is a shared `AporteItem` component composed from existing primitives, not page-local styling (NFR17)

9. **Given** the whole screen
   **When** it is reviewed
   **Then** it contains no payment, checkout, wallet, or "pagar" affordance — aportes are recorded, never charged (NFR12)

10. **Given** TDD is mandatory
    **When** the story is claimed done
    **Then** failing tests were written first and cover the populated list, the null-monto row, the empty state, and the profile row count; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — BLOCKING prerequisite: resolve the Pencil node id** (AC: 1)
  - [ ] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [ ] Use `mcp__pencil__get_app_state` to locate frame `3.4 · Mis aportes`; read its contents with the design-context tooling.
  - [ ] Record the resolved node id into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, replacing `TBD`.
  - [ ] **This story is not ready for development until this task is done.**

- [ ] **T1 — Read the framework docs; do not touch PR #27** (AC: 2)
  - [ ] Read the App Router guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).
  - [ ] Do **not** `git checkout`, reopen, rebase, or cherry-pick PR #27 / the ZER-35 branch. Reading its diff for UI reference is permitted; importing code from it is not. Build from the resolved Pencil frame and the real `aportes` table.

- [ ] **T2 — RED: failing tests first** (AC: 3, 4, 5, 6, 7, 10)
  - [ ] Page test: renders the viewer's aportes ordered by `fecha`.
  - [ ] Page test: only the viewer's rows are requested — the query filters `profile_id = auth.uid()`.
  - [ ] `AporteItem` test: a row with `monto = null` renders no amount slot; a row with a monto renders it.
  - [ ] Page test: empty state.
  - [ ] `SerranoMenu` test: the row is a link, shows a numeric count, has no `/40` classes; zero renders `0`.
  - [ ] Standing assertion: no payment copy on the screen.
  - [ ] Verify RED.

- [ ] **T3 — GREEN: the route** (AC: 3, 5)
  - [ ] Route under `src/app/(app)/profile/aportes/` (adjust only if the resolved Pencil IA demands it).
  - [ ] Server component: auth guard, then read `aportes` where `profile_id = auth.uid()`, ordered by `fecha`.
  - [ ] Empty branch per frame `3.4`. `src/components/EmptyState.tsx` hardcodes the `ClipboardList` icon and the heading "No hay tareas" — see Dev Notes before reusing it.

- [ ] **T4 — GREEN: `AporteItem`** (AC: 4, 8)
  - [ ] `src/features/aportes/AporteItem.tsx`, composed from DS primitives; export it via `src/components/index.ts` if it is generic enough to be a component-library citizen.
  - [ ] Accented Spanish label per unaccented enum value, from the `src/features/aportes/types.ts` label map (story 6.2).
  - [ ] Conditional amount slot driven by `monto !== null` — not by truthiness, since `0` is a legitimate stored amount.

- [ ] **T5 — GREEN: the profile row** (AC: 6, 7)
  - [ ] Turn the `<div>` at `SerranoMenu.tsx:62–67` into a `next/link` in the shape of the "Editar perfil" row (lines 43–49).
  - [ ] Count comes from the server component as a prop — `SerranoMenu` is `"use client"` and must not fetch.
  - [ ] Leave the "Mis proyectos" row (lines 53–58) alone; story 5.8 owns it.

- [ ] **T6 — Verify** (AC: 3, 5, 9, 10)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Visual acceptance: frame `3.4` vs the live route at ~390px, populated and empty.

## Dev Notes

### Current state / problem

`src/app/(app)/profile/SerranoMenu.tsx:62–67` is a `<div>`, not a link, with every child at 40% opacity and a literal `—` where the count belongs:

```tsx
<div className="flex items-center gap-3 px-4 py-[15px] w-full text-text-primary/40">
  <Gift size={20} className="text-brand-green/40 shrink-0" />
  <span className="font-body text-[15px] text-left flex-1">Mis aportes</span>
  <span className="font-body text-sm text-text-muted/40">—</span>
  <ChevronRight size={18} className="text-text-muted/40 shrink-0" />
</div>
```

The "Editar perfil" row at lines 43–49 is the enabled shape to copy. There is no aportes route at all.

### PR #27 is not reopened

`3.4 · Mis aportes` was attempted in **PR #27 (ZER-35)**, which was **closed without merging** and deferred to this milestone. The decision recorded in `SPEC.md` and in `screen-inventory.md` is explicit:

> build it as a **clean story from scratch** against the real `aportes` table. The closed PR is at most a UI reference; it is not reopened, rebased, or cherry-picked.

Concretely: do not reopen the PR, do not rebase its branch onto `main`, do not cherry-pick its commits, and do not treat any decision inside it as settled. It predates the `aportes` table, so every data path in it is speculative. Reading its diff to see how the frame was interpreted is fine; copying code out of it re-imports assumptions this milestone never reviewed. If something in it looks worth keeping, re-derive it from the resolved Pencil frame instead.

### `EmptyState` is tasks-specific today

`src/components/EmptyState.tsx` hardcodes `ClipboardList`, the `<h2>` "No hay tareas", and the default action label "Publicar tarea". Only `subtitle`, `href`, `actionLabel` and `onAction` are props. Rendering it unchanged on `3.4` would put "No hay tareas" on the aportes empty screen, failing UX-DR28 on key copy. Story 5.2 may already have generalised it (icon + title as props, tasks values kept as defaults) — check first, and either reuse the generalised version or do the generalisation here. Keep `src/components/EmptyState.test.tsx` and the tasks usage green either way.

### `monto !== null`, not truthiness

`0` is a legitimate stored amount and is falsy. Drive the amount slot off an explicit null check, or a row with a real `0` will silently render as if it had no amount.

### Ordering

`fecha` is a `date` the person chose and may differ from `created_at`. The list sorts by `fecha` (the SPEC says so explicitly); do not sort by `created_at` because it happens to be present.

### Files to touch

| Area       | Path                                                             | Notes                                                  |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| Spec       | `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md` | Record the resolved node id for `3.4` (T0)             |
| NEW        | `src/app/(app)/profile/aportes/page.tsx` (+ `page.test.tsx`)     | "Mis aportes" route                                    |
| NEW        | `src/features/aportes/AporteItem.tsx` (+ test)                   | Shared row component                                   |
| EDIT       | `src/features/aportes/types.ts`                                  | Accented label map for the nine unaccented enum values |
| EDIT       | `src/app/(app)/profile/SerranoMenu.tsx` (+ test)                 | Lines 62–67 become a real link. Leave 53–58 alone.     |
| EDIT       | `src/app/(app)/profile/page.tsx`                                 | Fetch the aportes count; pass it as a prop             |
| MAYBE EDIT | `src/components/EmptyState.tsx` (+ test)                         | Generalise icon/title if story 5.2 has not already     |
| Prior art  | `src/app/(app)/profile/SerranoMenu.tsx:43–49`                    | The enabled-row shape                                  |
| Prior art  | PR #27 / ZER-35                                                  | **UI reference only** — never a code source            |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- Assert the query is scoped to the viewer — another person's aportes must never reach this screen, and the serrano-only read policy (story 6.1) is the backstop, not the filter.
- Assert the null-monto row with an explicit null fixture **and** a `0` fixture, so the truthiness bug is caught.
- Assert the disabled classes are gone from the profile row; a row reading a real count but still at 40% opacity fails UX-DR28.
- Assert the zero case renders `0`, not `—`.
- Keep a standing assertion that no payment affordance exists.
- `pnpm test` green before done.

### Out of scope

- Registering an aporte — story 6.2.
- Another member's aportes — story 6.4 (member detail).
- Editing or deleting an aporte — no policy exists; denied by design.
- Filtering or grouping by tipo, totals, or any aggregation — no frame asks for it.
- Puntos Serrano or any scoring — parked.
- Any payment, checkout or wallet affordance — parked, and the hard line of this milestone.
- The "Mis proyectos" row — story 5.8.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** reopen, rebase, or cherry-pick PR #27 / the ZER-35 branch.
- **Do NOT** open the `.pen` file with a filesystem tool, and do not start before the node id is recorded.
- **Do NOT** render `0` or an empty amount slot for a null monto, and do not drive the slot off truthiness.
- **Do NOT** leave the `—` placeholder or any `/40` opacity class on the activated row.
- **Do NOT** fabricate a count — a real `0` is correct.
- **Do NOT** fetch inside `SerranoMenu`; it is `"use client"`.
- **Do NOT** touch the "Mis proyectos" row.
- **Do NOT** render "No hay tareas" on the aportes empty screen.
- **Do NOT** sort by `created_at`.
- **Do NOT** add any payment affordance, even disabled.

### References

- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "It was attempted before in **PR #27 (ZER-35)**, which was **closed without merging** and deferred to this milestone. … The closed PR is **at most a UI reference**; it is not reopened, not rebased, and not cherry-picked, and nothing in it is treated as an existing contract."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR41: \"Mis aportes\" (`3.4`) lists the viewer's own aportes ordered by `fecha` with tipo, descripcion, fecha, and monto when present, plus a designed empty state; the \"Mis aportes\" row at `src/app/(app)/profile/SerranoMenu.tsx:64` is enabled with a real count."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "**`fecha` on an aporte is a `date`** supplied by the person, and may differ from `created_at`. The list sorts by `fecha`."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** the list is composed from a shared AporteItem component rather than page-local styling (NFR17)"]
- [Source: `src/app/(app)/profile/SerranoMenu.tsx:65` — `<span className="font-body text-sm text-text-muted/40">—</span>`]
- [Source: `src/components/EmptyState.tsx` — `<h2 className="font-display text-[20px] font-bold text-text-primary">No hay tareas</h2>`]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
