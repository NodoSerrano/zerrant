---
baseline_commit: 4409f696ec0937ad4511a9cc6397a6ab5d101fd5
---

# Story 2.1: Login and signup brand layout (1.1)

Status: done

<!-- Story context engine — from epics.md, SPEC.md, screen-inventory.md, brownfield.md, Pencil MCP, and current code -->

## Story

As a visitor,
I want login and signup to match Pencil brand layout and copy,
so that I trust I am entering Nodo Serrano.

## Acceptance Criteria

1. **Given** Pencil frame `1.1 · Login / Registro` (`RCjjt`)
   **When** I open `/auth/login` or `/auth/signup` at ~390px
   **Then** both pages share the same brand hero:
   - 76×76 circle: gradient `brand-mint → brand-blue → brand-violet` at 135°, `rounded-full`, shadow `[0_8px_22px_-4px_rgba(17,88,176,0.33)]`, lucide `Mountain` icon 36×36 in `text-on-primary`
   - "Nodo Serrano": `font-display text-[26px] font-bold text-text-primary`
   - "El backoffice de la comunidad": `font-body text-sm font-normal text-text-secondary`
   - Gap 16px between mark and titles, gap 6px between title and subtitle
     **(FR13, UX-DR5)**

2. **Given** Pencil login page structure
   **When** `/auth/login` renders
   **Then** the wrapper has `px-[26px] py-6`, `flex flex-col justify-center`, `gap-[22px]`
   **And** form order is: email → password → "¿Olvidaste tu contraseña?" link (right-aligned, `font-body text-[13px] font-medium text-text-secondary`, links to `/auth/recovery`)
   **And** PrimaryButton label is "Ingresar"
   **And** divider: horizontal lines `bg-border h-px` with "o" `text-text-muted text-[13px]` in `gap-[12px]`
   **And** SecondaryButton "Continuar con Google" (full width)
   **And** footer: "¿Primera vez?" (`text-text-secondary`) + "Creá tu cuenta" (`text-coral font-semibold`), `gap-[5px]`, centered, links to `/auth/signup`
   **(FR13, FR25)**

3. **Given** Pencil signup page structure
   **When** `/auth/signup` renders
   **Then** same brand hero and wrapper as login
   **And** PrimaryButton label is "Crear cuenta"
   **And** footer: "¿Ya tenés cuenta?" (`text-text-secondary`) + "Iniciá sesión" (`text-coral font-semibold`), centered, links to `/auth/login`
   **(FR13, FR25)**

4. **Given** existing auth layout conflicts with brand hero
   **When** auth layout changes
   **Then** the layout no longer renders a standalone "Nodo Serrano" heading (brand hero is inside pages)
   **And** ThemeToggle remains accessible at top-right (`absolute top-0 right-0` or a minimal row)
   **And** layout wrapper uses Pencil padding `px-[26px] py-6` — or pages handle their own padding and layout is just `min-h-full bg-bg`
   **(FR13)**

5. **Given** existing auth behavior
   **When** users submit login/signup forms
   **Then** `signInWithPassword`, `signUpWithPassword`, `signInWithGoogle` server actions still work
   **And** `useActionState` error display preserved (coral text on `bg-coral/10 rounded-md`)
   **And** pending states on buttons still work
   **And** all routes: `/auth/login`, `/auth/signup`, `/auth/recovery`, `/auth/check-email` still accessible
   **(FR26)**

6. **Given** TDD
   **When** implementation is complete
   **Then** page tests assert brand hero elements (mountain icon SVG, "Nodo Serrano" heading, subtitle), form field order, forgot link position, button labels, footer copy and link targets, error display, pending states
   **And** layout test asserts ThemeToggle presence and no duplicate heading
   **And** existing auth action tests still pass
   **And** `pnpm test` passes
   **(NFR2)**

7. **Out of scope**
   - Check-email (`/auth/check-email`) — Story 2.2
   - Recovery (`/auth/recovery`) — Story 2.3
   - Reset password (`/auth/reset-password`) — Story 2.3
   - Changing `signInWithPassword`, `signUpWithPassword`, `signInWithGoogle` logic
   - Changing Input/PrimaryButton/SecondaryButton DS primitives (already Pencil-matched from Epic 1)
   - Dark mode: forms use theme tokens, no dark-specific overrides needed
   - Adding new routes or redirects
   - Changing RLS or auth middleware

## Tasks / Subtasks

- [x] **T1 — Red: write failing page tests** (AC: 1–6)
  - [x] Login page test: assert brand hero (mountain icon via lucide SVG, "Nodo Serrano" heading, subtitle text), form field order (email before password), forgot link text + href, button labels ("Ingresar"/"Continuar con Google"), footer copy + links
  - [x] Signup page test: same brand hero, button "Crear cuenta", footer "¿Ya tenés cuenta?" + "Iniciá sesión" link
  - [x] Assert wrapper padding classes
  - [x] Assert existing: error display rendering, pending button text
  - [x] Auth layout test: assert no duplicate "Nodo Serrano" heading, ThemeToggle present
  - [x] Confirm tests FAIL on current code (no brand mark, wrong layout, wrong footer copy)

- [x] **T2 — Login page rewrite** (AC: 1, 2)
  - [x] Add brand hero: Mountain icon in 76×76 gradient circle + titles + subtitle
  - [x] Remove old "Iniciar sesión" heading/subtitle (replaced by brand hero)
  - [x] Restructure: wrapper with Pencil padding, flex-col justify-center, gap-[22px]
  - [x] Reorder form: email → password → forgot link (right-aligned, between password and button)
  - [x] Divider: "o" 13px with gap-[12px] lines
  - [x] Footer: "¿Primera vez?" + "Creá tu cuenta" (coral), gap-[5px], centered, `<Link href="/auth/signup">`
  - [x] Keep error display and pending states

- [x] **T3 — Signup page rewrite** (AC: 1, 3)
  - [x] Same brand hero as login
  - [x] Remove old "Crear cuenta" heading (replaced by brand hero)
  - [x] Footer: "¿Ya tenés cuenta?" + "Iniciá sesión" (coral), centered, `<Link href="/auth/login">`
  - [x] Same wrapper and form structure as login
  - [x] Keep error display and pending states

- [x] **T4 — Auth layout restructure** (AC: 4)
  - [x] Remove "Nodo Serrano" heading from layout (now in page hero)
  - [x] Remove `mb-8 flex items-center justify-between` header bar
  - [x] ThemeToggle: position `absolute top-[16px] right-[16px]` in layout container
  - [x] Layout simplifies to: `relative min-h-full bg-bg` with page content children
  - [x] Verify ThemeToggle is accessible on all auth pages

- [x] **T5 — Verify** (AC: 6)
  - [x] `pnpm test` → 100% pass (new page tests + existing auth action tests)
  - [x] `pnpm typecheck`
  - [x] Manual: open `/auth/login` and `/auth/signup` at ~390px, verify brand hero, form, footer match Pencil

## Dev Notes

### Pencil component specs (exact, from `design/nodo-serrano.pen`)

#### Frame `RCjjt` — 1.1 · Login / Registro

| Property         | Pencil value        | Tailwind target            |
| ---------------- | ------------------- | -------------------------- |
| Width            | 390 (design canvas) | responsive                 |
| Height           | 844                 | min-h-screen or content    |
| Fill             | `$bg`               | `bg-bg`                    |
| Child: StatusBar | ref UFbiI           | phone chrome — skip in web |

#### Wrapper (`AzGXK`)

| Property | Pencil value                            | Tailwind target                           |
| -------- | --------------------------------------- | ----------------------------------------- |
| Layout   | Vertical, justifyContent center, gap 22 | `flex flex-col justify-center gap-[22px]` |
| Padding  | [26, 24] (horizontal, vertical)         | `px-[26px] py-6`                          |
| Height   | fill_container                          | `min-h-full` or flex grow                 |

#### Brand mark circle (`i0moy5`)

| Property      | Pencil value                                                           | Tailwind target                                                  |
| ------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Size          | 76×76                                                                  | `size-[76px]`                                                    |
| Corner radius | 999                                                                    | `rounded-full`                                                   |
| Fill          | Gradient brand-mint (0) → brand-blue (0.55) → brand-violet (1) at 135° | `bg-linear-to-br from-brand-mint via-brand-blue to-brand-violet` |
| Shadow        | Blur 22, spread -4, color `#1158b055`, offset 0/8                      | `shadow-[0_8px_22px_-4px_rgba(17,88,176,0.33)]`                  |
| Layout        | Vertical, center, center                                               | `flex flex-col items-center justify-center`                      |
| Icon          | lucide "mountain", 36×36, `$on-primary`                                | `<Mountain size={36} className="text-on-primary" />`             |

#### Titles stack (`x4OLtF`)

| Property                        | Pencil value                                    | Tailwind target                                        |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Gap between title+subtitle      | 6                                               | `gap-1.5` (6px)                                        |
| "Nodo Serrano"                  | font-display, 26px, bold (700), `$text-primary` | `font-display text-[26px] font-bold text-text-primary` |
| "El backoffice de la comunidad" | font-body, 14px, normal, `$text-secondary`      | `font-body text-sm font-normal text-text-secondary`    |

#### Logo group (`B3LYiB`) — mark + titles together

| Property                    | Pencil value | Tailwind target              |
| --------------------------- | ------------ | ---------------------------- |
| Gap between mark and titles | 16           | `gap-4` (16px)               |
| Layout                      | Vertical     | `flex flex-col items-center` |

#### Form (`aBYX8`)

| Property           | Pencil value                                   | Tailwind target |
| ------------------ | ---------------------------------------------- | --------------- |
| Gap between fields | 14                                             | `gap-[14px]`    |
| Content            | Email → Password → Forgot link (right-aligned) | —               |

#### Forgot password row (`B2yle`)

| Property | Pencil value                                                     | Tailwind target                                         |
| -------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| Justify  | End                                                              | `justify-end` or `text-right`                           |
| Text     | "¿Olvidaste tu contraseña?" font-body 13px 500 `$text-secondary` | `font-body text-[13px] font-medium text-text-secondary` |

#### Divider (`i99g6L`)

| Property          | Pencil value                           | Tailwind target                                     |
| ----------------- | -------------------------------------- | --------------------------------------------------- |
| Gap between items | 12                                     | `gap-[12px]`                                        |
| Lines             | `$border`, height 1, fill_container    | `flex-1 h-px bg-border`                             |
| "o" text          | font-body, 13px, normal, `$text-muted` | `font-body text-[13px] font-normal text-text-muted` |

#### Footer (`FQuCs`)

| Property         | Pencil value                               | Tailwind target                               |
| ---------------- | ------------------------------------------ | --------------------------------------------- |
| Gap              | 5                                          | `gap-[5px]`                                   |
| Justify          | Center                                     | `justify-center`                              |
| "¿Primera vez?"  | font-body, 13px, normal, `$text-secondary` | `text-[13px] font-normal text-text-secondary` |
| "Creá tu cuenta" | font-body, 13px, semi-bold (600), `$coral` | `text-[13px] font-semibold text-coral`        |

### Layout resolution (AC4)

Currently `src/app/auth/layout.tsx` renders a standalone "Nodo Serrano" heading + ThemeToggle inside `px-5 py-10`. This conflicts with the brand hero now inside each page.

**Resolution:**

```tsx
// Auth layout becomes:
<div className="relative min-h-full bg-bg">
  <div className="absolute top-4 right-4 z-10">
    <ThemeToggle />
  </div>
  {children}
</div>
```

- Each page (`login/page.tsx`, `signup/page.tsx`) renders its own wrapper with `px-[26px] py-6 flex flex-col justify-center gap-[22px] min-h-full` containing the brand hero + form.
- No duplicate heading. ThemeToggle always available in top-right.

### Current code → target diff

#### Login page

```
CURRENT: "Iniciar sesión" heading + subtitle, no brand mark
TARGET:  Brand hero (Mountain icon circle + "Nodo Serrano" + subtitle)

CURRENT: Gap between items: gap-6 (24px)
TARGET:  Gap: gap-[22px]

CURRENT: Outer padding: inherited from layout (px-5 py-10)
TARGET:  Page wrapper: px-[26px] py-6

CURRENT: Forgot password link at BOTTOM of page (between Google and footer)
TARGET:  Forgot password link between password field and PrimaryButton (right-aligned)

CURRENT: Forgot link: "¿Olvidaste tu contraseña?" text-brand-mint
TARGET:  Forgot link: "¿Olvidaste tu contraseña?" text-text-secondary text-[13px] font-medium

CURRENT: Divider "o": text-xs (12px), gap-3 (12px)
TARGET:  Divider "o": text-[13px], gap-[12px]

CURRENT: Footer: "¿No tenés cuenta? Registrate" text-brand-mint
TARGET:  Footer: "¿Primera vez?" + "Creá tu cuenta" text-coral font-semibold
```

#### Signup page

```
CURRENT: "Crear cuenta" heading, no brand mark
TARGET:  Brand hero (same as login)

CURRENT: Footer link text-brand-mint
TARGET:  Footer link text-coral font-semibold (same structure, different color)
```

#### Auth layout

```
CURRENT: Header bar with "Nodo Serrano" + ThemeToggle, px-5 py-10
TARGET:  relative min-h-full bg-bg, ThemeToggle absolute top-4 right-4, no heading
```

### Files to touch

| File                                               | Action                                                      |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `src/app/auth/layout.tsx`                          | **UPDATE** — remove heading, ThemeToggle absolute top-right |
| `src/app/auth/login/page.tsx`                      | **REWRITE** — brand hero + Pencil form/link/footer order    |
| `src/app/auth/signup/page.tsx`                     | **REWRITE** — brand hero + Pencil footer                    |
| `src/features/auth/__tests__/login-page.test.tsx`  | **NEW** — login page tests                                  |
| `src/features/auth/__tests__/signup-page.test.tsx` | **NEW** — signup page tests                                 |
| `src/features/auth/actions.test.ts`                | **KEEP passing** — do not touch                             |

### Testing strategy

- **Login page test**: render LoginPage in a test wrapper, assert:
  - Brand hero: Mountain icon `<svg>` present, "Nodo Serrano" heading, subtitle text
  - Form fields: email input with label "Email", password input with label "Contraseña" (in that order)
  - Forgot link: "¿Olvidaste tu contraseña?" with `href="/auth/recovery"`, right-aligned
  - PrimaryButton text: "Ingresar"
  - Divider "o" present
  - SecondaryButton text: "Continuar con Google"
  - Footer: "¿Primera vez?" + "Creá tu cuenta" link with `href="/auth/signup"`
  - Custom className acceptance on wrapper (if present)
  - Error display: render with state error, assert coral error text appears
- **Signup page test**: same structure, but:
  - PrimaryButton text: "Crear cuenta"
  - Footer: "¿Ya tenés cuenta?" + "Iniciá sesión" with `href="/auth/login"`
- **Layout test**: assert no "Nodo Serrano" heading in layout (it moved to pages), ThemeToggle present
- Use `render`, `screen.getByText`, `screen.getByRole`, `screen.getByLabelText`, `toHaveAttribute`, `toHaveClass`

### Architecture / stack

- Next.js 16 App Router, React 19, Tailwind v4
- Package manager: pnpm
- Tests: Vitest + Testing Library + jsdom
- `lucide-react` already installed (Story 1.4); Mountain icon available
- DS primitives (Input, PrimaryButton, SecondaryButton) already Pencil-matched from Epic 1
- `useActionState` for server action forms
- `signInWithPassword`, `signUpWithPassword`, `signInWithGoogle` actions untouched

### Previous story learnings

- **Epic 1 complete**: all DS primitives (Input, PrimaryButton, SecondaryButton, Avatar, Chip, TierBadge, RoleChip, TabBar) Pencil-compliant
- **Tokens available**: brand-mint, brand-blue, brand-violet, bg, surface, border, text-primary, text-secondary, text-muted, text-coral, on-primary — all in `@theme`
- **TabBar tests**: lucide icons rendered as SVGs inside buttons; use `btn.querySelector("svg")` to verify
- **Error display pattern**: `state?.error` renders `<p className="text-sm text-coral bg-coral/10 rounded-md px-3 py-2">`
- **Tailwind v4 gradient**: `bg-linear-to-br from-brand-mint via-brand-blue to-brand-violet` for 3-stop gradient
- **Arbitrary shadow**: `shadow-[0_8px_22px_-4px_rgba(17,88,176,0.33)]` — matches Pencil `#1158b055` at ~33% opacity

### Grey-box search targets (post-implementation)

```bash
# Must return ZERO
grep -rn '"Nodo Serrano"' src/app/auth/layout.tsx      # → ZERO (moved to pages)
grep -rn 'text-brand-mint' src/app/auth/login/page.tsx  # → ZERO (links now coral)
grep -rn 'text-brand-mint' src/app/auth/signup/page.tsx # → ZERO
grep -rn 'Registrate' src/app/auth/login/page.tsx       # → ZERO (now "Creá tu cuenta")
grep -rn '¿No tenés cuenta' src/app/auth/login/page.tsx # → ZERO (now "¿Primera vez?")

# Must exist
grep -rn 'Mountain' src/app/auth/login/page.tsx         # → PRESENT
grep -rn 'from-brand-mint via-brand-blue to-brand-violet' src/app/auth/login/page.tsx # → PRESENT
grep -rn 'text-coral' src/app/auth/login/page.tsx       # → PRESENT (footer link)
grep -rn 'gap-\[22px\]' src/app/auth/login/page.tsx     # → PRESENT
```

### Do NOT

- Do not change `signInWithPassword`, `signUpWithPassword`, `signInWithGoogle` server action logic
- Do not change `useActionState` import or usage pattern (keep `/auth/actions` imports)
- Do not modify Input, PrimaryButton, or SecondaryButton components (Epic 1 done)
- Do not touch `globals.css`, `@theme`, or design tokens
- Do not touch other auth pages: `/auth/check-email` (2.2), `/auth/recovery`, `/auth/reset-password` (2.3)
- Do not add new npm packages (lucide-react already installed)
- Do not add new routes or redirects
- Do not change RLS or auth middleware
- Do not remove ThemeToggle from auth flow
- Do not change pending/disabled state patterns on buttons
- Do not leave intentional tech debt

### References

- Pencil: `design/nodo-serrano.pen` — Frame `RCjjt` (1.1 · Login / Registro) + brand mark `i0moy5`
- Spec: `_bmad-output/specs/spec-ui-fidelity-m0-m2/SPEC.md` (CAP-4)
- Screen inventory: `_bmad-output/specs/spec-ui-fidelity-m0-m2/screen-inventory.md`
- Brownfield: `_bmad-output/specs/spec-ui-fidelity-m0-m2/brownfield.md`
- Epics: `_bmad-output/planning-artifacts/epics.md` (Story 2.1 section)
- Sprint: `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (OpenCode)

### Debug Log References

- RED phase: `pnpm test` confirmed 3 tests failed (no "Nodo Serrano" heading, no "Creá tu cuenta" footer, no brand mark SVG)
- GREEN phase: rewrote login, signup, and layout with brand hero + Pencil structure, 145/145 tests pass, typecheck clean, grey-box all clear

### Completion Notes List

- **Auth layout**: removed "Nodo Serrano" heading + header bar; simplified to `relative min-h-full bg-bg` with ThemeToggle `absolute top-4 right-4 z-10`
- **Login page**: added brand hero (Mountain icon in 76×76 gradient circle mint→blue→violet at 135° + "Nodo Serrano" 26px bold + subtitle 14px); wrapper `px-[26px] py-6 gap-[22px]`; form order email→password→forgot link (right-aligned); divider "o" 13px gap-[12px]; footer "¿Primera vez? Creá tu cuenta" in coral; preserved useActionState, error display, pending states
- **Signup page**: same brand hero + wrapper; button "Crear cuenta"; footer "¿Ya tenés cuenta? Iniciá sesión" in coral
- Server actions (`signInWithPassword`, `signUpWithPassword`, `signInWithGoogle`) untouched; existing actions.test.ts passes
- `pnpm test`: 19 files, 145 tests, all pass
- `pnpm typecheck`: clean
- Grey-box: zero layout heading, zero text-brand-mint in pages, zero "Registrate"/"¿No tenés cuenta", Mountain icon + gradient + text-coral + gap-[22px] all present

### Change Log

- **2026-07-24:** Implemented Pencil brand layout for login/signup. TDD: 3 RED → 3 GREEN. Added 76×76 gradient circle with Mountain icon as brand mark. Restructured auth layout (ThemeToggle absolute top-right). Footer links now use text-coral. Forgot password link moved between password field and button. All 3 files (layout + login + signup) minimal rewrite.

### File List

- `src/app/auth/layout.tsx` — modified (removed heading, simplified to relative+absolute ThemeToggle)
- `src/app/auth/login/page.tsx` — modified (brand hero, Pencil wrapper, form order, footer)
- `src/app/auth/signup/page.tsx` — modified (brand hero, Pencil footer)
- `src/features/auth/__tests__/login-page.test.tsx` — new (9 assertions)
- `src/features/auth/__tests__/signup-page.test.tsx` — new (3 assertions)
- `src/features/auth/actions.test.ts` — NOT modified (passes unchanged)
