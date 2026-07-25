---
baseline_commit: TBD
---

# Story 3.4: Tourist profile shell (2.7)

Status: ready-for-dev

<!-- Story context engine — from epics.md Story 3.4, SPEC.md CAP-7, screen-inventory.md, and Pencil frame J0GRm. -->

## Story

As a tourist,
I want my profile to match Pencil Tourist shell,
so that I understand my tier and path to membership without fake privileges.

## Acceptance Criteria

### 1. Identity card matching Pencil (FR20, UX-DR8)

**Given** Pencil frame `2.7 · Perfil (Tourist)` node `NQTAN`
**When** `/profile` renders with `tier = tourist`
**Then** page header reads "Mi perfil" with a pencil icon (Lucide `Pencil`, 20×20, `text-text-secondary`)
**And** the identity card is `rounded-[24px] bg-surface border border-border p-4`
**And** inside: Avatar (name initial fallback or image), name via `displayName(profile)`, email row, and TierBadge( tourist )
**And** no "Modo lectura — Tourist" chrome from old design appears
**And** no old field grid (bio, nombre, apellido, contacto) renders in the tourist branch

### 2. Membership CTA card matching Pencil (FR20, UX-DR8)

**Given** Pencil CTA card `hvGsg`
**When** `/profile` renders in tourist branch
**Then** a membership card renders: `rounded-[22px] bg-gradient-to-br from-brand-mint to-brand-blue p-[18px] flex flex-col gap-3`
**And** header row: Lucide `Mountain` icon (22×22, `text-on-primary`) + "Todavía sos Tourist" (`font-display text-[17px] font-bold text-on-primary`)
**And** body copy: "Sumate como Serrano para aparecer en el plantel, crear eventos y participar de los proyectos." (`font-body text-[13px] text-on-primary/[0.88] leading-relaxed`)
**And** CTA button: `rounded-pill bg-on-primary h-[46px] flex items-center justify-center w-full`
**And** CTA text: "Solicitar ser Serrano" (`font-display text-[15px] font-semibold text-brand-blue`)
**And** CTA is **visible and styled but NO-OP** — no `onClick`, no `Link`, no `form`, no `alert`. It does not navigate or submit.

### 3. Short menu group matching Pencil (FR20, UX-DR8)

**Given** Pencil menu group `lnjJq`
**When** `/profile` renders in tourist branch
**Then** a menu card renders: `rounded-[20px] bg-surface border border-border overflow-hidden flex flex-col`
**And** contains exactly three menu rows with hairline separators between them:

| Row | Icon (Lucide)       | Label           | Icon color      | Row text color    | Row padding    | Notes                                                                                  |
| --- | ------------------- | --------------- | --------------- | ----------------- | -------------- | -------------------------------------------------------------------------------------- |
| 1   | `UserRound` (20×20) | "Editar perfil" | text-brand-blue | text-text-primary | px-4 py-[15px] | Clickable — links to `/profile/edit`; trailing `ChevronRight` icon (18×18, text-muted) |
| 2   | `Moon` (20×20)      | "Modo oscuro"   | text-brand-blue | text-text-primary | px-4 py-[13px] | Trailing toggle switch (see 3a)                                                        |
| 3   | `LogOut` (20×20)    | "Cerrar sesión" | text-coral      | text-coral        | px-4 py-[15px] | Clickable — calls `signOut()` server action; no trailing chevron                       |

**And** each separator is a 1px `bg-border` horizontal rule, `w-full`

#### 3a. Theme toggle switch

**Given** Pencil toggle `w7wZQ`
**When** the dark mode row renders
**Then** the trailing toggle is `w-[46px] h-7 rounded-pill bg-surface-inset border border-border p-[3px]`
**And** the knob inside is a 22×22 white circle or ellipse positioned left (light) or right (dark)
**And** clicking the toggle row or toggle calls the existing `useTheme().toggle` hook
**And** it does NOT render the current `<ThemeToggle />` shared button (which shows "Claro"/"Oscuro")

### 4. Branch exclusivity (FR20)

**Given** a profile with `tier !== tourist` (serrano, scholar, etc.)
**When** `/profile` renders
**Then** the tourist shell (identity card + CTA banner + short menu) does NOT render
**And** the non-tourist branch renders instead (handled by Story 3.5 — not modified here)
**And** existing `isTourist` branch logic in the page is preserved: non-tourist path untouched

### 5. No fake privileges (FR20)

**Given** tourist profile renders
**When** inspecting the page
**Then** no Serrano-only menu items appear (no "Proyectos", "Aportes", "Skills", "Plantel" rows)
**And** no membership request form or M3 feature code exists
**And** the "Solicitar ser Serrano" CTA has no handler — it is purely visual

### 6. Tests (NFR2)

**Given** TDD required
**When** implemented
**Then** tests cover: identity card (Avatar + name + TierBadge), membership CTA banner copy + no-op button, menu items (edit/theme/logout links and actions), dark mode toggle click fires `toggle`, logout click invokes `signOut`, no Serrano-only items, no old field grid or "Modo lectura" badge
**And** `pnpm test`, `pnpm typecheck`, and `pnpm lint` pass

## Pencil → Tailwind Token Map

### Identity card (pptc / NQTAN)

| Pencil property    | Pencil value         | Tailwind class                                    |
| ------------------ | -------------------- | ------------------------------------------------- |
| cornerRadius       | 24                   | `rounded-[24px]`                                  |
| fill               | `$surface`           | `bg-surface`                                      |
| stroke             | `$border` 1px inside | `border border-border`                            |
| padding            | 16                   | `p-4`                                             |
| gap                | 14                   | `gap-3.5`                                         |
| Avatar size        | 60×60                | `size-[60px]` (via className on Avatar component) |
| Name fontSize      | 18                   | `text-lg` (~18px) or `text-[18px]`                |
| Name fontWeight    | 700                  | `font-bold`                                       |
| Name fontFamily    | `$font-display`      | `font-display`                                    |
| Name fill          | `$text-primary`      | `text-text-primary`                               |
| Email pill fill    | `#8a847c20`          | `bg-text-muted/20`                                |
| Email pill radius  | 999                  | `rounded-pill`                                    |
| Email pill padding | [10, 4]              | `px-[10px] py-1`                                  |
| Email fontSize     | 12                   | `text-xs`                                         |
| Email fontFamily   | `$font-body`         | `font-body`                                       |
| Email fill         | `$text-muted`        | `text-text-muted`                                 |
| Email row gap      | 8                    | `gap-2`                                           |

### Membership CTA (cta / hvGsg)

| Pencil property                  | Pencil value                          | Tailwind class                                    |
| -------------------------------- | ------------------------------------- | ------------------------------------------------- |
| cornerRadius                     | 22                                    | `rounded-[22px]`                                  |
| fill                             | gradient brand-mint → brand-blue 135° | `bg-gradient-to-br from-brand-mint to-brand-blue` |
| padding                          | 18                                    | `p-[18px]`                                        |
| gap                              | 12                                    | `gap-3`                                           |
| Mountain icon size               | 22×22                                 | `size-[22px]`                                     |
| Mountain icon fill               | `$on-primary`                         | `text-on-primary`                                 |
| "Todavía sos Tourist" fontSize   | 17                                    | `text-[17px]`                                     |
| "Todavía sos Tourist" fontWeight | 700                                   | `font-bold`                                       |
| "Todavía sos Tourist" fontFamily | `$font-display`                       | `font-display`                                    |
| Description fontSize             | 13                                    | `text-[13px]`                                     |
| Description fill                 | `#f8f4ede0` (on-primary 88%)          | `text-on-primary/[0.88]`                          |
| Description fontFamily           | `$font-body`                          | `font-body`                                       |
| Description lineHeight           | 1.5                                   | `leading-relaxed`                                 |
| CTA button radius                | 999                                   | `rounded-pill`                                    |
| CTA button fill                  | `$on-primary`                         | `bg-on-primary`                                   |
| CTA button height                | 46                                    | `h-[46px]`                                        |
| CTA text fontSize                | 15                                    | `text-[15px]`                                     |
| CTA text fontWeight              | 600                                   | `font-semibold`                                   |
| CTA text fill                    | `$brand-blue`                         | `text-brand-blue`                                 |

### Menu group (gpt / lnjJq)

| Pencil property      | Pencil value         | Tailwind class                      |
| -------------------- | -------------------- | ----------------------------------- |
| cornerRadius         | 20                   | `rounded-[20px]`                    |
| fill                 | `$surface`           | `bg-surface`                        |
| stroke               | `$border` 1px inside | `border border-border`              |
| clip                 | true                 | `overflow-hidden`                   |
| Menu row gap         | 12                   | `gap-3`                             |
| Menu icon size       | 20×20                | `size-5`                            |
| Menu text fontSize   | 15                   | `text-[15px]`                       |
| Menu text fontFamily | `$font-body`         | `font-body`                         |
| ChevronRight size    | 18×18                | `size-[18px]`                       |
| Separator            | 1px `$border`        | `h-px bg-border w-full`             |
| Toggle width         | 46                   | `w-[46px]`                          |
| Toggle height        | 28                   | `h-7`                               |
| Toggle radius        | 999                  | `rounded-pill`                      |
| Toggle fill          | `$surface-inset`     | `bg-surface-inset`                  |
| Toggle knob          | 22×22 white          | `size-[22px] rounded-full bg-white` |

## Tasks / Subtasks

- [ ] **T1 — Red: test scaffold** (AC: 1, 2, 3, 4, 5)
  - [ ] `src/features/profile/__tests__/profile-tourist.test.tsx` — full test suite before implementation
  - [ ] Mock `@/lib/supabase/server` with tourist profile fixture (`tier: "tourist"`, name, email, etc.)
  - [ ] Mock `@/features/auth/actions` for `signOut`
  - [ ] Tests cover all AC 1–5
  - [ ] Verify RED: existing page renders old layout, new tests fail / element not found
- [ ] **T2 — Green: tourist branch in profile page** (AC: 1, 2, 3, 4, 5)
  - [ ] Rewrite `isTourist` branch in `src/app/(app)/profile/page.tsx`
  - [ ] Identity card: Avatar + name + email + TierBadge
  - [ ] Membership CTA gradient card with Mountain icon and no-op button
  - [ ] Menu group: edit profile (link), dark mode (toggle), cerrar sesión (form action)
  - [ ] All tests pass
- [ ] **T3 — Verify**
  - [ ] `pnpm test` passes (all new + existing tests)
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm lint` passes
  - [ ] Manual check: `/profile` as tourist shows Pencil shell at ~390px width; non-tourist branch unaffected

## Files to Touch

| Action                        | File                                                      |
| ----------------------------- | --------------------------------------------------------- |
| REWRITE (tourist branch only) | `src/app/(app)/profile/page.tsx`                          |
| NEW                           | `src/features/profile/__tests__/profile-tourist.test.tsx` |

### Existing files unchanged

| File                             | Reason                                                                      |
| -------------------------------- | --------------------------------------------------------------------------- |
| `src/components/Avatar.tsx`      | DS primitive from Epic 1 — already Pencil-matched                           |
| `src/components/TierBadge.tsx`   | DS primitive from Epic 1 — already Pencil-matched                           |
| `src/components/ThemeToggle.tsx` | Shared component — not modified (tourist profile uses inline Pencil toggle) |
| `src/features/auth/actions.ts`   | `signOut` server action — consumed, not modified                            |

## Dev Notes

### Profile page architecture

The current `src/app/(app)/profile/page.tsx` is a **server component** that calls `createClient()` directly. For the tourist branch:

- **Server-rendered** parts: identity card, membership CTA card (NO-OP), menu group structure
- **Client islands needed for**: theme toggle (requires `useTheme().toggle`), logout (requires form action → server action)

The toggle and logout interactions require a client boundary. Use a `"use client"` child component for the menu group (or for the dark-mode row specifically) that imports `useTheme` and calls `signOut`.

### Avatar size mismatch

Pencil shows 60×60 avatar. The `Avatar` component supports sizes: `sm` (32px), `md` (48px), `lg` (80px). Use `size="lg"` with a `className="size-[60px]"` override, or add a new size. The Pencil intent is `size-[60px]`.

### Email pill decoration (ppb / LGkPt)

Pencil shows a small pill (`rounded-pill`, `bg-text-muted/20`, `px-[10px] py-1`) with "..." content before the email. This appears to be a decorative element. Implement it as a small empty/placeholder pill — verify against the Pencil screenshot for visual parity.

### Theme toggle vs ThemeToggle component

The Pencil toggle `w7wZQ` is a pill switch (46×28, surface-inset, white knob), not the `<ThemeToggle />` shared button. Implement the toggle **inline** in the tourist profile menu row. Do NOT modify `<ThemeToggle />` — it serves other pages. A future story may unify them.

```tsx
// Inline toggle (client island)
function ThemeToggleSwitch() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="w-[46px] h-7 rounded-pill bg-surface-inset border border-border p-[3px] transition-colors"
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <div
        className={cn(
          "size-[22px] rounded-full bg-white transition-transform",
          dark && "translate-x-[18px]",
        )}
      />
    </button>
  );
}
```

### Logout mechanism

The existing `signOut()` from `@/features/auth/actions.ts` is a server action. The logout row should use a `<form action={signOut}>` wrapping the button:

```tsx
<form action={signOut}>
  <button type="submit" className="flex items-center gap-3 px-4 py-[15px] w-full">
    <LogOut size={20} className="text-coral shrink-0" />
    <span className="font-body text-[15px] text-coral text-left flex-1">Cerrar sesión</span>
  </button>
</form>
```

### Category → Pencil node map

| Pencil node     | id                    | code location                         |
| --------------- | --------------------- | ------------------------------------- |
| Root frame      | `J0GRm`               | `page.tsx` (tourist branch)           |
| Header row      | `mD8js`               | "Mi perfil" title + Pencil icon       |
| Identity card   | `NQTAN`               | Profile card container                |
| Avatar          | `KvESm` (ref `aaHkg`) | `<Avatar>` component                  |
| Name text       | `FWAcw`               | `displayName(profile)`                |
| Email pill      | `LGkPt`               | Small decorative pill                 |
| Email text      | `bQCwS`               | `profile.email` (from Supabase)       |
| CTA card        | `hvGsg`               | Membership gradient card              |
| CTA header row  | `zJmG4`               | Mountain icon + "Todavía sos Tourist" |
| CTA description | `qBCM1`               | Membership copy                       |
| CTA button      | `s3mpjM`              | "Solicitar ser Serrano" (NO-OP)       |
| Menu group      | `lnjJq`               | Menu card container                   |
| Edit row        | `FbFjb` (gr1)         | Link to `/profile/edit`               |
| Theme row       | `qFTtO` (gr2)         | Dark mode toggle switch               |
| Logout row      | `TofY2` (gr3)         | `signOut` form action                 |
| Separator       | `QIQ1w`, `XoXMh`      | `h-px bg-border`                      |

### Testing strategy

**Mock setup** follows existing patterns in `actions.test.ts`:

```ts
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mocks.profilesSelectSingle })),
      })),
    })),
  }),
}));
```

**Tourist profile fixture:**

```ts
const touristProfile = {
  id: "user-1",
  tier: "tourist",
  nombre: "Juan",
  apellido: "Visitante",
  apodo: null,
  nombre_visible: "nombre_apellido",
  avatar_url: null,
  email: "juan@gmail.com", // or via auth.getUser
};
```

**Test cases:**

1. **Identity card renders**:
   - Avatar component present with initials "JV"
   - Name "Juan Visitante" via `displayName()`
   - Email "juan@gmail.com" visible
   - TierBadge with "Tourist" label visible
   - No "Modo lectura" badge

2. **Membership CTA renders**:
   - Mountain icon present
   - "Todavía sos Tourist" text
   - Membership description copy present
   - "Solicitar ser Serrano" button visible
   - Clicking CTA button does NOT navigate (no `<a>`, no `href`, no `onClick`)

3. **Menu items render**:
   - "Editar perfil" row present with link to `/profile/edit`
   - "Modo oscuro" row present
   - "Cerrar sesión" row present
   - No "Proyectos", "Aportes", "Skills" rows

4. **Logout calls signOut**:
   - Mock `signOut` from `@/features/auth/actions`
   - Click "Cerrar sesión" row/button
   - Assert `signOut` was called

5. **Theme toggle calls useTheme().toggle**:
   - Mock `useTheme` → `{ dark: false, toggle: vi.fn() }`
   - Click toggle button
   - Assert `toggle` was called

6. **Absence tests**:
   - No old field grid (no "Nombre", "Apellido", "Bio" labels)
   - No "Modo lectura — Tourist" badge
   - No Serrano-only menu items

### Do NOT

- **No** membership request flow, form, or navigation for "Solicitar ser Serrano" (M3)
- **No** Serrano menu items (Proyectos, Aportes, Skills, Plantel)
- **No** changes to Avatar, TierBadge, ThemeToggle, or any DS primitive component
- **No** changes to the non-tourist branch of profile page — that's Story 3.5
- **No** fake/stub profile data — use real Supabase `profiles` table
- **No** old "Modo lectura — Tourist" badge or old field grid
- **No** `globals.css` or `@theme` changes
- **No** TabBar changes — it's in `(app)/layout.tsx`

### Grey-box search targets (post-implementation)

Must return ZERO (in tourist branch only):

```bash
# No old tourist badge
rg "Modo lectura" src/app/\(app\)/profile/

# No Serrano menu items in tourist branch
rg "Proyectos|Aportes|Skills|Plantel" src/app/\(app\)/profile/

# No membership navigation
rg "href.*solicitar|href.*serrano" src/app/\(app\)/profile/
```

Must be PRESENT:

```bash
# Pencil tokens in use
rg "rounded-\[24px\]" src/app/\(app\)/profile/
rg "rounded-\[22px\]" src/app/\(app\)/profile/
rg "from-brand-mint" src/app/\(app\)/profile/
rg "Solicitar ser Serrano" src/app/\(app\)/profile/
rg "signOut" src/app/\(app\)/profile/
```

### References

- Linear [ZER-15](https://linear.app/zerrant/issue/ZER-15/34-tourist-profile-shell-27)
- `_bmad-output/planning-artifacts/epics.md` — Story 3.4, FR20, UX-DR8
- `_bmad-output/specs/spec-ui-fidelity-m0-m2/SPEC.md` — CAP-7
- `_bmad-output/specs/spec-ui-fidelity-m0-m2/screen-inventory.md` — Frame 2.7
- `design/nodo-serrano.pen` — Pencil frame `J0GRm` (sole visual SSOT)
- `src/app/globals.css` — existing `@theme` tokens
- `src/components/Avatar.tsx` — DS primitive (Epic 1)
- `src/components/TierBadge.tsx` — DS primitive (Epic 1)
- `src/features/auth/actions.ts` — `signOut` server action
- `src/features/profile/displayName.ts` — name display helper
- `src/features/auth/__tests__/login-page.test.tsx` — page-level test conventions
- `src/features/profile/actions.test.ts` — Supabase mock patterns

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

- `src/app/(app)/profile/page.tsx` (tourist branch rewritten)
- `src/features/profile/__tests__/profile-tourist.test.tsx` (new)
