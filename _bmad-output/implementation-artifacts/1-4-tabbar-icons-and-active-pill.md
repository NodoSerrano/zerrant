---
baseline_commit: 4409f696ec0937ad4511a9cc6397a6ab5d101fd5
---

# Story 1.4: TabBar icons and active pill

Status: done

<!-- Story context engine — generated from epics.md, component-parity.md, brownfield.md, Pencil MCP, and current code -->

## Story

As a member navigating the app,
I want a TabBar that matches Pencil (icons + active pill),
so that chrome feels finished and I know which tab is active.

## Acceptance Criteria

1. **Given** Pencil TabBar (`nMDGY`) with 5 lucide icons and active pill treatment
   **When** `<TabBar>` renders with an active tab
   **Then** all 5 tabs use lucide-react icons (House, Users, Layers, Calendar, User) — not emoji
   **And** the active tab has a `bg-primary` pill background (`rounded-[26px]`) with `text-on-primary` icon + label
   **And** inactive tabs have `text-text-muted` icon + label with transparent background
   **(FR8, UX-DR3)**

2. **Given** Pencil TabBar container styling
   **When** `<TabBar>` renders
   **Then** the outer container has Pencil padding (`pt-[21px] pr-[12px] pb-[21px] pl-[21px]`)
   **And** the inner pill container has `rounded-[36px]`, `bg-surface`, `border border-border` (1px, inside stroke), `h-[62px]`, inner padding 4px (`p-1`), and shadow `[0_8px_24px_-6px_rgba(26,22,20,0.13)]`
   **And** all 5 tabs are equally distributed (`flex-1`) inside the pill
   **(FR8)**

3. **Given** Pencil tab label styling
   **When** each tab renders
   **Then** labels are ALL CAPS (`INICIO`, `PLANTEL`, `NODO`, `AGENDA`, `PERFIL`)
   **And** labels use `font-display`, `text-[10px]`, `font-semibold` (600), `tracking-[0.5px]` (except Nodo: `tracking-[0.3px]`)
   **And** each tab has vertical layout with `gap-[3px]` between icon and label
   **And** icons are 18×18 lucide
   **(FR8)**

4. **Given** existing navigation wiring
   **When** `TabBarClient` renders
   **Then** route-based active detection (pathname.startsWith) still works
   **And** `onTabChange` callback still fires with correct tab id
   **And** `Tab` type union (`"inicio" | "plantel" | "nodo" | "agenda" | "perfil"`) is unchanged
   **(FR26)**

5. **Given** TDD
   **When** implementation is complete
   **Then** component tests assert: lucide icons render (not emoji), active tab has `bg-primary` + `text-on-primary`, inactive tabs have `text-text-muted` + no `bg-primary`, container has `rounded-[36px]` + shadow + `h-[62px]`, labels are uppercase, font is `font-semibold`
   **And** `onTabChange` still fires; TabBarClient path matching preserved
   **And** `pnpm test` passes
   **(NFR2)**

6. **Out of scope**
   - Adding lucide icons to other components (RoleChip, etc.)
   - Changing route-based active logic in TabBarClient
   - Changing `onTabChange` callback API or `Tab` type
   - Dark mode: icon/active pill colors inherit from theme tokens, no dark-specific overrides needed
   - Making tabs functional (they are already buttons)
   - Changing any page routes or Next.js Link behavior

## Tasks / Subtasks

- [x] **T0 — Install lucide-react** (dependency)
  - [x] `pnpm add lucide-react`
  - [x] Verify: `import { House, Users, Layers, Calendar, User } from "lucide-react"` resolves

- [x] **T1 — Red: tests first** (AC: 1–5)
  - [x] Assert lucide icons render (not emoji text) — use `getByRole` or `queryByText` to verify emoji absence
  - [x] Assert active tab has `bg-primary` and `text-on-primary`
  - [x] Assert inactive tab has `text-text-muted` and does NOT have `bg-primary`
  - [x] Assert outer container: `rounded-[36px]`, `h-[62px]`, shadow class, `border-border`, `bg-surface`
  - [x] Assert labels are ALL CAPS text content: `"INICIO"`, `"PLANTEL"`, etc.
  - [x] Assert label has `font-semibold` and `tracking-[0.5px]`
  - [x] Assert existing: `onTabChange` fires, `active` prop controls rendering
  - [x] Confirm ALL new assertions FAIL on current emoji-based code

- [x] **T2 — TabBar component restructure** (AC: 1, 2, 3)
  - [x] Replace emoji icon strings with lucide icon components in `tabs` array
  - [x] Add outer container with Pencil padding
  - [x] Add inner pill container with `rounded-[36px]`, `bg-surface`, `border border-border`, `h-[62px]`, `p-1`, shadow
  - [x] Each tab: `flex flex-col items-center justify-center gap-[3px] flex-1 rounded-[26px]`
  - [x] Active tab: `bg-primary text-on-primary`
  - [x] Inactive tab: `text-text-muted` (transparent bg)
  - [x] Labels: uppercase "INICIO" / "PLANTEL" / "NODO" / "AGENDA" / "PERFIL"
  - [x] Labels: `font-display text-[10px] font-semibold tracking-[0.5px]` (Nodo: `tracking-[0.3px]`)
  - [x] Keep `onTabChange` behavior and className prop

- [x] **T3 — Preserve TabBarClient** (AC: 4)
  - [x] Do NOT change `TabBarClient.tsx` (pathname matching logic preserved)
  - [x] Do NOT change `Tab` type union
  - [x] Verify `onTabChange` still fires in test

- [x] **T4 — Grey-box search** (AC: 5)
  - [x] `grep` for emoji (`🏠`) in `TabBar.tsx` → must return zero
  - [x] `grep` for `text-primary` on active TabBar → must be `text-on-primary` for label + icon on active pill
  - [x] `grep` for lowercase labels → must be uppercase
  - [x] `grep` for `font-medium` in TabBar → must be `font-semibold`

- [x] **T5 — Verify** (AC: 5)
  - [x] `pnpm test` → 100% pass
  - [x] `pnpm typecheck`
  - [x] Manual: 5 tabs render with icons, active pill green background, labels all caps, container has rounded pill + shadow

## Dev Notes

### Pencil component specs (exact, from `design/nodo-serrano.pen`)

#### TabBar outer container (`nMDGY`)

| Property | Pencil value                                | Tailwind target                           |
| -------- | ------------------------------------------- | ----------------------------------------- |
| Width    | 390 (design canvas)                         | responsive via parent                     |
| Padding  | [21, 12, 21, 21] (top, right, bottom, left) | `pt-[21px] pr-[12px] pb-[21px] pl-[21px]` |

#### Inner pill container (`YCyBk`)

| Property      | Pencil value                                      | Tailwind target                                |
| ------------- | ------------------------------------------------- | ---------------------------------------------- |
| Corner radius | 36                                                | `rounded-[36px]`                               |
| Fill          | `$surface`                                        | `bg-surface`                                   |
| Height        | 62                                                | `h-[62px]`                                     |
| Stroke        | Inside, `$border`, thickness 1                    | `border border-border`                         |
| Padding       | 4 (all sides)                                     | `p-1` (4px)                                    |
| Shadow        | Blur 24, spread -6, color `#1a161422`, offset 0/8 | `shadow-[0_8px_24px_-6px_rgba(26,22,20,0.13)]` |
| Layout        | Horizontal, center                                | `flex items-center justify-center`             |

#### Each tab (all 5 share structure)

| Property      | Pencil value             | Tailwind target                             |
| ------------- | ------------------------ | ------------------------------------------- |
| Corner radius | 26                       | `rounded-[26px]`                            |
| Gap           | 3                        | `gap-[3px]`                                 |
| Layout        | Vertical, center, center | `flex flex-col items-center justify-center` |
| Width/height  | fill_container           | `flex-1`                                    |

#### Tab 1 — INICIO (active, `K5YZ61`)

| Property | Pencil value                                                        | Tailwind target                                                           |
| -------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Fill     | `$primary` = `#0c8a5e`                                              | `bg-primary`                                                              |
| Icon     | lucide "house", 18×18, `$on-primary`                                | `<House size={18}>` with `text-on-primary`                                |
| Label    | "INICIO", font-display, 10px, 600, letterSpacing 0.5, `$on-primary` | `font-display text-[10px] font-semibold tracking-[0.5px] text-on-primary` |

#### Tabs 2–5 — INACTIVE (c8wwh, Md6Uk, ENpIx, SIsbJ)

| Property        | Pencil value                                             | Tailwind target                               |
| --------------- | -------------------------------------------------------- | --------------------------------------------- |
| Fill            | None (transparent)                                       | (no bg class)                                 |
| Tab 2 — PLANTEL | lucide "users", 18×18, `$text-muted`                     | `<Users size={18}>` with `text-text-muted`    |
| Tab 3 — NODO    | lucide "layers", 18×18, `$text-muted`, letterSpacing 0.3 | `<Layers size={18}>`, `tracking-[0.3px]`      |
| Tab 4 — AGENDA  | lucide "calendar", 18×18, `$text-muted`                  | `<Calendar size={18}>` with `text-text-muted` |
| Tab 5 — PERFIL  | lucide "user", 18×18, `$text-muted`                      | `<User size={18}>` with `text-text-muted`     |

### Current code → target diff

#### TabBar.tsx

```
CURRENT: emoji strings ("🏠", "👥", "⚡", "📅", "👤")
TARGET:  lucide components (House, Users, Layers, Calendar, User)

CURRENT: <nav> flat bar, h-16, border-t, px-2 pt-2
TARGET:  <nav> outer + <div> inner pill container

CURRENT: bg-surface border-t border-border (flat top bar)
TARGET:  bg-surface border border-border rounded-[36px] h-[62px] p-1 shadow-[...]

CURRENT: active = "text-primary"
TARGET:  active = "bg-primary text-on-primary rounded-[26px]"

CURRENT: labels "Inicio", "Plantel", "Nodo", "Agenda", "Perfil" (Title Case)
TARGET:  labels "INICIO", "PLANTEL", "NODO", "AGENDA", "PERFIL" (ALL CAPS)

CURRENT: text-[10px] font-medium leading-tight
TARGET:  text-[10px] font-semibold tracking-[0.5px]

CURRENT: gap-0.5 (2px)
TARGET:  gap-[3px]

CURRENT: outer padding px-2 pt-2 pb-safe h-16
TARGET:  outer padding pt-[21px] pr-[12px] pb-[21px] pl-[21px] (no pb-safe needed; shadow handles it)
```

### Icon mapping

| Tab     | Pencil lucide icon | lucide-react import | Usage                    |
| ------- | ------------------ | ------------------- | ------------------------ |
| Inicio  | house              | `House`             | `<House size={18} />`    |
| Plantel | users              | `Users`             | `<Users size={18} />`    |
| Nodo    | layers             | `Layers`            | `<Layers size={18} />`   |
| Agenda  | calendar           | `Calendar`          | `<Calendar size={18} />` |
| Perfil  | user               | `User`              | `<User size={18} />`     |

### Files to touch

| File                              | Action                                                                     |
| --------------------------------- | -------------------------------------------------------------------------- |
| `package.json`                    | **MODIFY** — add `lucide-react` dependency                                 |
| `src/components/TabBar.tsx`       | **REWRITE** — icons, container structure, active pill, uppercase, tracking |
| `src/components/TabBar.test.tsx`  | **REWRITE** — new assertions for icons, pill, container, labels            |
| `src/components/TabBarClient.tsx` | **DO NOT TOUCH** — preserve pathname logic                                 |

### Testing strategy

- **Icons**: assert lucide SVG icons render (check for `<svg>` elements or lucide test attributes) and emoji text is absent
- **Active pill**: assert active tab button has `bg-primary`, `text-on-primary`, `rounded-[26px]`
- **Inactive**: assert inactive tab button does NOT have `bg-primary`; has `text-text-muted`
- **Container**: assert outer/inner container has `rounded-[36px]`, `h-[62px]`, `shadow-`, `border-border`, `bg-surface`
- **Labels**: assert tab labels contain uppercase text (`"INICIO"`, `"PLANTEL"`, etc.)
- **Font**: assert labels have `font-semibold`, `tracking-[0.5px]`, `text-[10px]`
- **Behavior**: assert `onTabChange` fires with correct `Tab` id on click; assert `active` prop controls which tab shows pill
- **TabBarClient**: render TabBarClient in test with mocked `usePathname` to verify active logic unchanged
- Use `toHaveClass`, `not.toHaveClass`, `toHaveTextContent`, `toBeInTheDocument`

### Architecture / stack

- Next.js 16 App Router, React 19, Tailwind v4
- Package manager: pnpm
- Tests: Vitest + Testing Library + jsdom
- New dependency: `lucide-react` (MIT license, tree-shakeable icon library)
- Design tokens from Story 1.1: all colors + fonts + radii accessible
- Stories 1.1–1.3 done: tokens, buttons/input, avatar/chip/badges all Pencil-compliant

### Previous story learnings

- **Story 1.1**: CSS variables, dark class, FOUC, `useTheme` with `useEffect` sync — all functional
- **Story 1.2**: PrimaryButton gradient → blue, SecondaryButton surface+border, Input pill 50px. Review APPROVED.
- **Story 1.3**: Avatar gradient mint→blue, Chip border+padding, TierBadge pill, RoleChip no-border. Review APPROVED.
- **Test patterns**: `toHaveClass`/`not.toHaveClass`, `className` string matching, `fireEvent.click`, `vi.fn()` for callbacks
- **lucide-react is NOT in package.json** — must install via `pnpm add lucide-react`
- **active:scale-[0.98]** pattern used on buttons — TabBar does NOT use it (Pencil has no press effect)

### Grey-box search targets (post-implementation)

```bash
# Must return ZERO in component files
grep -rn '🏠\|👥\|⚡\|📅\|👤' src/components/TabBar.tsx   # → ZERO emoji
grep -rn 'font-medium' src/components/TabBar.tsx          # → ZERO (should be font-semibold)
grep -rn '"Inicio"\|"Plantel"\|"Nodo"\|"Agenda"\|"Perfil"' src/components/TabBar.tsx  # → ZERO (uppercase)
grep -rn 'gap-0.5' src/components/TabBar.tsx              # → ZERO (should be gap-[3px])
grep -rn 'h-16' src/components/TabBar.tsx                 # → ZERO (should be h-[62px])

# Must exist
grep -rn 'rounded-\[36px\]' src/components/TabBar.tsx     # → PRESENT
grep -rn 'rounded-\[26px\]' src/components/TabBar.tsx     # → PRESENT
grep -rn 'bg-primary' src/components/TabBar.tsx           # → PRESENT (on active tab)
grep -rn 'text-on-primary' src/components/TabBar.tsx      # → PRESENT (on active tab)
grep -rn 'lucide-react' package.json                      # → PRESENT
```

### Do NOT

- Do not change route-based active detection in `TabBarClient.tsx`
- Do not change `Tab` type union (`"inicio" | "plantel" | "nodo" | "agenda" | "perfil"`)
- Do not change `onTabChange` callback API
- Do not add lucide icons to RoleChip or other non-TabBar components
- Do not wrap tabs in `<Link>` / Next.js navigation — keep as uncontrolled buttons with `onTabChange`
- Do not touch `globals.css`, `@theme`, or design tokens
- Do not modify any other DS primitives (1.1–1.3)
- Do not change any page routes or layouts
- Do not invent new tab colors or copy beyond Pencil
- Do not leave emoji fallback — lucide icons must be the sole icon renderer
- Do not leave intentional tech debt

### References

- Pencil: `design/nodo-serrano.pen` — TabBar `nMDGY` (outer) + `YCyBk` (inner pill) + 5 tabs
- Spec: `_bmad-output/specs/spec-ui-fidelity-m0-m2/SPEC.md` (CAP-2)
- Component parity: `_bmad-output/specs/spec-ui-fidelity-m0-m2/component-parity.md`
- Brownfield: `_bmad-output/specs/spec-ui-fidelity-m0-m2/brownfield.md`
- Epics: `_bmad-output/planning-artifacts/epics.md` (Story 1.4 section)
- Story 1.1: `_bmad-output/implementation-artifacts/1-1-design-tokens-light-and-dark.md`
- Story 1.2: `_bmad-output/implementation-artifacts/1-2-primarybutton-secondarybutton-and-input-parity.md`
- Story 1.3: `_bmad-output/implementation-artifacts/1-3-avatar-chip-tierbadge-and-rolechip-parity.md`
- Sprint: `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (OpenCode)

### Debug Log References

- RED phase: `pnpm test` confirmed 7 tests failed (emoji icons, missing bg-primary pill, wrong container, wrong labels, wrong font)
- GREEN phase: rewrote TabBar with lucide icons + pill container, 134/134 tests pass, typecheck clean, grey-box all clear

### Completion Notes List

- Installed `lucide-react@1.26.0` via `pnpm add lucide-react`
- **TabBar.tsx**: replaced emoji strings with lucide `House/Users/Layers/Calendar/User` icons (18×18); restructured to outer `<nav>` with Pencil padding + inner `<div>` pill container with `rounded-[36px]`, `bg-surface`, `border border-border`, `h-[62px]`, `p-1`, `shadow-[0_8px_24px_-6px_rgba(26,22,20,0.13)]`; active tab gets `bg-primary text-on-primary rounded-[26px]`; inactive tabs get `text-text-muted`; labels ALL CAPS, `font-display text-[10px] font-semibold tracking-[0.5px]` (Nodo: `tracking-[0.3px]`); `gap-[3px]` icon/label
- **TabBarClient.tsx**: NOT touched — pathname-based active detection preserved
- **Tab type union**: unchanged (`"inicio" | "plantel" | "nodo" | "agenda" | "perfil"`)
- **onTabChange API**: unchanged, tests pass
- `pnpm test`: 17 files, 134 tests, all pass
- `pnpm typecheck`: clean
- Grey-box grep: zero emoji, zero font-medium, zero gap-0.5, zero h-16, zero text-primary (active uses text-on-primary), `lucide-react` confirmed in package.json

### Change Log

- **2026-07-24:** Implemented Pencil parity for TabBar. TDD: 7 RED → 7 GREEN. Replaced emoji with lucide icons (House/Users/Layers/Calendar/User). Added active pill (bg-primary, rounded-[26px]). Container restructured with rounded-[36px] pill + shadow. Labels ALL CAPS with tracking. Nodo tab uses tracking-[0.3px]. TabBarClient untouched.

### File List

- `package.json` — modified (added lucide-react)
- `pnpm-lock.yaml` — modified (dependency lock)
- `src/components/TabBar.tsx` — modified (icons, container, pill, labels, tracking)
- `src/components/TabBar.test.tsx` — modified (rewritten with 12 assertions)
- `src/components/TabBarClient.tsx` — NOT modified
