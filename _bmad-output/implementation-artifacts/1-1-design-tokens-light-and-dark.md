---
baseline_commit: 4409f696ec0937ad4511a9cc6397a6ab5d101fd5
---

# Story 1.1: Design tokens light and dark

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a member using the app,
I want colors, type, and radii to match the Pencil design system in light and dark,
so that the product feels like Nodo Serrano, not a generic shell.

## Acceptance Criteria

1. **Given** the Tailwind theme configuration  
   **When** tokens are compared to Pencil variables in `design/nodo-serrano.pen`  
   **Then** these exist with Pencil values:  
   `bg`, `surface`, `surface-inset`, `border`, `text-primary`, `text-secondary`, `text-muted`, `on-primary`, `brand-mint`, `brand-green`, `brand-blue`, `brand-violet`, `primary`, `coral`, `warm-yellow`, `warm-orange`, `warm-violet`, `mint-raw`, `blue-raw`, `violet-raw`, `font-display` (Space Grotesk), `font-body` (Inter), `radius-sm|md|lg|xl|pill` (12/18/24/30/999)  
   **(FR1, UX-DR1)**

2. **Given** dark-mode token values for themed surfaces/text/border  
   **When** the document root has class `dark` (ThemeToggle / `useTheme`)  
   **Then** `bg`, `surface`, `surface-inset`, `text-primary`, `text-secondary`, `text-muted`, `border` switch to Pencil dark values  
   **And** this must NOT rely only on `@media (prefers-color-scheme: dark)` — class `.dark` must drive tokens  
   **(FR2, UX-DR13)**

3. **Given** light mode (no `.dark` on `<html>`)  
   **When** surfaces use token utilities (`bg-bg`, `bg-surface`, `text-text-primary`, etc.)  
   **Then** values match Pencil light theme  
   **And** chrome that already uses tokens does not introduce new hardcoded hex one-offs in this story  
   **(FR2)**

4. **Given** TDD  
   **When** implementation is complete  
   **Then** automated tests prove token map parity and/or theme class applies dark CSS variables  
   **And** `pnpm test` passes  
   **(NFR2)**

5. **Out of scope for this story**
   - Full per-screen dark pixel QA
   - Changing PrimaryButton gradient (Story 1.2)
   - TabBar/icons (Story 1.4)
   - Any page layout fidelity

## Tasks / Subtasks

- [x] **T1 — Red: tests first** (AC: 1, 2, 4)
  - [x] Add test(s) that encode expected Pencil light/dark hex values for themed tokens
  - [x] Add test that applying `.dark` on a root updates resolved CSS custom properties (jsdom or pure CSS module assertion strategy)
  - [x] Confirm tests fail or expose the current bug (class toggle vs media-only)

- [x] **T2 — Fix dark token application** (AC: 2, 3)
  - [x] Update `src/app/globals.css` so dark token overrides apply under `.dark` (and keep `prefers-color-scheme` in sync if desired, but **class is authoritative** for ThemeToggle)
  - [x] Ensure `@variant dark` continues to work with Tailwind `dark:` utilities if used

- [x] **T3 — Token parity audit** (AC: 1)
  - [x] Diff `@theme` block vs Pencil variables (see Dev Notes table)
  - [x] Add any missing names; do not rename tokens already used widely (`bg-bg`, `text-text-primary`, `rounded-pill`, etc.) without updating all call sites
  - [x] Keep radius values 12/18/24/30/999

- [x] **T4 — Theme bootstrap consistency** (AC: 2)
  - [x] Review `useTheme` + root layout: on first paint, if `localStorage.theme === 'dark'`, `<html>` should get `dark` without flash if already handled; if missing FOUC fix is tiny and required for prod, include it; do not redesign ThemeToggle
  - [x] Do not break `ThemeToggle` tests

- [x] **T5 — Verify** (AC: 4)
  - [x] `pnpm test`
  - [x] `pnpm typecheck` if types touched
  - [x] Manual: toggle ThemeToggle → background/text flip using tokens

## Dev Notes

### Critical bug (must fix)

Current `globals.css` sets dark surfaces only inside:

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* dark tokens */
  }
}
```

But `useTheme` toggles **`document.documentElement.classList.toggle("dark", next)`** and does **not** change OS preference.

**Result:** ThemeToggle can set `.dark` while CSS variables stay light → broken dark mode for explicit toggle.

**Fix pattern (Tailwind v4):** define dark token values under `.dark` (or `@variant dark` root selectors), e.g.:

```css
.dark {
  --color-bg: #1a1614;
  --color-surface: #262019;
  /* ... remaining themed tokens ... */
}
```

Optional: keep `@media (prefers-color-scheme: dark)` for users with no stored preference **only if** it does not fight class strategy. Prefer: class wins when present; media applies when no explicit class/localStorage. Simplest production-safe approach: **mirror the same dark variable block under `.dark`**, and use media only as default before JS (if FOUC script sets class early, media is secondary).

### Pencil token SSOT (exact values)

Source: Pencil variables + `_bmad-output/specs/spec-ui-fidelity-m0-m2/component-parity.md`

| Token                   | Light                   | Dark (if themed) |
| ----------------------- | ----------------------- | ---------------- |
| bg                      | `#f8f4ed`               | `#1a1614`        |
| surface                 | `#fefbf6`               | `#262019`        |
| surface-inset           | `#f1ebe0`               | `#201b17`        |
| border                  | `#e6dfd3`               | `#37302a`        |
| text-primary            | `#1a1614`               | `#f8f4ed`        |
| text-secondary          | `#5a5550`               | `#c4bdb2`        |
| text-muted              | `#8a847c`               | `#8a847c`        |
| on-primary              | `#f8f4ed`               | (same)           |
| brand-mint              | `#0a8268`               | —                |
| brand-green             | `#0c8a5e`               | —                |
| brand-blue              | `#1158b0`               | —                |
| brand-violet            | `#6b3fa8`               | —                |
| primary                 | `#0c8a5e`               | —                |
| coral                   | `#c70067`               | —                |
| warm-yellow             | `#ff9728`               | —                |
| warm-orange             | `#ff4d21`               | —                |
| warm-violet             | `#9e1fd0`               | —                |
| mint-raw                | `#4fe6c3`               | —                |
| blue-raw                | `#2e9bff`               | —                |
| violet-raw              | `#b57fe0`               | —                |
| radius-sm/md/lg/xl/pill | 12 / 18 / 24 / 30 / 999 | —                |
| font-display            | Space Grotesk           | —                |
| font-body               | Inter                   | —                |

**Already present in `src/app/globals.css` `@theme`:** most colors + radii + fonts. Primary work is **dark class wiring + tests**, not inventing a new token system.

### Files to touch (expected)

| File                                                                 | Action                                                               |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/app/globals.css`                                                | **UPDATE** — dark tokens under `.dark`; verify `@theme` completeness |
| `src/lib/useTheme.ts`                                                | **UPDATE only if needed** for FOUC/subscribe correctness             |
| `src/app/layout.tsx`                                                 | **UPDATE only if** FOUC script or className bootstrap needed         |
| `src/lib/useTheme.test.ts` or `src/app/globals.tokens.test.ts` (new) | **NEW** — parity + dark class tests                                  |
| `src/components/ThemeToggle.test.tsx`                                | **KEEP passing** — do not regress                                    |

### Do NOT

- Do not change PrimaryButton green→mint (Story 1.2)
- Do not rewrite all pages to new token names
- Do not add a second theme library (next-themes) unless absolutely necessary — project already has `useTheme`
- Do not invent tokens not in Pencil
- Do not mark story done without tests proving `.dark` changes CSS variables
- Do not leave intentional debt (AGENTS.md production-first)

### Architecture / stack

- Next.js 16 App Router, React 19, Tailwind v4 (`@import "tailwindcss"`, `@theme`, `@variant dark`)
- Package manager: pnpm
- Tests: Vitest + Testing Library + jsdom (`pnpm test`)
- Fonts already loaded via `next/font` in `layout.tsx` (`--font-display`, `--font-body`)
- Utility classes already used: `bg-bg`, `text-text-primary`, `font-display`, `rounded-pill`, `bg-surface`, etc.

### Testing requirements

- **TDD mandatory** (project AGENTS.md)
- Prefer pure unit tests:
  - Export a frozen `PENCIL_TOKENS` map from a small `src/lib/designTokens.ts` **if** that makes testing clean — OR parse/assert known values in test without over-engineering
  - Test: after setting `document.documentElement.classList.add('dark')`, reading `getComputedStyle(document.documentElement).getPropertyValue('--color-bg')` equals dark hex (may need to inject/link CSS in jsdom — if jsdom cannot load globals.css reliably, test the token map module + a minimal CSS string that mirrors production selectors)
- Keep approach production-simple: one source of truth for expected hex values used by both docs and tests if extracted

### Previous story intelligence

- No previous story in Epic 1
- Recent commits: component test expansion, ThemeToggle SVG icons, hydration fixes — preserve ThemeToggle behavior

### Git intelligence

- `0ffad3e` ThemeToggle uses inline SVGs (not emoji) — leave alone unless broken
- `3ea81a8` broad component tests — follow existing Vitest patterns

### Project constraints

- [Source: `_bmad-output/specs/spec-ui-fidelity-m0-m2/SPEC.md`] CAP-1, light-first screen QA, dark token parity required
- [Source: `_bmad-output/specs/spec-ui-fidelity-m0-m2/component-parity.md`] token table
- [Source: `docs/roadmap/Design system.md`] Space Grotesk / Inter, warm palette
- [Source: `_bmad-output/planning-artifacts/epics.md`] Story 1.1 ACs
- [Source: `AGENTS.md`] production-first, TDD, Pencil SSOT

### References

- Pencil: `design/nodo-serrano.pen` (variables)
- Current theme CSS: `src/app/globals.css`
- Theme hook: `src/lib/useTheme.ts`
- Toggle UI: `src/components/ThemeToggle.tsx`

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (OpenCode)

### Debug Log References

- RED phase: `pnpm test` confirmed 5 tests failed on `.dark { }` selectors (no `.dark { ... }` block in globals.css), 104 existing tests passed
- GREEN phase: added `.dark { ... }` block to globals.css → all 109 tests pass

### Completion Notes List

- Created `src/lib/designTokens.ts` with frozen PENCIL_TOKENS (light, dark, radius, font maps)
- Created `src/lib/designTokens.test.ts` with 14 tests: token parity, CSS `.dark` assertion, DOM computed style
- Fixed critical bug: added `.dark { --color-bg: #1a1614; ... }` block in `src/app/globals.css` so ThemeToggle class toggle actually changes CSS variables
- Added FOUC-prevention inline script in `src/app/layout.tsx` — sets `.dark` class before paint if localStorage or prefers-color-scheme is dark
- `@variant dark` preserved; `prefers-color-scheme` media query kept as fallback
- Code review HIGH fixed: added `useEffect` in `useTheme.ts` to sync `.dark` class on mount/post-hydration; FOUC script sets class early, React hydration strips it, effect re-applies it
- Created `src/lib/useTheme.test.tsx` with 4 tests: class sync on mount, toggle add/remove
- Added `window.matchMedia` mock to `src/test/setup.ts`
- Added SSOT comment to `designTokens.ts` to prevent accidental deletion
- Fixed sprint-status.yaml comment timestamp
- `pnpm test`: 17 files, 113 tests, all pass
- `pnpm typecheck`: clean

### Change Log

- **2026-07-23 (post-review):** Fixed hydration dark class sync — added `useEffect` in `useTheme` to re-apply `.dark` after React hydration strips FOUC-set class. Added `useTheme.test.tsx` (TDD: RED→GREEN). Mocked `window.matchMedia` in test setup.

### File List

- `src/lib/designTokens.ts` — new
- `src/lib/designTokens.test.ts` — new
- `src/lib/useTheme.ts` — modified (useEffect sync)
- `src/lib/useTheme.test.tsx` — new
- `src/app/globals.css` — modified
- `src/app/layout.tsx` — modified
- `src/test/setup.ts` — modified (matchMedia mock)
