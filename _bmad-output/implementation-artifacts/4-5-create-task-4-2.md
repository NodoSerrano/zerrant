# Story 4.5: Create task (4.2)

Status: ready-for-dev

Linear: [ZER-21](https://linear.app/zerrant/issue/ZER-21/45-create-task-42) · Branch: `agumarchetti/zer-21-45-create-task-42`

## Story

As a serrano creating work,
I want the create-task screen to match Pencil,
So that publishing a task feels designed and production-ready.

## Acceptance Criteria

1. **Given** Pencil frame `4.2 · Crear tarea` (`V0ODk`)
   **When** a non-tourist opens `/nodo/tasks/new`
   **Then** the header is a `space-between` row with a lucide `x` icon (24×24, `text-text-primary`) on the left, the title "Nueva tarea" (`font-display`, 16px, `font-medium`, `text-text-primary`) centered, and a 24×24 spacer on the right
   **And** the `x` is a `<button type="button">` with accessible name "Cerrar" that calls `router.back()` (`useRouter` from `next/navigation`) — it returns the user wherever they came from, not to a fixed route
   **And** when `window.history.length <= 1` (deep link, PWA shortcut, new tab, hard refresh) it falls back to `router.push("/nodo/tasks")`, so the button is never dead and never exits the app shell in standalone PWA mode
   **And** the page wrapper is `flex-col gap-[18px]`
   **(FR24, FR25)**

2. **Given** the form (`gap-4`, vertical)
   **When** rendered
   **Then** it contains, in order: `Input` with label "Título" and placeholder "Ej: Reparar el caño del baño"; a "Descripción" group; a "Categoría" group; an "Urgencia" group
   **And** every group label is `text-[13px] font-medium text-text-secondary` with `gap-[7px]` (Descripción) / `gap-2` (Categoría, Urgencia)
   **(FR24)**

3. **Given** the Descripción field
   **When** rendered
   **Then** it is a `textarea` of height 84px, `rounded-2xl bg-surface border border-border p-4`, text `text-[15px] leading-[1.4]`, placeholder "¿Qué hay que hacer y dónde?" in `text-text-muted`, and `resize-none`
   **(FR24)**

4. **Given** the Categoría selector
   **When** rendered
   **Then** it shows five pill options laid out in two rows (`gap-2` between rows and within each row): row 1 = Reparación, Limpieza, Compra; row 2 = Mantenimiento, Otro
   **And** each pill is `rounded-pill px-[14px] py-2 font-display text-[13px] font-medium`
   **And** the unselected pill is `bg-surface border border-border text-text-secondary`; the selected pill is `bg-primary text-on-primary` with no border
   **And** "Reparación" is selected by default (matching Pencil)
   **And** the control is a radio group named `categoria` whose values are `reparacion | limpieza | compra | mantenimiento | otro`
   **(FR24, FR25)**

5. **Given** the Urgencia selector
   **When** rendered
   **Then** it is a segmented control: outer `rounded-2xl bg-surface-inset p-1 gap-1`, three segments each `flex-1 h-[38px] rounded-xl` with `font-display text-[13px] font-medium`
   **And** the unselected segment has no background and `text-text-muted`; the selected segment is `bg-primary text-on-primary`
   **And** "Media" is selected by default (matching Pencil)
   **And** the control is a radio group named `urgencia` whose values are `baja | media | alta`
   **(FR24, FR25)**

6. **Given** the primary CTA
   **When** rendered
   **Then** it is a full-width `PrimaryButton` (`type="submit"`) labelled "Publicar tarea"
   **And** while the action is pending it is disabled and shows "Publicando..."
   **And** there is **no** "Cancelar" button (Pencil has none — the `x` in the header is the exit)
   **(FR25)**

7. **Given** a tourist (or a user with no profile) navigating to `/nodo/tasks/new`
   **When** the page renders on the server
   **Then** they are redirected to `/nodo/tasks` before the form is ever shown
   **And** an unauthenticated user is redirected to `/auth/login`
   **(FR26, NFR1)**

8. **Given** a serrano submitting the form
   **When** `createTask` runs
   **Then** the task is inserted with `titulo`, `descripcion`, `categoria`, `urgencia`, `creado_por`
   **And** the server-side tourist guard inside `createTask` remains intact (defence in depth — the redirect in AC7 does not replace it)
   **(FR26, NFR1)**

9. **Given** TDD
   **When** implementation is complete
   **Then** there are tests covering the form (structure, labels, defaults, selection behaviour, CTA states) and the authorization redirect
   **And** existing `src/features/tasks/actions.test.ts` still passes unmodified
   **And** `./node_modules/.bin/vitest run`, `tsc --noEmit` and `oxlint --quiet` are clean
   **(NFR2)**

10. **Out of scope**
    - The tasks hub `/nodo/tasks` (story 4.3, ZER-20 — still `backlog`). Do **not** restyle it; it stays as-is.
    - `TaskCard` (story 4.1, ZER-18 — `ready-for-dev`).
    - Task detail `/nodo/tasks/[id]` (story 4.4, ZER-22).
    - The `(app)` layout, `StatusBar`, `TabBar` — see "Known deviations".
    - Changing the `tasks` table schema or RLS.

## Tasks

- [x] **T1 — RED**: Write `src/app/(app)/nodo/tasks/new/NewTaskForm.test.tsx` covering AC1–AC6 (header, labels, placeholders, chip rows, segmented control, defaults, CTA label + pending state, no Cancelar button). — 30 tests, failed with "0 test" (module absent).
- [x] **T2 — RED**: Write `src/app/(app)/nodo/tasks/new/page.test.tsx` covering AC7 (redirect for tourist / no profile / no user; form rendered for serrano). — 7 tests, failed with `Invalid hook call` (page was still a client component).
- [x] **T3 — GREEN**: Extract the client form into `NewTaskForm.tsx` matching Pencil; convert `page.tsx` into an async server component with the tier guard. — 37/37 green.
- [x] **T4 — VERIFY**: Verified at 375px in light and dark via a temporary scratch route (deleted). Found and fixed a real 2px deviation — see "Verification findings". Gates: vitest 312/312, tsc clean, oxlint clean, oxfmt clean.

### Review Findings

Code review 2026-07-27 — 3 adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor), run on Sonnet 5. Acceptance Auditor confirmed all 10 ACs covered by code and tests, Pencil→Tailwind tables matching exactly, and no "Do NOT modify" file touched.

- [x] [Review][Decision → Patched] `router.back()` has no fallback when history is empty — **Resolved: option 1, fallback.** `window.history.length > 1 ? router.back() : router.push("/nodo/tasks")`, covered by two tests. Original finding: On a hard refresh, a deep link, a PWA home-screen shortcut, or a link opened in a new tab, `/nodo/tasks/new` is the first history entry. `back()` then no-ops (dead close button) or exits the app shell in standalone PWA mode. Raised independently by Blind Hunter and Edge Case Hunter. `router.back()` was an explicit user decision (D8), so the fallback shape needs their call. [`src/app/(app)/nodo/tasks/new/NewTaskForm.tsx:41`]
- [x] [Review][Patch — applied] A failed profile read is treated as "tourist" and silently redirects [`src/app/(app)/nodo/tasks/new/page.tsx:19`] — `.single()`'s `error` is discarded, so a timeout/RLS/network failure yields `data: null` and takes the same branch as a real tourist. A legitimate serrano gets bounced to `/nodo/tasks` with no explanation. `src/proxy.ts:46` already solves exactly this with a `NO_ROWS = "PGRST116"` constant and a comment on the reasoning — established pattern, not followed here. Same class of bug already logged in `deferred-work.md` for onboarding step1.
- [x] [Review][Patch — applied] Story section "Current state of `page.tsx` (what must be preserved)" is now stale [`_bmad-output/implementation-artifacts/4-5-create-task-4-2.md:207`] — It states `page.tsx` owns `useActionState`, the error banner and the pending state. After T3 all three live in `NewTaskForm.tsx` and `page.tsx` is a server component. A future dev reading it as ground truth looks for wiring that is not there.
- [x] [Review][Defer] `createTask` does no runtime validation and leaks raw Postgres errors [`src/features/tasks/actions.ts:29`] — deferred, pre-existing and explicitly out of scope
- [x] [Review][Defer] Empty `descripcion` is stored as `""` rather than `null` [`src/features/tasks/actions.ts:31`] — deferred, pre-existing and explicitly out of scope
- [x] [Review][Defer] Double submit can create duplicate tasks before `pending` flips [`src/app/(app)/nodo/tasks/new/NewTaskForm.tsx:129`] — deferred, pre-existing app-wide pattern
- [x] [Review][Defer] Without JS there is no way to leave the screen [`src/components/TabBar.tsx:47`] — deferred, pre-existing app-wide
- [x] [Review][Defer] The `"tourist"` literal is duplicated across the two guards [`src/app/(app)/nodo/tasks/new/page.tsx:27`] — deferred, fix requires touching an out-of-scope file

**Dismissed as noise (2):**

- *"No `maxLength` on `titulo`/`descripcion` → insert fails on long input"* — false. Both columns are unbounded `text` in `supabase/migrations/20260721232125_tasks.sql:9-10`. There is no failure mode.
- *"Forged `categoria`/`urgencia` values persist garbage"* — false. Both are Postgres enums (`task_categoria`, `task_urgencia`), so the database rejects unknown values. The surviving real concern (a raw Postgres message reaching the user) is covered by the deferred validation finding.
- *"The `pnpm-workspace.yaml` entry in `deferred-work.md` is scope creep"* — rejected. That file is the team's deferred-work ledger, not a story-scoped changelog; its existing entries come from work sessions, not from ACs. The issue was found doing this story and costs the team on every install.

## Verification findings (T4)

Measured in-browser at 375px, not eyeballed:

| Measurement                   | Pencil | Got  |
| ----------------------------- | ------ | ---- |
| header → form                 | 18     | 18 ✅ |
| last field → CTA              | 18     | ~~16~~ → 18 ✅ (fixed) |
| textarea height               | 84     | 84 ✅ |
| CTA height                    | 54     | 54 ✅ |
| urgency track / segment height| 46 / 38| 46 / 38 ✅ |
| urgency padding / gap         | 4 / 4  | 4 / 4 ✅ |
| page side padding             | 20     | 20 ✅ |

**The 16px bug:** the CTA had been nested inside `<form>` (`gap-4`), but in Pencil `a00tB` is a *sibling* of `MWvoK` under the wrapper's `gap: 18`. The class-level test asserted `gap-4` and passed — it was certifying the wrong structure. Fixed by giving the form `gap-[18px]` with an inner `gap-4` fields container, plus a new test asserting `cta.parentElement === form` so the structure can't silently regress.

Also confirmed in-browser (not provable in jsdom): the `has-checked:` variants really generate and re-style on click with **no layout shift** (the `border-primary` trick works), and the focus ring is visible on the `sr-only` radios for keyboard users.

### New deviation found — NOT fixed here

The `Input` component appends a coral `*` next to the label when `required`. Pencil's `D7fHHd` caption is just "Título", with no required state modelled at all. This is **existing DS behaviour from story 1.2** — the same asterisk shows on the login screen's Email/Contraseña — not something this story introduced. Marking required fields is also the accessible default. Changing it would touch a shared DS primitive and every form in the app, so it is logged in `deferred-work.md` rather than patched here.

## Dev Notes

### Pencil specs — frame `V0ODk` (390×844, `clip: true`, `fill: $bg`)

Padding pairs in Pencil are **`[horizontal, vertical]`** (confirmed: `Chip.tsx` renders Pencil `padding:[13,7]` as `px-[13px] py-[7px]`, and `Input.tsx` renders `padding:[16,0]` as `px-4`). 4-value arrays are `[top, right, bottom, left]`.

#### `ZqSLW` — wrapper

| Pencil                                | Tailwind                                              |
| ------------------------------------- | ----------------------------------------------------- |
| vertical, `gap: 18`                   | `flex flex-col gap-[18px]`                            |
| `padding: [6, 20, 24, 20]`            | supplied by `(app)/layout.tsx` `p-5` — see deviations |
| `width/height: fill_container`        | —                                                     |

#### `U4JBZ` — header row ("tct")

| Element | Pencil                                                       | Tailwind / React                                        |
| ------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| Row     | horizontal, `justifyContent: space_between`, `alignItems: center` | `flex items-center justify-between`                 |
| Close   | `QO7re` — lucide `x`, 24×24, `$text-primary`                 | `<button type="button" aria-label="Cerrar" onClick={() => router.back()}><X className="size-6 text-text-primary" /></button>` |
| Title   | `F2hMYZ` — "Nueva tarea", `$font-display`, 16, weight 500, `$text-primary` | `<h1 className="font-display text-base font-medium text-text-primary">` |
| Spacer  | `jSesA` — empty 24×24 frame                                  | `<span aria-hidden className="size-6" />` (keeps the title optically centred) |

#### `MWvoK` — form (vertical, `gap: 16` → `gap-4`)

**Título** — `hq9zD`, instance of the `Input` component (`D7fHHd`):

- caption `Xqq44` → "Título"
- value/placeholder `H9VEvo` → "Ej: Reparar el caño del baño"
- Reuse `@/components/Input` as-is. Its `gap-[7px]`, `h-[50px] rounded-2xl border-border bg-surface px-4 text-[15px]` already match `D7fHHd`/`on1zE`.

**Descripción** — `z4WI4S` (vertical, `gap: 7` → `gap-[7px]`):

| Element     | Pencil                                                                                       | Tailwind                                                             |
| ----------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Label       | `dJ9T4` — "Descripción", `$font-body`, 13, weight 500, `$text-secondary`                     | `text-[13px] font-medium text-text-secondary`                        |
| Field box   | `O59irA` — `height: 84`, `cornerRadius: 16`, `fill: $surface`, `stroke: $border` 1px inner, `padding: 16` | `h-[84px] rounded-2xl bg-surface border border-border p-4 resize-none` |
| Placeholder | `uFG62` — "¿Qué hay que hacer y dónde?", `$font-body`, 15, normal, `$text-muted`, `lineHeight: 1.4` | `text-[15px] leading-[1.4] placeholder:text-text-muted`         |

**Categoría** — `mYOkS` (vertical, `gap: 8` → `gap-2`), two rows `zjmnk` / `ncDeX`, each horizontal `gap: 8`:

| Element        | Pencil                                                                    | Tailwind                                                            |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Label          | `jHJaz` — "Categoría", `$font-body`, 13, weight 500, `$text-secondary`    | `text-[13px] font-medium text-text-secondary`                       |
| Pill (base)    | `cornerRadius: 999`, `padding: [14, 8]`                                   | `rounded-pill px-[14px] py-2`                                       |
| Pill text      | `$font-display`, 13, weight 500                                           | `font-display text-[13px] font-medium`                              |
| Selected `TvTd8` | `fill: $primary`, text `$on-primary`, **no stroke**                     | `bg-primary text-on-primary`                                        |
| Unselected     | `fill: $surface`, `stroke: $border` 1px inner, text `$text-secondary`      | `bg-surface border border-border text-text-secondary`               |
| Row 1          | Reparación (selected) · Limpieza · Compra                                 | —                                                                   |
| Row 2          | Mantenimiento · Otro                                                      | —                                                                   |

Pencil lays this out as two explicit rows (Pencil has no wrapping). In CSS, `flex-wrap` naturally produces the same 3+2 split at 375px, and stays correct at other widths — prefer `flex flex-wrap gap-2`.

**Urgencia** — `DDYAm` (vertical, `gap: 8` → `gap-2`), segmented control `jmLgk`:

| Element      | Pencil                                                                  | Tailwind                                             |
| ------------ | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| Label        | `ZCfbr` — "Urgencia", same style as the other labels                    | `text-[13px] font-medium text-text-secondary`        |
| Track        | `cornerRadius: 16`, `fill: $surface-inset`, `gap: 4`, `padding: 4`      | `flex gap-1 rounded-2xl bg-surface-inset p-1`        |
| Segment      | `width: fill_container`, `height: 38`, `cornerRadius: 12`, centred      | `flex-1 h-[38px] rounded-xl flex items-center justify-center` |
| Segment text | `$font-display`, 13, weight 500                                         | `font-display text-[13px] font-medium`               |
| Selected `T0ybLH` | `fill: $primary`, text `$on-primary`                               | `bg-primary text-on-primary`                         |
| Unselected   | **no fill**, text `$text-muted`                                         | `text-text-muted`                                    |
| Order        | Baja · **Media** (selected) · Alta                                       | —                                                    |

**CTA** — `a00tB`, instance of `PrimaryButton` (`qt9Zw`), `width: fill_container`, label override → "Publicar tarea".

- Reuse `@/components/PrimaryButton` with `className="w-full"`. Its `h-[54px] rounded-pill bg-linear-to-br from-brand-green to-brand-blue shadow-[0_4px_14px_rgba(17,88,176,0.33)] font-display font-medium text-on-primary` already matches `qt9Zw` exactly.

### Copy deltas vs. the current implementation

The existing page is pre-design placeholder code. These strings/elements **change**:

| Current                                  | Pencil                                       |
| ---------------------------------------- | -------------------------------------------- |
| Title "Crear tarea"                      | "Nueva tarea"                                |
| Back-arrow inline `<svg>`                | lucide `x` icon                              |
| CTA "Crear tarea" / "Creando..."         | "Publicar tarea" / "Publicando..."           |
| Second `PrimaryButton` "Cancelar"        | *removed* (Pencil has no Cancelar)           |
| Título placeholder "¿Qué hay que hacer?" | "Ej: Reparar el caño del baño"               |
| Descripción placeholder "Más detalles…"  | "¿Qué hay que hacer y dónde?"                |
| Default categoría `otro`                 | `reparacion`                                 |
| Categoría/Urgencia as plain radio rows   | pills + segmented control (see tables above) |

### Files to touch

| File                                                    | Action |
| ------------------------------------------------------- | ------ |
| `src/app/(app)/nodo/tasks/new/page.tsx`                 | UPDATE — becomes an async server component with the tier guard |
| `src/app/(app)/nodo/tasks/new/NewTaskForm.tsx`          | NEW — the `"use client"` form |
| `src/app/(app)/nodo/tasks/new/NewTaskForm.test.tsx`     | NEW |
| `src/app/(app)/nodo/tasks/new/page.test.tsx`            | NEW |

Do **not** modify `src/features/tasks/actions.ts` — `createTask` already satisfies AC8. If a change proves necessary, keep `actions.test.ts` green.

### Pre-existing behaviour that had to survive the rewrite

> Written before T3, when `page.tsx` was still a single client component. **After T3 the split is: `page.tsx` is an async server component holding only the auth/tier guard, and every item below except `dynamic` lives in `NewTaskForm.tsx`.** Kept for the rationale, not as a map of the current files.

- `export const dynamic = "force-dynamic"` — stays on `page.tsx`; the page reads auth state.
- `useActionState(createTask, null)` wiring, the `state?.error` banner, and the `pending` disabled state — keep all three, they are the only error surface for the server action. *(Now in `NewTaskForm.tsx`.)*
- Field `name` attributes `titulo` / `descripcion` / `categoria` / `urgencia` — `createTask` reads these exact keys from `FormData`. Renaming any of them silently breaks creation.
- The radio-group semantics (a `name`d group of `<input type="radio">` inside `<label>`) — keep them for accessibility and so `FormData` still carries the values. Style the pills/segments with `has-checked:` variants over a visually-hidden radio rather than switching to `<button>` + state, so the form keeps working without JS and no extra client state is needed.

### Server-side tourist guard (AC7)

Follow the pattern already used in `src/app/(app)/profile/page.tsx`:

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth/login");
const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
if (!profile || profile.tier === "tourist") redirect("/nodo/tasks");
```

`redirect` comes from `next/navigation`. Note that `redirect` throws — tests must account for that (see `actions.test.ts` for the existing `try/catch` convention).

### Testing

Vitest + Testing Library, mirroring `src/features/tasks/actions.test.ts` (which uses `vi.hoisted` mocks over `@/lib/supabase/server`) and `src/components/EmptyState.test.tsx` (class-level Pencil assertions).

| Test                        | What it verifies                                                        |
| --------------------------- | ----------------------------------------------------------------------- |
| Header                      | title "Nueva tarea", classes; lucide `x` present                        |
| Header — close              | clicking "Cerrar" calls `router.back()` (mock `useRouter`)              |
| Título field                | label "Título", placeholder, `name="titulo"`, required                  |
| Descripción field           | label, placeholder, `name="descripcion"`, `h-[84px] rounded-2xl` classes |
| Categoría options           | 5 pills with the exact labels, `name="categoria"`, correct values        |
| Categoría default           | `reparacion` is checked                                                  |
| Categoría selected style    | checked pill resolves to `bg-primary text-on-primary`                    |
| Urgencia options            | 3 segments, `name="urgencia"`, values `baja/media/alta`                  |
| Urgencia default            | `media` is checked                                                       |
| Urgencia track classes      | `rounded-2xl bg-surface-inset p-1 gap-1`                                 |
| CTA                         | submit button labelled "Publicar tarea", `w-full`                        |
| CTA pending                 | disabled + "Publicando..." when the action is pending                    |
| No Cancelar                 | no button/link labelled "Cancelar"                                       |
| Error banner                | renders `state.error` when the action returns one                        |
| Guard — no user             | redirects to `/auth/login`                                               |
| Guard — tourist             | redirects to `/nodo/tasks`, form never rendered                          |
| Guard — no profile          | redirects to `/nodo/tasks`                                               |
| Guard — serrano             | renders the form                                                         |

### Known deviations from Pencil (do NOT fix in this story)

These are cross-screen issues. Record them, raise them separately (rule 6 of the team kickoff: no systemic fixes inside a single-issue PR).

1. **Wrapper padding.** Pencil `ZqSLW` is `[6, 20, 24, 20]` (top 6 / sides 20 / bottom 24). `(app)/layout.tsx` applies a uniform `p-5` (20px) to every page. The sides match; the top is 14px too tall and the bottom 4px too short. Changing `layout.tsx` would move every screen in the app.
2. **TabBar.** Frame `V0ODk` shows a `StatusBar` and **no** TabBar — the create screen reads as a modal. `(app)/layout.tsx` renders `TabBarClient` on every route in the group. Deciding whether create-task needs its own route group is a layout-level call that affects 4.4 and 4.3 too.

Add both to `_bmad-output/implementation-artifacts/deferred-work.md`.

### Do NOT

- Do not touch `/nodo/tasks` (hub) or `/nodo/tasks/[id]` — other stories own them.
- Do not modify `(app)/layout.tsx`, `StatusBar`, `TabBar`, `Input`, `PrimaryButton`, or `Chip`.
- Do not add a "Cancelar" button back.
- Do not remove the tourist guard inside `createTask`.
- Do not change the `tasks` table or its RLS policies.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.5: Create task (4.2)`]
- [Source: `_bmad-output/specs/spec-ui-fidelity-m0-m2/screen-inventory.md` line 18 — `4.2 · Crear tarea` → `V0ODk` → `/nodo/tasks/new`, CAP-9]
- [Source: Pencil `design/nodo-serrano.pen`, frame `V0ODk` and descendants `ZqSLW`, `U4JBZ`, `MWvoK`, `z4WI4S`, `mYOkS`, `DDYAm`, `a00tB`]
- [Source: `_bmad-output/implementation-artifacts/4-2-empty-tasks-state-7-2.md` — Pencil-table + class-assertion story format]
- [Source: `src/app/(app)/profile/page.tsx` — server-side tier guard pattern]
- [Source: `src/features/tasks/actions.ts` — `createTask` contract]
- [Source: Linear ZER-21]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
