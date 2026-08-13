---
story_key: 3-3-confirmacion-de-envio
linear: ZER-26
pencil_frame: D1hKT
baseline_commit: bdbd950909ea33ed4ff05a4c01cf7c6af7e8cc65
---

# Story 3.3: Confirmación de envío (1.9)

Status: review

<!-- Linear ZER-26. Not epic-3 onboarding 3.3. Do not touch onboarding. -->

## Story

As a tourist who just submitted a membership request,
I want a confirmation screen that matches Pencil 1.9,
so that I know the request was sent and I can leave the flow.

## Acceptance Criteria

### 1. Route and redirect (ZER-26)

**Given** a tourist submits `/solicitar` successfully
**When** `createMembershipRequest` finishes the insert
**Then** it `redirect("/solicitar/enviado")` — not `/profile`
**And** the page lives at `src/app/(app)/solicitar/enviado/page.tsx` (App Router group `(app)`, not `src/app/solicitar/`)

### 2. Visual parity — Pencil `D1hKT`

**Given** frame `1.9 · ¡Solicitud enviada!`
**When** `/solicitar/enviado` renders
**Then** 104×104 circle, `rounded-full`, gradient **mint → green** (`from-brand-mint to-brand-green`), centered
**And** Lucide `Check` (or `CheckCircle`) in `text-on-primary` inside the circle
**And** title exactly `¡Solicitud enviada!` (`font-display text-[22px] font-bold text-text-primary`)
**And** subtitle exactly `Un admin va a revisar tu pedido. Te avisamos cuando te aprueben como Serrano.` (`font-body text-[14px] text-text-secondary leading-[1.5] text-center`)
**And** CTA label exactly `Volver al inicio` (`font-display text-[16px] font-medium`), full width, 54px, pill, green→blue 135°
**And** wrapper: `flex flex-col items-center justify-center gap-5 pt-2 px-7 pb-7` (Pencil pad `[8,28,28,28]`, gap 20)
**And** check icon 48×48 `text-on-primary` (`#f8f4ed`)
**And** light-first, ~390px. Fail on IA / CTA / copy divergence.

### 3. "Volver al inicio"

**Given** the user taps `Volver al inicio`
**When** navigation runs
**Then** they go to `/` (existing home: logged-in → `/profile`)
**And** do **not** nest `<button>` inside `<a>` — wrap navigation as `Link href="/"` styled like the primary CTA, or a client handler on `PrimaryButton`. Prefer `Link` + shared visual classes.

### 4. Guards (do not show a fake success)

**Given** `/solicitar/enviado` is opened directly
**When** there is no session → redirect `/auth/login`
**When** the user is not a tourist **or** has no `membership_requests` row with `estado = 'pendiente'` → redirect `/profile`
**And** fail closed on profile/request read errors (same lesson as ZER-25: never render the success UI if the query fails)

### 5. Out of scope

- Frame `1.8` pending state on `/profile` (ZER-27)
- Changing `(app)/layout.tsx` padding or hiding TabBar (deferred shell)
- New tables, RLS, or admin flows

### 6. Tests (NFR2)

TDD. Cover: successful insert redirects to `/solicitar/enviado`; page renders title + CTA; CTA `href="/"`; unauthenticated redirect; non-tourist / no-pending redirect; read-error fail-closed.
`pnpm test`, `pnpm typecheck`, `pnpm lint` pass.

## Tasks / Subtasks

- [x] T1 — RED→GREEN: `createMembershipRequest` redirects to `/solicitar/enviado` (AC 1)
  - [x] Update `src/features/membership/actions.test.ts` (today asserts `/profile`)
  - [x] Change `redirect` in `src/features/membership/actions.ts:66`
- [x] T2 — RED→GREEN: `/solicitar/enviado` page + Pencil chrome (AC 2, 3)
  - [x] `src/app/(app)/solicitar/enviado/page.tsx` (+ test)
  - [x] Open `design/nodo-serrano.pen` node `D1hKT` for subtitle, type sizes, gaps, icon size
- [x] T3 — RED→GREEN: guards (AC 4)
- [x] T4 — Verify: targeted tests + `pnpm test` + typecheck + lint

## Dev Notes

### Do this / do not do this

- **Reuse** `PrimaryButton`, `createClient`, existing membership select pattern, Lucide. No new deps.
- **Do not** copy Linear's path `src/app/solicitar/enviado` — that bypasses `(app)` chrome inconsistently. Stay under `(app)`.
- **Do not** use `router.back()` / `history.length` (ZER-25 review). Explicit `href`.
- **Do not** return PostgREST `error.message` to the UI.
- **Do not** implement 1.8 on this page.
- Icon gradient is **mint→green**, not the 1.7 form's mint→blue.

### Current code to change

`createMembershipRequest` (`src/features/membership/actions.ts`): after insert + `revalidatePath("/profile", "layout")`, still revalidate profile, then `redirect("/solicitar/enviado")`. Keep tourist / pending / generic-error checks as they are.

`src/app/(app)/solicitar/` today: `page.tsx` + `SolicitarForm.tsx` only. Add sibling `enviado/`.

Home already defined: `src/app/page.tsx` redirects auth users to `/profile`.

### Shell caveat

`(app)/layout.tsx` applies `p-5` + always-on `TabBarClient`. Pencil 1.9 has no TabBar. Do not "fix" the shell here. Match inner stack/copy; accept chrome. [Source: `_bmad-output/implementation-artifacts/deferred-work.md` — ZER-25 / 4-5]

### Previous story intelligence (ZER-25, just patched)

- Page guard used to fail-open on profile timeout — **fail closed**.
- Action now checks tourist + existing `pendiente` and maps errors to Spanish constants.
- Unique index `membership_requests_one_pending_per_profile` exists (`supabase/migrations/20260813210000_membership_requests_one_pending.sql`).
- Tourist CTA on `/profile` now links to `/solicitar`.
- Tests mock `from("profiles")` + `from("membership_requests")` select/insert separately — extend that mock, do not replace it.

### Testing pattern

Copy `src/app/(app)/solicitar/page.test.tsx` (auth + supabase mock + `redirect` throws `NEXT_REDIRECT:url`). For the success page UI, copy `SolicitarForm.test.tsx` class/copy assertions.

### Pencil

SSOT: `design/nodo-serrano.pen` frame `D1hKT`. Pencil MCP needs the file open in the editor. If MCP is unavailable, export/screenshot that frame before writing CSS.

### Stack

Next.js App Router, TS, Tailwind `@theme` tokens, Vitest + Testing Library. Identifiers English; UI Spanish from Pencil. [Source: `docs/roadmap/Stack técnico.md`]

### References

- Linear: https://linear.app/zerrant/issue/ZER-26/m33-confirmacion-de-envio-19
- Milestone: `docs/roadmap/M3 · Membresía y roles.md`
- Form + action: `src/app/(app)/solicitar/`, `src/features/membership/actions.ts`
- Home redirect: `src/app/page.tsx`
- Similar empty/confirm chrome: `src/app/auth/check-email/page.tsx` (different tokens; do not copy mint circle from there)

## Dev Agent Record

### Agent Model Used

grok-4.6

### Debug Log References

### Completion Notes List

- T1: action redirects to `/solicitar/enviado` (tests failed on `/profile` first).
- T2: `EnviadoConfirmation` matches Pencil D1hKT copy/tokens; CTA is `Link href="/"`.
- T3: fail-closed guards — login / non-tourist / no pending / read errors → `/profile`.
- T4: 649 tests, lint, typecheck green.

### Change Log

- 2026-08-13: Implemented ZER-26 confirmation screen 1.9.

### File List

- src/features/membership/actions.ts
- src/features/membership/actions.test.ts
- src/app/(app)/solicitar/enviado/page.tsx
- src/app/(app)/solicitar/enviado/page.test.tsx
- src/app/(app)/solicitar/enviado/EnviadoConfirmation.tsx
- src/app/(app)/solicitar/enviado/EnviadoConfirmation.test.tsx
- _bmad-output/implementation-artifacts/3-3-confirmacion-de-envio.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
