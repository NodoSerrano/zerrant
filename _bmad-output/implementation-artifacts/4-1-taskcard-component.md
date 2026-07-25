---
baseline_commit: TBD
---

# Story 4.1: TaskCard component

Status: ready-for-dev

<!-- Story context engine — from epics.md Story 4.1, SPEC.md CAP-3, component-parity.md, and Pencil frame cboAZ. -->

## Story

As a serrano browsing work,
I want each task shown as a Pencil TaskCard,
so that urgency, estado, and actions are scannable.

## Acceptance Criteria

### 1. Card container matches Pencil (FR11, UX-DR4)

**Given** Pencil TaskCard `cboAZ`
**When** a TaskCard renders
**Then** the card root has:

- `rounded-[20px]`, `bg-surface`, `border border-border`, `shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)]`
- `p-4`, `flex flex-col gap-3`, `w-full`
  **And** the shadow matches Pencil: blur 30, y-offset 10, spread -12, color `#1a1614` at ~15% opacity

### 2. Row 1 — Header (icon + title/meta + estado chip) (FR11)

**Given** Pencil TaskCard header row
**When** TaskCard renders with any valid props
**Then** the header is a horizontal row with `flex items-center gap-3 w-full`

#### 2a. Icon circle

**Then** the icon container is `size-10 rounded-xl bg-warm-yellow/[0.09] flex items-center justify-center`
**And** renders a Lucide icon at `size-[18px] text-warm-orange`
**And** the icon maps from `category` prop:

| category      | Lucide icon                |
| ------------- | -------------------------- |
| Reparación    | `Wrench`                   |
| Limpieza      | `SprayCan`                 |
| Compra        | `ShoppingCart`             |
| Mantenimiento | `Settings`                 |
| Otro          | `MoreHorizontal`           |
| any unmatched | `MoreHorizontal` (default) |

#### 2b. Text column

**Then** the text column is `flex-1 flex flex-col gap-0.5`
**And** title is `font-display text-[15px] font-medium text-text-primary truncate` showing the `title` prop
**And** meta is `font-body text-xs font-normal text-text-muted` showing `"{category} · {timeAgo}"` (e.g. "Reparación · hace 2 días")

#### 2c. Estado chip

**Then** renders a pill chip: `shrink-0 rounded-pill px-[11px] py-[5px] font-display text-xs font-semibold`
**And** color mapping by `estado` prop:

| estado  | bg class         | text class        | label     |
| ------- | ---------------- | ----------------- | --------- |
| abierta | `bg-blue-raw/20` | `text-brand-blue` | "Abierta" |
| tomada  | `bg-coral/20`    | `text-coral`      | "Tomada"  |
| hecha   | `bg-mint-raw/20` | `text-brand-mint` | "Hecha"   |

### 3. Row 2 — Footer (urgency + action button) (FR11)

**Given** Pencil TaskCard footer
**When** TaskCard renders with valid props
**Then** the footer is `flex justify-between items-center w-full`

#### 3a. Urgency

**Then** the urgency group is `flex items-center gap-[5px]`
**And** renders a `<Flame size={14} />` Lucide icon
**And** urgency text is `font-body text-xs font-normal`
**And** color mapping by `urgencia` prop:

| urgencia                                                                                            | icon color         | text color         |
| --------------------------------------------------------------------------------------------------- | ------------------ | ------------------ |
| alta                                                                                                | `text-warm-orange` | `text-warm-orange` |
| media                                                                                               | `text-warm-yellow` | `text-warm-yellow` |
| baja                                                                                                | `text-text-muted`  | `text-text-muted`  |
| **And** the text label is: alta → "Urgencia alta", media → "Urgencia media", baja → "Urgencia baja" |

#### 3b. Action button

**Then** the action button is `shrink-0 rounded-pill bg-surface-inset border border-border px-4 py-[7px]`
**And** button text is `font-display text-[13px] font-semibold text-brand-green` showing the `actionLabel` prop
**And** clicking fires `onAction` when provided
**And** if `onAction` is omitted, the button renders but clicking does not throw

### 4. Variant coverage and className (NFR2)

**Given** all possible prop combinations
**When** TaskCard renders
**Then** every estado variant (abierta, tomada, hecha) renders the correct chip colors
**And** every urgencia variant (alta, media, baja) renders the correct flame icon + text colors
**And** every recognized category renders the correct icon
**And** unknown categories fall back to `MoreHorizontal` without crashing
**And** a custom `className` merges via `cn()` without clobbering base classes
**And** missing `onAction` renders the button without errors (no throw)
**And** `pnpm test` passes (NFR2)

### 5. Out of scope

- **No** Next.js `<Link>` or navigation — this is a domain/presentation component only
- **No** DS primitives (Avatar, Chip, TierBadge, etc.) — those are Epic 1, already done
- **No** task state logic or mutations — domain logic stays in pages
- **No** `globals.css` or `@theme` changes — tokens already exist from Epic 1
- **No** screen-level wiring — Story 4.3 (Nodo tasks hub) consumes this component

## Props Interface

```ts
interface TaskCardProps {
  title: string;
  category: string; // "Reparación" | "Limpieza" | "Compra" | "Mantenimiento" | "Otro"
  timeAgo: string; // "hace 2 días"
  estado: "abierta" | "tomada" | "hecha";
  urgencia: "alta" | "media" | "baja";
  actionLabel: string; // "Tomar" | "Terminar" | etc.
  onAction?: () => void;
  className?: string;
}
```

## Pencil → Tailwind Token Map

| Pencil property          | Pencil value                           | Tailwind class                                   |
| ------------------------ | -------------------------------------- | ------------------------------------------------ |
| Card cornerRadius        | 20                                     | `rounded-[20px]`                                 |
| Card fill                | `$surface`                             | `bg-surface`                                     |
| Card stroke              | `$border` 1px inside                   | `border border-border`                           |
| Card shadow              | blur 30, y 10, spread -12, `#1a161426` | `shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)]` |
| Card padding             | 16                                     | `p-4`                                            |
| Card gap                 | 12                                     | `gap-3`                                          |
| Icon circle cornerRadius | 12                                     | `rounded-xl`                                     |
| Icon circle fill         | `#ff972818` (warm-yellow 9%)           | `bg-warm-yellow/[0.09]`                          |
| Icon circle size         | 40×40                                  | `size-10`                                        |
| Icon fill                | `$warm-orange`                         | `text-warm-orange`                               |
| Icon size                | 18×18                                  | `size-[18px]`                                    |
| Title fontSize           | 15                                     | `text-[15px]`                                    |
| Title fontWeight         | 500                                    | `font-medium`                                    |
| Title fontFamily         | `$font-display`                        | `font-display`                                   |
| Title fill               | `$text-primary`                        | `text-text-primary`                              |
| Meta fontSize            | 12                                     | `text-xs`                                        |
| Meta fontWeight          | normal                                 | `font-normal`                                    |
| Meta fontFamily          | `$font-body`                           | `font-body`                                      |
| Meta fill                | `$text-muted`                          | `text-text-muted`                                |
| Estado pill radius       | 999                                    | `rounded-pill`                                   |
| Estado pill padding      | [11, 5]                                | `px-[11px] py-[5px]`                             |
| Estado pill fontSize     | 12                                     | `text-xs`                                        |
| Estado pill fontWeight   | 600                                    | `font-semibold`                                  |
| Estado pill fontFamily   | `$font-display`                        | `font-display`                                   |
| Urgency icon size        | 14×14                                  | `size-[14px]`                                    |
| Urgency gap              | 5                                      | `gap-[5px]`                                      |
| Urgency fontFamily       | `$font-body`                           | `font-body`                                      |
| Urgency fill             | `$text-secondary`                      | `text-text-secondary`                            |
| Action pill radius       | 999                                    | `rounded-pill`                                   |
| Action fill              | `$surface-inset`                       | `bg-surface-inset`                               |
| Action padding           | [16, 7]                                | `px-4 py-[7px]`                                  |
| Action fontSize          | 13                                     | `text-[13px]`                                    |
| Action fontWeight        | 600                                    | `font-semibold`                                  |
| Action fontFamily        | `$font-display`                        | `font-display`                                   |
| Action fill (text)       | `$brand-green`                         | `text-brand-green`                               |

## Tasks / Subtasks

- [ ] **T1 — Red: test scaffold** (AC: 1, 2, 3, 4)
  - [ ] `src/components/TaskCard.test.tsx` — all test cases before any component code
  - [ ] Tests: renders title/category/timeAgo, all 3 estados, all 3 urgencias, all 5 categories + fallback, action button click, missing onAction (no throw), custom className merge
  - [ ] Verify RED: `TaskCard is not a function` or equivalent
- [ ] **T2 — Green: `src/components/TaskCard.tsx`** (AC: 1, 2, 3, 4)
  - [ ] Component with lucide icons, cn() class merging, all variant mappings
  - [ ] All tests pass
- [ ] **T3 — Verify**
  - [ ] `pnpm test` passes (all new + existing tests)
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm lint` passes

## Files to Touch

| Action | File                               |
| ------ | ---------------------------------- |
| NEW    | `src/components/TaskCard.tsx`      |
| NEW    | `src/components/TaskCard.test.tsx` |

No existing files modified. No globals.css or @theme changes. DS primitives from Epic 1 remain untouched.

## Dev Notes

### Category → icon mapping

```ts
import { Wrench, SprayCan, ShoppingCart, Settings, MoreHorizontal, Flame } from "lucide-react";

const categoryIcons: Record<string, LucideIcon> = {
  Reparación: Wrench,
  Limpieza: SprayCan,
  Compra: ShoppingCart,
  Mantenimiento: Settings,
  Otro: MoreHorizontal,
};
```

### Urgency labels + colors

```ts
const urgenciaConfig = {
  alta: { label: "Urgencia alta", color: "text-warm-orange" },
  media: { label: "Urgencia media", color: "text-warm-yellow" },
  baja: { label: "Urgencia baja", color: "text-text-muted" },
};
```

### Estado chip config

```ts
const estadoConfig = {
  abierta: { label: "Abierta", bg: "bg-blue-raw/20", text: "text-brand-blue" },
  tomada: { label: "Tomada", bg: "bg-coral/20", text: "text-coral" },
  hecha: { label: "Hecha", bg: "bg-mint-raw/20", text: "text-brand-mint" },
};
```

### Pencil-referenced (Pencil → code)

| Pencil node   | id      | code location                    |
| ------------- | ------- | -------------------------------- |
| TaskCard root | `cboAZ` | `src/components/TaskCard.tsx`    |
| icon circle   | `jVFYU` | icon container inside header row |
| title text    | `vbio1` | title span inside text column    |
| meta text     | `kH7vp` | meta span inside text column     |
| estado pill   | `MzKsK` | estado span inside header row    |
| urgency row   | `UuQPu` | urgency group inside footer      |
| action pill   | `frHCI` | action button inside footer      |

### Testing strategy

- **T1 Red**: Create `TaskCard.test.tsx` with full test suite:
  - **Basic render**: `title`, `category + timeAgo` meta string, `actionLabel`, `estado` label
  - **All estados**: Component renders correct chip for `abierta`, `tomada`, `hecha` — check both bg and text classes
  - **All urgencias**: Check icon + text color for `alta` (warm-orange), `media` (warm-yellow), `baja` (text-muted)
  - **All categories**: Check that the correct Lucide icon renders for each of the 5 mapped categories + fallback to `MoreHorizontal` for unknown
  - **Action click**: `fireEvent.click` on action button calls `onAction` mock
  - **Missing onAction**: Rendering without `onAction` does not throw; button is present
  - **Custom className**: Additional classes merge via `cn()`, base classes remain
- **T2 Green**: Minimal implementation to pass all tests
- **T3 Verify**: Full `pnpm test`, `pnpm typecheck`, `pnpm lint`

### Do NOT

- **No** Next.js `<Link>` or `next/navigation` imports — domain component only
- **No** DS primitives (Chip, Avatar, etc.) — use direct DOM elements with Tailwind
- **No** task state logic or server actions — presentation only
- **No** `globals.css` or `tailwind.config` changes — tokens exist from Epic 1
- **No** adding task data to any page — screen work is Story 4.3
- **No** gradient on action button — it's `surface-inset`, not a CTA gradient

### Grey-box search targets (post-implementation)

Must return ZERO:

```bash
rg "next/link|next/navigation" src/components/TaskCard.tsx
rg "Chip|TierBadge|Avatar|RoleChip" src/components/TaskCard.tsx
```

Must be PRESENT:

```bash
rg "lucide-react" src/components/TaskCard.tsx
rg "rounded-\[20px\]" src/components/TaskCard.tsx
rg "shadow-\[0_10px_30px_-12px" src/components/TaskCard.tsx
```

### References

- Linear [ZER-18](https://linear.app/zerrant/issue/ZER-18/41-taskcard-component)
- `_bmad-output/planning-artifacts/epics.md` — Story 4.1, FR11, UX-DR4
- `_bmad-output/specs/spec-ui-fidelity-m0-m2/SPEC.md` — CAP-3
- `_bmad-output/specs/spec-ui-fidelity-m0-m2/component-parity.md` — TaskCard `cboAZ`
- `design/nodo-serrano.pen` — Pencil frame `cboAZ` (sole visual SSOT)
- `src/app/globals.css` — existing `@theme` tokens
- `src/lib/utils.ts` — `cn()` utility
- `src/components/Chip.tsx`, `src/components/Chip.test.tsx` — component + test conventions

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### Change Log

| Date       | Change                        |
| ---------- | ----------------------------- |
| 2026-07-24 | Story created — ready for dev |

### File List

- `src/components/TaskCard.tsx` (new)
- `src/components/TaskCard.test.tsx` (new)
