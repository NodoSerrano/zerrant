---
baseline_commit: 4409f696ec0937ad4511a9cc6397a6ab5d101fd5
---

# Story 1.3: Avatar, Chip, TierBadge, and RoleChip parity

Status: done

<!-- Story context engine — generated from epics.md, SPEC.md, component-parity.md, Pencil MCP, and current code -->

## Story

As a member,
I want identity and status chips to match Pencil,
so that tiers, roles, and avatars read correctly across screens.

## Acceptance Criteria

1. **Given** Pencil Avatar (`aaHkg`) with gradient fallback, initials, and sizes
   **When** `<Avatar>` renders without `src`
   **Then** fallback shows `brand-mint → brand-blue` gradient at 135° (not solid `bg-primary`), initials in `on-primary` color, `font-display`, weight 700 (bold), and text size matches the component size (18px for md/default 48px, proportionally for sm/lg)
   **And** when `src` is provided, renders an `<Image>` (existing behavior, no change)
   **(FR3)**

2. **Given** Pencil Chip (`MSKvX`) with pill shape, inset fill, border, and specific padding
   **When** `<Chip>` renders with default variant
   **Then** it has `rounded-pill`, `bg-surface-inset`, `border border-border` (1px, Pencil stroke), padding 13px horizontal / 7px vertical, `font-body`, 12px text, weight 500, `text-text-secondary`
   **And** colored variants (mint/blue/violet/coral/yellow/orange) keep their existing `raw/20` backgrounds and brand text colors — only the base shape/padding changes
   **(FR4)**

3. **Given** Pencil TierBadge (`wv7cW`) with pill shape and specific padding/font
   **When** `<TierBadge>` renders for any tier
   **Then** it has `rounded-pill` (not `rounded-md`), padding 11px horizontal / 5px vertical, `font-display`, weight 600, 12px text
   **And** existing tier-to-color mapping (tourist=situated, scholar=blue, standard=mint, founder=yellow) preserved as domain logic — only the structural shape changes
   **(FR9)**

4. **Given** Pencil RoleChip (`Xk6Li`) with pill shape, icon + label, and no border
   **When** `<RoleChip>` renders unconfirmed
   **Then** it has `rounded-pill`, `bg-surface-inset`, **no border** (Pencil has no stroke), padding 11px horizontal / 6px vertical, gap between icon/label 5px
   **And** confirmed state keeps its `bg-primary/10 border-primary/30 text-primary` styling (code invention, no Pencil variant — preserve)
   **And** pending confirmation dot and title remain
   **(FR10)**

5. **Given** TDD
   **When** implementation is complete
   **Then** component tests assert Pencil-correct classes: gradient on Avatar, border on Chip, `rounded-pill` on TierBadge, no border on unconfirmed RoleChip, padding values, font weights
   **And** no regression on existing variant/state tests
   **And** `pnpm test` passes
   **(NFR2)**

6. **Out of scope**
   - Changing tier-to-color mapping (domain logic, not Pencil parity)
   - Changing confirmed RoleChip styling
   - Adding/removing RoleChip dot indicator
   - Wiring avatar storage upload (Story 3.1)
   - TabBar (Story 1.4)
   - Any page layout fidelity

## Tasks / Subtasks

- [x] **T1 — Red: tests first** (AC: 1–5)
  - [x] Avatar: assert gradient `from-brand-mint to-brand-blue` on fallback (not `bg-primary`), `font-bold`, `text-on-primary`, `text-lg` for md
  - [x] Chip: assert `border-border`, padding `px-[13px] py-[7px]` on all variants
  - [x] TierBadge: assert `rounded-pill` (not `rounded-md`), `px-[11px] py-[5px]`
  - [x] RoleChip: assert NO `border` on unconfirmed, `px-[11px] py-[6px]`, `gap-[5px]`
  - [x] Confirm tests FAIL on current code (wrong gradient, radius, padding, border)

- [x] **T2 — Avatar fix** (AC: 1)
  - [x] Replace `bg-primary` with `bg-linear-to-br from-brand-mint to-brand-blue`
  - [x] Change fallback font weight from `font-medium` to `font-bold` (700)
  - [x] Update text size map: md → `text-lg` (18px), sm → `text-sm` (14px, from 12px), lg → `text-xl` (20px, from 18px)
  - [x] Keep `rounded-full`, `text-on-primary`, `font-display`
  - [x] Keep Image branch unchanged (src → Next Image)

- [x] **T3 — Chip fix** (AC: 2)
  - [x] Add `border border-border` to base classes
  - [x] Change `px-3 py-1` to `px-[13px] py-[7px]`
  - [x] Keep existing variant color system (default/situated, mint, blue, violet, coral, yellow, orange)
  - [x] Keep `rounded-pill`, `font-medium`, `text-xs`

- [x] **T4 — TierBadge fix** (AC: 3)
  - [x] Change `rounded-md` to `rounded-pill`
  - [x] Change `px-3 py-1` to `px-[11px] py-[5px]`
  - [x] Keep `font-display`, `font-semibold`, `text-xs`
  - [x] Keep existing tier style and label maps (tourist/scholar/standard/founder)

- [x] **T5 — RoleChip fix** (AC: 4)
  - [x] Remove `border-border` from unconfirmed state (Pencil has no stroke)
  - [x] Change `px-3 py-1` to `px-[11px] py-[6px]`
  - [x] Change `gap-1` to `gap-[5px]`
  - [x] Keep confirmed state styling (`bg-primary/10 border-primary/30 text-primary`)
  - [x] Keep pending dot indicator

- [x] **T6 — Verify** (AC: 5)
  - [x] `pnpm test` → 100% pass
  - [x] `pnpm typecheck`
  - [x] Grey-box: grep for `bg-primary` in Avatar fallback (must be replaced by gradient), `rounded-md` in TierBadge (must be `rounded-pill`), `border-border` in RoleChip unconfirmed (must be absent)

## Dev Notes

### Pencil component specs (exact, from `design/nodo-serrano.pen`)

#### Avatar (`aaHkg`)

| Property      | Pencil value                                                | Tailwind target                                                |
| ------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Size          | 48×48 (default)                                             | `size-12` (48px)                                               |
| Corner radius | 999                                                         | `rounded-full`                                                 |
| Fallback fill | Gradient brand-mint → brand-blue, rotation 135°             | `bg-linear-to-br from-brand-mint to-brand-blue`                |
| Initials      | "NS" (example), on-primary, Space Grotesk, 18px, weight 700 | `text-on-primary font-display text-lg font-bold`               |
| Layout        | Vertical, center, center                                    | `flex flex-col items-center justify-center` (or `inline-flex`) |

> **Note:** Pencil shows only ONE size (48px). Current code has sm=32, md=48, lg=80. Keep all sizes; proportionally scale text.

#### Chip (`MSKvX`)

| Property      | Pencil value                   | Tailwind target                 |
| ------------- | ------------------------------ | ------------------------------- |
| Corner radius | 999                            | `rounded-pill`                  |
| Fill          | `$surface-inset`               | `bg-surface-inset`              |
| Stroke        | Inside, `$border`, thickness 1 | `border border-border`          |
| Padding       | [13, 7] (horizontal, vertical) | `px-[13px] py-[7px]`            |
| Label font    | Inter, 12px, weight 500        | `font-body text-xs font-medium` |
| Label color   | `$text-secondary`              | `text-text-secondary`           |

> **Note:** Pencil shows only one "default" variant. Colored variants (mint/blue/violet/coral/yellow/orange) are code-domain additions — keep them but apply base shape changes to all.

#### TierBadge (`wv7cW`)

| Property      | Pencil value                           | Tailwind target                              |
| ------------- | -------------------------------------- | -------------------------------------------- |
| Corner radius | 999                                    | `rounded-pill`                               |
| Fill          | `#1158b018` (brand-blue ~9.4% opacity) | domain-specific (keep existing tier mapping) |
| Padding       | [11, 5] (horizontal, vertical)         | `px-[11px] py-[5px]`                         |
| Label font    | Space Grotesk, 12px, weight 600        | `font-display text-xs font-semibold`         |
| Label color   | `$brand-blue`                          | domain-specific                              |

> **Note:** Pencil shows only "Standard" tier in blue. Current tier mapping is domain logic — preserve it. Only fix shape (radius → pill, padding → Pencil values).

#### RoleChip (`Xk6Li`)

| Property      | Pencil value                            | Tailwind target                                   |
| ------------- | --------------------------------------- | ------------------------------------------------- |
| Corner radius | 999                                     | `rounded-pill`                                    |
| Fill          | `$surface-inset`                        | `bg-surface-inset`                                |
| Stroke        | **None**                                | remove `border-border` from unconfirmed           |
| Padding       | [11, 6] (horizontal, vertical)          | `px-[11px] py-[6px]`                              |
| Gap           | 5                                       | `gap-[5px]`                                       |
| Icon          | lucide "server", `$brand-violet`, 13×13 | keep existing (if icon changes needed, Story 1.4) |
| Label font    | Inter, 12px, weight 500                 | `font-body text-xs font-medium`                   |
| Label color   | `$text-secondary`                       | `text-text-secondary`                             |

> **Note:** Confirmed state and dot indicator are code-domain features not in Pencil — preserve them. Pencil RoleChip has an icon; current code does not use icons (dot indicator instead). Don't add Pencil icons unless explicitly requested.

### Current code → target diff

#### Avatar

```
CURRENT: bg-primary text-on-primary ... font-medium
TARGET:  bg-linear-to-br from-brand-mint to-brand-blue text-on-primary ... font-bold

CURRENT: sm="text-xs" (12px), md="text-sm" (14px), lg="text-lg" (18px)
TARGET:  sm="text-sm" (14px), md="text-lg" (18px), lg="text-xl" (20px) [Pencil-proportional]
```

#### Chip

```
CURRENT: px-3 py-1 text-xs font-medium (no border)
TARGET:  px-[13px] py-[7px] text-xs font-medium border border-border
```

#### TierBadge

```
CURRENT: rounded-md px-3 py-1
TARGET:  rounded-pill px-[11px] py-[5px]
```

#### RoleChip

```
CURRENT: gap-1 px-3 py-1 ... bg-surface-inset border-border text-text-secondary
TARGET:  gap-[5px] px-[11px] py-[6px] ... bg-surface-inset text-text-secondary (no border)
```

### Files to touch

| File                                | Action                                                            |
| ----------------------------------- | ----------------------------------------------------------------- |
| `src/components/Avatar.tsx`         | **UPDATE** — gradient fallback, font weight, text sizes           |
| `src/components/Avatar.test.tsx`    | **EXTEND** — gradient class assertions, font-bold, new text sizes |
| `src/components/Chip.tsx`           | **UPDATE** — add border, change padding                           |
| `src/components/Chip.test.tsx`      | **EXTEND** — border/padding assertions                            |
| `src/components/TierBadge.tsx`      | **UPDATE** — radius pill, change padding                          |
| `src/components/TierBadge.test.tsx` | **EXTEND** — rounded-pill, padding assertions                     |
| `src/components/RoleChip.tsx`       | **UPDATE** — remove border from unconfirmed, change padding/gap   |
| `src/components/RoleChip.test.tsx`  | **EXTEND** — no border on unconfirmed, padding/gap assertions     |

### Testing strategy

- **Avatar**: assert fallback `className` contains: `from-brand-mint`, `to-brand-blue`, `bg-linear-to-br`, `font-bold`, `text-on-primary`; assert does NOT contain `bg-primary` (solid brand green); assert `text-lg` for md size
- **Chip**: assert default variant has `border-border`, `px-[13px]`, `py-[7px]`; colored variants also have the new padding and border (since border is in base classes)
- **TierBadge**: assert `rounded-pill` (not `rounded-md`), `px-[11px]`, `py-[5px]`
- **RoleChip**: assert unconfirmed does NOT have `border-border`; assert `px-[11px]`, `py-[6px]`, `gap-[5px]`
- Prefer `toHaveClass` for exact class matches; use `not.toHaveClass` for absence assertions
- Keep all existing assertions passing (label rendering, variant colors, states, custom className)

### Architecture / stack

- Next.js 16 App Router, React 19, Tailwind v4
- Package manager: pnpm
- Tests: Vitest + Testing Library + jsdom
- `rounded-pill` = `999px`, `rounded-full` = `9999px` — both circular, `rounded-full` used on Avatar (Image compatibility), `rounded-pill` on chips/badges
- Design tokens from Story 1.1: all brand/surface/text/accent colors in `@theme`
- Story 1.2 buttons/input are done; don't touch them

### Previous story learnings

- **Story 1.1**: tokens, dark class, FOUC script done; `useTheme` syncs `.dark` via `useEffect`
- **Story 1.2**: PrimaryButton green→blue + shadow done; SecondaryButton surface+border done; Input pill 50px done. Review APPROVED with Low-only polish (button gap-2, Input font-body — these are low priority and out of scope for 1.3)
- **Test patterns**: `toHaveClass`, `not.toHaveClass`, `className` string matching for arbitrary values; `vi.hoisted` for module mocking; `render`/`screen` from Testing Library

### Grey-box search targets (post-implementation)

```bash
# Must return ZERO in component files
grep -rn 'rounded-md'    src/components/TierBadge.tsx
grep -rn 'bg-primary'    src/components/Avatar.tsx      # must be gradient, not solid
grep -rn 'border-border' src/components/RoleChip.tsx    # must NOT be on unconfirmed
grep -rn 'px-3 py-1'     src/components/Chip.tsx        # must be new padding
grep -rn 'px-3 py-1'     src/components/TierBadge.tsx   # must be new padding
grep -rn 'px-3 py-1'     src/components/RoleChip.tsx    # must be new padding
grep -rn 'gap-1'         src/components/RoleChip.tsx    # must be gap-[5px]
```

### Do NOT

- Do not change tier-to-color mapping (tourist/scholar/standard/founder colors are domain logic)
- Do not change confirmed RoleChip styling
- Do not remove RoleChip dot indicator or `title` attribute
- Do not add icons to RoleChip (Pencil has `lucide` server icon; out of scope unless trivial)
- Do not change Avatar `Image` branch (src → Next Image rendering)
- Do not change size prop API (keep sm/md/lg strings)
- Do not remove any Chip variant colors
- Do not touch `globals.css`, `@theme`, or design tokens
- Do not modify PrimaryButton, SecondaryButton, Input (Story 1.2 work)
- Do not leave intentional tech debt

### References

- Pencil: `design/nodo-serrano.pen` — Avatar `aaHkg`, Chip `MSKvX`, TierBadge `wv7cW`, RoleChip `Xk6Li`
- Spec: `_bmad-output/specs/spec-ui-fidelity-m0-m2/SPEC.md` (CAP-2)
- Component parity: `_bmad-output/specs/spec-ui-fidelity-m0-m2/component-parity.md`
- Epics: `_bmad-output/planning-artifacts/epics.md` (Story 1.3 section)
- Story 1.1: `_bmad-output/implementation-artifacts/1-1-design-tokens-light-and-dark.md`
- Story 1.2: `_bmad-output/implementation-artifacts/1-2-primarybutton-secondarybutton-and-input-parity.md`
- Sprint: `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (OpenCode)

### Debug Log References

- RED phase: `pnpm test` confirmed 8 tests failed (gradient, border, radius, padding across all 4 components)
- GREEN phase: fixed all 4 components, 129/129 tests pass, typecheck clean, grey-box grep all clear

### Completion Notes List

- **Avatar**: replaced `bg-primary` solid with `bg-linear-to-br from-brand-mint to-brand-blue` gradient (135°), changed `font-medium` to `font-bold` (700), scaled text sizes: sm→`text-sm` (14px), md→`text-lg` (18px), lg→`text-xl` (20px). Image branch unchanged.
- **Chip**: added `border border-border` (1px stroke per Pencil), changed padding from `px-3 py-1` (12/4) to `px-[13px] py-[7px]` (13/7). All 7 variant colors preserved.
- **TierBadge**: changed `rounded-md` to `rounded-pill`, padding `px-3 py-1` → `px-[11px] py-[5px]`. Tier-to-color mapping (tourist/scholar/standard/founder) preserved.
- **RoleChip**: removed `border-border` from unconfirmed state (Pencil has no stroke), added explicit `border` to confirmed state for clarity. Padding `px-3 py-1` → `px-[11px] py-[6px]`, gap `gap-1` → `gap-[5px]`. Dot indicator and confirmed styling preserved.
- `pnpm test`: 17 files, 129 tests, all pass
- `pnpm typecheck`: clean
- Grey-box grep: all 7 stale class searches returned zero

### Change Log

- **2026-07-24:** Implemented Pencil parity for Avatar, Chip, TierBadge, RoleChip. TDD: 8 RED → 8 GREEN. Avatar gradient mint→blue per Pencil `aaHkg`. Chip border+padding per `MSKvX`. TierBadge pill+padding per `wv7cW`. RoleChip no-border+padding+gap per `Xk6Li`.

### File List

- `src/components/Avatar.tsx` — modified (gradient, font-bold, text sizes)
- `src/components/Avatar.test.tsx` — modified (extended with 3 new assertions)
- `src/components/Chip.tsx` — modified (border, padding)
- `src/components/Chip.test.tsx` — modified (extended with 2 new assertions)
- `src/components/TierBadge.tsx` — modified (pill radius, padding)
- `src/components/TierBadge.test.tsx` — modified (extended with 1 new assertion)
- `src/components/RoleChip.tsx` — modified (removed border from unconfirmed, padding, gap)
- `src/components/RoleChip.test.tsx` — modified (updated unconfirmed assertion + 1 new assertion)
