---
baseline_commit: 4409f696ec0937ad4511a9cc6397a6ab5d101fd5
---

# Story 1.2: PrimaryButton, SecondaryButton, and Input parity

Status: done

<!-- Story context engine — generated from epics.md, SPEC.md, component-parity.md, Pencil design, and current code -->

## Story

As a member,
I want buttons and inputs to match Pencil primitives,
so that every form and CTA feels consistent and on-brand.

## Acceptance Criteria

1. **Given** Pencil PrimaryButton (`qt9Zw`) with gradient brand-green → brand-blue, outer shadow, pill shape, and height 54
   **When** `<PrimaryButton>` renders with default props
   **Then** it is pill-shaped (`rounded-pill`), uses gradient `from-brand-green to-brand-blue` at 135°, has outer shadow (blur 14, color `#1158b055`, offset 1/4), and default height ~54px
   **And** label text uses `on-primary` color, `font-display`, weight 500, 16px
   **(FR5, UX-DR2)**

2. **Given** Pencil SecondaryButton (`TCez0`) with surface fill, border stroke, pill shape, and height 54
   **When** `<SecondaryButton>` renders with default props
   **Then** it is pill-shaped, has `bg-surface`, 1px border using `--color-border`, text color `--color-text-primary`, and default height ~54px
   **And** label uses `font-display`, weight 500, 16px
   **(FR6)**

3. **Given** Pencil Input (`D7fHHd`) with label, `rounded-[16px]` field, surface fill, and border
   **When** `<Input>` renders with a label
   **Then** label is `text-text-secondary`, 13px, `font-body`, weight 500, with 7px gap below
   **And** field has `rounded-2xl` (16px), `bg-surface`, `h-[50px]`, horizontal padding 16px, 1px `border-border`
   **And** placeholder/native input text is `text-text-muted`, 15px, `font-body`
   **And** focus ring uses `ring-primary/40`
   **And** error state uses `border-coral` and `ring-coral/40`
   **(FR7)**

4. **Given** TDD
   **When** implementation is complete
   **Then** component tests assert expected Pencil classes/attributes on each component (gradient classes, shadow, border styles, radius, heights, colors)
   **And** no `from-brand-green to-brand-mint` gradient remains in PrimaryButton
   **And** `pnpm test` passes
   **(NFR2)**

5. **Out of scope for this story**
   - Changing PrimaryButton green→mint gradient was **already replaced** — this story removes it; verify zero remaining references
   - TabBar/icons (Story 1.4)
   - Avatar/Chip/TierBadge/RoleChip (Story 1.3)
   - Any page layout fidelity
   - Changing `cn()` utils or Tailwind config beyond `globals.css` `@theme`
   - Adding new token names — reuse existing `@theme` tokens from Story 1.1

## Tasks / Subtasks

- [x] **T1 — Red: tests first** (AC: 1, 2, 3, 4)
  - [x] PrimaryButton: assert gradient `from-brand-green to-brand-blue` (not to-mint), shadow class present, pill radius, height class, `text-on-primary`
  - [x] SecondaryButton: assert `bg-surface`, `border-border` (not `border-primary`/`border-2`), `text-text-primary` (not `text-primary`), pill radius, height class
  - [x] Input: assert label classes (`text-text-secondary`, 13px), field classes (`rounded-2xl`, `bg-surface`, `h-[50px]`, `border-border`), placeholder classes, error classes
  - [x] Confirm tests FAIL on current code (mint gradient, wrong border/color classes)

- [x] **T2 — PrimaryButton fix** (AC: 1)
  - [x] Replace `from-brand-green to-brand-mint` with `from-brand-green to-brand-blue`
  - [x] Change gradient direction to `bg-linear-to-br` (135° per Pencil)
  - [x] Add shadow: `shadow-[0_4px_14px_rgba(17,88,176,0.33)]`
  - [x] Remove hover gradient swap (`hover:from-brand-mint hover:to-brand-green`) — Pencil shows no hover variant; replace with `hover:opacity-90`
  - [x] Set default size height to 54px (adjust md size class or default)

- [x] **T3 — SecondaryButton fix** (AC: 2)
  - [x] Change `border-2 border-primary` to `border border-border`
  - [x] Change `text-primary` to `text-text-primary`
  - [x] Add `bg-surface` (if not already)
  - [x] Set default size height to 54px

- [x] **T4 — Input fix** (AC: 3)
  - [x] Change field `rounded-md` to `rounded-2xl` (16px matches Pencil cornerRadius)
  - [x] Change field height from `h-12` (48px) to `h-[50px]`
  - [x] Ensure `border-border` (1px), `bg-surface` are present
  - [x] Ensure label: `text-text-secondary`, `text-[13px]`, `font-body`, `font-medium`
  - [x] Ensure placeholder: `text-text-muted`, `text-[15px]`
  - [x] Keep focus ring and error patterns (already correct)

- [x] **T5 — Grey-box search for stale class references** (AC: 4)
  - [x] `grep` for `from-brand-mint` → must be zero in PrimaryButton code (OK in designTokens docs/tests)
  - [x] `grep` for `border-primary` on button elements → ensure no SecondaryButton leak
  - [x] `grep` for `text-primary` on SecondaryButton → should be `text-text-primary`

- [x] **T6 — Verify** (AC: 4)
  - [x] `pnpm test` → 100% pass
  - [x] `pnpm typecheck`
  - [x] Manual: render PrimaryButton → green-to-blue gradient with shadow visible; SecondaryButton → surface+border; Input → pill field with label

## Dev Notes

### Pencil component specs (exact, from `design/nodo-serrano.pen`)

#### PrimaryButton (`qt9Zw`)

| Property      | Pencil value                                            | Tailwind target                                  |
| ------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Corner radius | 999                                                     | `rounded-pill`                                   |
| Fill          | Linear gradient brand-green → brand-blue, rotation 135° | `bg-linear-to-br from-brand-green to-brand-blue` |
| Shadow        | Outer, blur 14, color `#1158b055`, offset x=1 y=4       | `shadow-[0_4px_14px_rgba(17,88,176,0.33)]`       |
| Height        | 54                                                      | `h-[54px]` (default md)                          |
| Width         | 320 (design canvas)                                     | `w-full` or container-constrained                |
| Label font    | Space Grotesk, 16px, weight 500                         | `font-display text-base font-medium`             |
| Label color   | `$on-primary` = `#f8f4ed`                               | `text-on-primary`                                |
| Layout        | align-items center, justify-content center, gap 8       | `inline-flex items-center justify-center gap-2`  |

#### SecondaryButton (`TCez0`)

| Property      | Pencil value                    | Tailwind target                      |
| ------------- | ------------------------------- | ------------------------------------ |
| Corner radius | 999                             | `rounded-pill`                       |
| Fill          | `$surface` = `#fefbf6`          | `bg-surface`                         |
| Stroke        | Inside, `$border`, thickness 1  | `border border-border`               |
| Height        | 54                              | `h-[54px]`                           |
| Width         | 320                             | `w-full` or container-constrained    |
| Label font    | Space Grotesk, 16px, weight 500 | `font-display text-base font-medium` |
| Label color   | `$text-primary` = `#1a1614`     | `text-text-primary`                  |

#### Input (`D7fHHd`)

| Property          | Pencil value                   | Tailwind target                     |
| ----------------- | ------------------------------ | ----------------------------------- |
| Layout            | Vertical, gap 7                | `flex flex-col gap-[7px]`           |
| Label font        | Inter, 13px, weight 500        | `font-body text-[13px] font-medium` |
| Label color       | `$text-secondary` = `#5a5550`  | `text-text-secondary`               |
| Field radius      | 16                             | `rounded-2xl`                       |
| Field fill        | `$surface` = `#fefbf6`         | `bg-surface`                        |
| Field stroke      | Inside, `$border`, thickness 1 | `border border-border`              |
| Field height      | 50                             | `h-[50px]`                          |
| Field padding     | 16 horizontal                  | `px-4`                              |
| Placeholder font  | Inter, 15px, normal            | `font-body text-[15px] font-normal` |
| Placeholder color | `$text-muted` = `#8a847c`      | `text-text-muted`                   |

### Current code → target diff

#### PrimaryButton (`src/components/PrimaryButton.tsx`)

```
CURRENT: bg-linear-to-r from-brand-green to-brand-mint
TARGET:  bg-linear-to-br from-brand-green to-brand-blue

CURRENT: (no shadow)
TARGET:  shadow-[0_4px_14px_rgba(17,88,176,0.33)]

CURRENT: hover:from-brand-mint hover:to-brand-green
TARGET:  hover:opacity-90

CURRENT: md = h-12 (48px)
TARGET:  md = h-[54px]
```

#### SecondaryButton (`src/components/SecondaryButton.tsx`)

```
CURRENT: border-2 border-primary
TARGET:  border border-border

CURRENT: text-primary
TARGET:  text-text-primary

CURRENT: (no bg-surface — transparent)
TARGET:  bg-surface

CURRENT: hover:bg-primary/10
TARGET:  hover:bg-surface-inset  (or hover:opacity-90)

CURRENT: md = h-12 (48px)
TARGET:  md = h-[54px]
```

#### Input (`src/components/Input.tsx`)

```
CURRENT: rounded-md
TARGET:  rounded-2xl

CURRENT: h-12 (48px)
TARGET:  h-[50px]

CURRENT: gap-1.5 (6px)
TARGET:  gap-[7px]

LABEL: Already text-sm font-medium text-text-secondary — keep; Pencil wants 13px, text-sm is 14px. Use text-[13px] for precision.
```

### Files to touch (expected)

| File                                      | Action                                                             |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `src/components/PrimaryButton.tsx`        | **UPDATE** — gradient, shadow, height, hover                       |
| `src/test/PrimaryButton.test.tsx`         | **EXTEND** — test new classes (shadow, gradient direction, height) |
| `src/components/SecondaryButton.tsx`      | **UPDATE** — border thickness/color, text color, bg, height        |
| `src/components/SecondaryButton.test.tsx` | **EXTEND** — test new classes                                      |
| `src/components/Input.tsx`                | **UPDATE** — field radius, height, gap, font sizes                 |
| `src/components/Input.test.tsx`           | **EXTEND** — test new classes                                      |

### Testing strategy

- **PrimaryButton**: assert `className` contains `from-brand-green`, `to-brand-blue`, `shadow-`, `h-[54px]`, `text-on-primary`, `rounded-pill`; assert does NOT contain `from-brand-mint` or `to-brand-mint`
- **SecondaryButton**: assert `className` contains `bg-surface`, `border-border`, `text-text-primary`, `rounded-pill`, `h-[54px]`; assert does NOT contain `border-primary`, `border-2`
- **Input**: assert field has `rounded-2xl`, `h-[50px]`, `bg-surface`, `border-border`; assert label has `text-text-secondary`; assert placeholder has `text-text-muted`
- Prefer `toHaveClass` matchers over brittle full-className-string checks
- Follow existing Vitest + Testing Library patterns from component-parity codebase tests

### Architecture / stack

- Next.js 16 App Router, React 19, Tailwind v4
- Package manager: pnpm
- Tests: Vitest + Testing Library + jsdom
- Design tokens from Story 1.1 already in `globals.css` `@theme`
- `rounded-pill` = `999px`, `border-border` = `1px solid var(--color-border)`, etc.
- `src/lib/utils.ts` → `cn()` with `clsx` + `twMerge`

### Previous story learnings (Story 1.1)

- **Tokens available**: all brand, surface, text, accent colors + radii + fonts in `@theme`
- **Dark class works**: `.dark { ... }` overrides themed CSS variables; `useTheme` syncs `.dark` class via `useEffect`
- **FOUC script**: in `layout.tsx` `<head>` — do not modify
- **Test patterns**: `vi.hoisted`, `render`/`screen` from Testing Library, `toHaveClass`/`toBeInTheDocument`
- **Vitest config**: jsdom, globals: true, setup file at `src/test/setup.ts` (matchMedia mock + jest-dom)
- **Tailwind v4 `@variant dark`**: `(&:where(.dark, .dark *))` — keep; it drives `dark:` utility variants

### Grey-box search targets (post-implementation verification)

```bash
# Must return ZERO in component files (OK in docs/tests/token modules)
grep -rn 'from-brand-mint' src/components/
grep -rn 'to-brand-mint'   src/components/
grep -rn 'border-primary'  src/components/SecondaryButton.tsx
grep -rn 'border-2'        src/components/SecondaryButton.tsx
grep -rn 'rounded-md'      src/components/Input.tsx
```

### Do NOT

- Do not change `PrimaryButton` size prop API (keep `sm`/`md`/`lg` as strings; just update values)
- Do not change `SecondaryButton` size prop API
- Do not restructure `Input` component hierarchy (keep label/field/error pattern)
- Do not touch `globals.css`, `@theme` block, or design tokens
- Do not add new npm packages
- Do not change `cn()` or `utils.ts`
- Do not convert components to server components (keep `"use client"`)
- Do not rename exported component names
- Do not remove existing props interfaces — extend but don't break callers
- Do not change hover press effect `active:scale-[0.98]` on buttons (keep it)
- Do not leave intentional debt (AGENTS.md production-first)
- Do not change any page layouts or import paths

### References

- Pencil design: `design/nodo-serrano.pen` — PrimaryButton `qt9Zw`, SecondaryButton `TCez0`, Input `D7fHHd`
- Spec: `_bmad-output/specs/spec-ui-fidelity-m0-m2/SPEC.md` (CAP-2)
- Component parity: `_bmad-output/specs/spec-ui-fidelity-m0-m2/component-parity.md`
- Epics: `_bmad-output/planning-artifacts/epics.md` (Story 1.2 section)
- Previous story: `_bmad-output/implementation-artifacts/1-1-design-tokens-light-and-dark.md`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Design system: `docs/roadmap/Design system.md`
- Project rules: `AGENTS.md` (production-first, TDD)
- Design tokens module: `src/lib/designTokens.ts`
- Theme: `src/app/globals.css`, `src/lib/useTheme.ts`, `src/app/layout.tsx`

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (OpenCode)

### Debug Log References

- RED phase: `pnpm test` confirmed 8 tests failed (gradient mint→blue, missing shadow, wrong border/text classes, wrong radius/heights)
- GREEN phase: fixed all 3 components, 122/122 tests pass, typecheck clean, grey-box grep all clear

### Completion Notes List

- **PrimaryButton**: `from-brand-green to-brand-blue` + `bg-linear-to-br` (135°), shadow `[0_4px_14px_rgba(17,88,176,0.33)]`, `font-medium` (500), `hover:opacity-90`, default height `h-[54px]`
- **SecondaryButton**: `border border-border` (1px), `bg-surface`, `text-text-primary`, `hover:bg-surface-inset`, default height `h-[54px]`
- **Input**: field `rounded-2xl` (16px), `h-[50px]`, `gap-[7px]`, label `text-[13px]`, input text `text-[15px]`
- All 3 components preserved: `active:scale-[0.98]`, disabled states, error states (Input), size prop API (sm/md/lg)
- Grey-box verified: zero stale `from-brand-mint`, `border-primary`, `border-2`, `rounded-md` references in component files
- `pnpm test`: 17 files, 122 tests, all pass
- `pnpm typecheck`: clean

### Change Log

- **2026-07-23:** Implemented Pencil parity for all 3 primitives. TDD: 8 RED → 8 GREEN. PrimaryButton gradient green→blue with shadow per Pencil `qt9Zw`. SecondaryButton surface+border per Pencil `TCez0`. Input pill field per Pencil `D7fHHd`.

### File List

- `src/components/PrimaryButton.tsx` — modified (gradient, shadow, height, hover)
- `src/test/PrimaryButton.test.tsx` — modified (extended with 4 new assertions)
- `src/components/SecondaryButton.tsx` — modified (border, text, bg, height)
- `src/components/SecondaryButton.test.tsx` — modified (extended with 3 new assertions, updated size test)
- `src/components/Input.tsx` — modified (radius, height, gap, font sizes)
- `src/components/Input.test.tsx` — modified (extended with 2 new assertions)
