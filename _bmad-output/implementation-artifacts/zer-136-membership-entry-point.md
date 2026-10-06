# Story ZER-136: Direct "Quiero ser Serrano" entry point

Status: review · Branch: `agumarchetti/zer-136-entry-point-directo-quiero-ser-serrano` (stacked on ZER-143 #107 + ZER-138 #108) · Parent: ZER-125

## Story

As a person who wants to join Nodo Serrano,
I want a dedicated link that takes me straight through registration, profile and membership request, showing which step I'm on,
so that I don't have to go through the tourist experience (Inicio, Agenda, Plantel) to apply.

## Acceptance Criteria

1. **Given** the membership link `/unirme`, **when** a new person (no session) opens it, **then** they land on `/auth/signup` (registration) with no tourist screen in between, and the intent survives signup → check-email → email link → `/auth/callback` (also on a different device), login and Google OAuth.
2. **Given** the pipeline in progress, **when** the user advances, **then** a progress indicator shows the current step out of: Registro → Verificación → Perfil → Solicitud → Horario → Entrevista → Resolución → Miembro.
3. Completing the pipeline never requires `/` (Inicio), `/agenda` or the plantel: step2 → `/unirme` → `/solicitar` → `/solicitar/enviado` → `/solicitar/estado`.
4. **Security:** every `next` value (callback, login, signup, resend, Google, proxy) is validated by `safeInternalPath()`. Anything not an internal path falls back to `/`. Fixes the existing open redirect in `src/app/auth/callback/route.ts` (`` `${origin}${next}` `` with `next=@evil.com` → `http://host@evil.com`).
5. `/unirme` never redirects to itself and the chain never loops (auth pages with a session honor a safe `next` instead of always `/`).
6. The tourist path is unchanged when the user did not enter through `/unirme` (step2 → `/profile`, enviado → `/`).
7. Focused flow: `/solicitar/estado` and the pipeline screens show no TabBar (same criterion as ZER-109: (modal)/(onboarding) groups).
8. **No re-application after `cerrada`** (product decision 2026-10-04; re-application is ZER-180, Backlog): if the user has any `cerrada` request, `/solicitar` redirects to `/solicitar/estado` and `createMembershipRequest` rejects with a Spanish error, and `/unirme` sends them to `/solicitar/estado`. App layer only.

## Decisions (approved by Agustín, 2026-10-04)

- Deep link: **`/unirme`**.
- **Verificación** (ZER-135) is a visible step that does **not** block.
- **Step2** is an optional sub-step of **Perfil**.
- **`/solicitar/estado`** is a new screen, with a frame in `design/nodo-serrano.pen`.
- `supabase/config.toml`: allow `/auth/callback` with query. **The production Supabase dashboard (Auth → URL Configuration → Redirect URLs) is updated by Agustín manually.** Note it in the PR.
- The open redirect is fixed in this ticket.

## Design (contract)

### `/unirme` resolver (route handler, public, `src/app/unirme/route.ts`)
Pure decision in `src/features/membership/pipeline.ts` → `resolveUnirmeTarget(...)`; the route handler only loads data and sets the cookie.

| State | Redirect |
|---|---|
| No session | `/auth/signup?next=/unirme` |
| Profile missing / step1 incomplete | `/onboarding/step1` |
| Step1 done, onboarding not closed | `/onboarding/step2` |
| Tourist, no active request | `/solicitar` |
| Active request, or not tourist (member) | `/solicitar/estado` |
| Profile/request read infra error | `/` (soft-allow, same as the onboarding gate; logged) |

It sets the cookie `ns_flujo=membresia` (httpOnly, sameSite=lax, secure in prod, path `/`, max-age 7 days) on every response. The cookie is **not** cleared on terminal states: a Server Component cannot set cookies, and a stale `ns_flujo` is harmless (it only steers step2's redirect and the enviado CTA, both unreachable once onboarded with a request); it expires after 7 days.

### Intent propagation
- **Across auth:** `next=/unirme` threaded through: proxy (already sets `next`) → login/signup pages (hidden input) → `signInWithPassword` / `signUpWithPassword` / `resendSignupEmail` / `signInWithGoogle` (`emailRedirectTo` / `redirectTo` = `${site}/auth/callback?next=<encoded safe next>`) → check-email (carries `next` for resend) → callback. Signup with live session and login success redirect to the safe `next` (default `/`).
- **Inside the app:** the `ns_flujo` cookie. When present: `saveOnboardingStep2` redirects to `/unirme` (instead of `/profile`), `createMembershipRequest` keeps redirecting to `/solicitar/enviado`, and enviado's CTA goes to `/solicitar/estado` instead of `/`. The stepper renders on step1, step2, `/solicitar`, enviado and estado when in the flow (estado always).
- `/solicitar` without a session → `/auth/login?next=/solicitar` (add `/solicitar` to `PROTECTED_PREFIXES`; `/unirme` is not added, it handles no-session itself).

### `safeInternalPath(value: unknown): string` (`src/lib/safe-next.ts`)
It returns the value only if: it is a string, starts with `/`, does not start with `//` or `/\`, has no `\`, no control chars, does not contain `://`, and `new URL(value, "http://x").origin === "http://x"`. Otherwise it returns `/`. It is also used to build the callback URL (`new URL(next, origin)` and checking origin, never string concat).

### Progress mapping (`membershipPipelineStep`) — read-only over ZER-143 states

| # | Step | Done when |
|---|---|---|
| 1 | Registro | session exists |
| 2 | Verificación | `user.email_confirmed_at` set. **Non-blocking**: if missing, the step shows as pending but the current step advances past it |
| 3 | Perfil | step1 complete (`isStep1Complete`); step2 optional sub-step (`onboarding_completado_en`) |
| 4 | Solicitud | a request exists (any state) |
| 5 | Horario | estado ∈ {`entrevista_solicitada`, `reprogramacion`} is current; done once `entrevista_coordinada`+ |
| 6 | Entrevista | current at `entrevista_coordinada`; done at `entrevista_realizada`+ |
| 7 | Resolución | current at `entrevista_realizada`; done at `aprobado` |
| 8 | Miembro | `aprobado` or tier ≠ `tourist` |
| — | `cerrada` | pipeline halted: output `{ halted: "cerrada" }`, UI shows "Solicitud cerrada" (label from `estadoLabel`) |

`pendiente_coordinacion` → current step 5 (Horario) with Solicitud done. `reprogramacion` → current step 5 (back from 6). Output: `{ current: 1..8, steps: [{ key, label, status: "done"|"current"|"pending" }], halted?: "cerrada" }`.

The latest request is the source: the active one if present, otherwise the most recent by `created_at` (to show `cerrada`/`aprobado`). A tourist with only a `cerrada` request who opens `/unirme` → `/solicitar/estado` (shows closed). Re-applying after cerrada is **not allowed** (AC8); enabling it is ZER-180.

## Tasks / Subtasks

- [x] T1 — `safeInternalPath` + tests (AC4): table of malicious inputs (`//evil.com`, `/\evil.com`, `@evil.com`, `https://evil.com`, `/%2F%2Fevil.com` decoded variants, `javascript:`, `\t`, empty, non-string) and valid ones (`/unirme`, `/solicitar?x=1`).
- [x] T2 — Callback fix (AC1, AC4): tests for `code` and `token_hash` branches with safe / unsafe `next`; build the redirect with `new URL`.
- [x] T3 — Auth actions and pages thread `next` (AC1, AC5): tests for login/signup (live session and check-email), resend, Google `redirectTo`; proxy auth-page bounce honors safe `next`.
- [x] T4 — `membershipPipelineStep` + `resolveUnirmeTarget` pure functions with exhaustive tests (every ZER-143 state, unverified email, step2 skipped, member, cerrada, infra error) (AC2, AC5).
- [x] T5 — `/unirme` route handler + cookie tests (AC1, AC3, AC5).
- [x] T6 — Flow-aware redirects (step2 → `/unirme` with cookie and `/solicitar` protection done; **enviado CTA moves to T8** because its label/copy needs the approved design): step2 → `/unirme` with cookie, `/profile` without; enviado CTA; `/solicitar` in `PROTECTED_PREFIXES` (AC3, AC6).
- [x] T7 — Design in `.pen` (approval before UI code): `PipelineProgress` stepper component + `/solicitar/estado` frame + stepper placement on 1.5 step1, step2 and /solicitar, on the existing design system, 375px.
- [x] T8 — UI: `PipelineProgress` component and `/solicitar/estado` page (in `(modal)`), stepper on the flow screens (AC2, AC7). Delegated to impl with closed prompts.
- [x] T9 — `supabase/config.toml` `additional_redirect_urls`: add `http://localhost:3000/auth/callback**` and `http://127.0.0.1:3000/auth/callback**` (glob, so `?next=` matches). PR note: production dashboard by Agustín.
- [x] T11 — No re-application after `cerrada` (AC8): tests first for `createMembershipRequest` (rejects when a `cerrada` row exists, without inserting), `/solicitar` page (redirects to `/solicitar/estado`) and `resolveUnirmeTarget` (cerrada → estado). Application-layer guard only. Known limit: a client calling PostgREST directly could still insert (RLS allows the owner insert); DB-level enforcement would need a migration and is **not** done here. DB-level enforcement is deferred to ZER-180 (decision 2026-10-04).
- [x] T10 — Gates + adversarial review (Codex) on redirects/loops/permissions/step skipping + 375px visual check.

## Dev Notes

### Current state (read in full)
- `src/app/auth/callback/route.ts`: `next = searchParams.get("next") ?? "/"`, redirects with string concat. **Open redirect.**
- `src/features/auth/actions.ts`: `signInWithPassword` → `redirect("/")`; `signUpWithPassword` → `/` (live session) or `/auth/check-email?email&flow=signup`; `emailRedirectTo`/`redirectTo` = `${site}/auth/callback` with no `next`.
- `src/proxy.ts`: `PROTECTED_PREFIXES = ["/onboarding","/profile","/nodo"]` + `/`; unauthenticated protected → `/auth/login?next=<pathname>` (dropped by login today); authenticated on auth page → `/`. Must preserve the ZER-61 stale POST 409 behavior.
- `src/features/profile/onboarding-gate.ts` / `-server.ts`: pure `resolveOnboardingRedirect`; gate in (app)/(modal)/(onboarding) templates. **Not changed**: `/unirme` sends the user to the correct step itself, and the cookie keeps the intent.
- `src/features/profile/actions.ts`: `saveOnboardingStep1` → step2; `saveOnboardingStep2` → `/profile` (changes only when the cookie is present).
- `src/features/membership/actions.ts` `createMembershipRequest` → `/solicitar/enviado`; tourist-only, one active request (partial unique index). **Not changed.**
- `src/app/(modal)/solicitar/page.tsx`: tier guard; no session → `/auth/login` without `next` (fix to `?next=/solicitar`).
- `src/app/(app)/profile/page.tsx:97`: tourist CTA `/solicitar`; `PendingMembershipCard` (2.7b) for an active request. **Unchanged** (the tourist path stays).
- `supabase/config.toml:163` `additional_redirect_urls` has exact `/auth/callback` only; `enable_confirmations = true` (line 226).

### Guardrails
- **Do NOT touch** `src/features/membership/request-state.ts`, migrations or RLS policies. States are a ZER-143 contract: import `estadoLabel`, `MEMBERSHIP_REQUEST_ACTIVE_ESTADOS`, `isTerminalEstado`.
- Out of scope: booking (ZER-144), states/payment (ZER-167, ZER-169), email verification enforcement (ZER-135), tourist redesign.
- Authorization stays in DB/RLS. The pipeline is UI-only and reads the user's own request (`profile_id = auth.uid()` via existing RLS).
- Read errors fail closed (never invent progress); log with `console.error("[context] …")` like the existing code.
- Copy in Spanish (labels above). Next.js 16: read `node_modules/next/dist/docs/` for route handlers, `cookies()` and `redirect` before coding.
- Pen: padding pairs are `[horizontal, vertical]`; after saving, remove `fileToken`.
- Touch targets ≥ 44px, measured.

### Testing
Vitest + Testing Library. Pure functions are exhaustive. Server actions/route handlers mock Supabase (pattern: `src/features/profile/actions.test.ts`, `src/features/profile/onboarding-gate-server.test.ts`). Gate: `./node_modules/.bin/vitest run --dir src`, DB tests `-c vitest.db.config.ts`, `tsc --noEmit`, `oxlint --quiet`, `oxfmt --check`.

### References
- Linear ZER-136; mapping: `~/Documents/NodoSerrano-Vault/00-Meta/ZER-136 mapeo.md`
- `_bmad-output/implementation-artifacts/zer-143-membership-request-states.md` (state contract)
- `_bmad-output/implementation-artifacts/zer-138-avatar-upload.md` (step1 photo)
- `docs/roadmap/M3 · Membresía y roles.md`; ZER-108, ZER-109

### Resolved questions
1. Re-application after `cerrada`: not allowed for now (AC8, T11). Follow-up ticket: **ZER-180** (Backlog).

## Dev Agent Record

### Agent Model Used

### Completion Notes List

- 2026-10-04 · Logic tasks T1–T5, T9, T11 done with TDD (RED shown before each implementation); T6 partial (enviado CTA → T8).
- Gates on the stacked base + changes: vitest --dir src 1689/1689, DB tests 26/26, tsc 0, oxlint 0, oxfmt clean on 28 touched files.
- T9 verified against real local GoTrue after `supabase stop/start`: a signup with `redirect_to=…/auth/callback?next=%2Funirme` produced a confirmation email whose `redirect_to` keeps `?next=%2Funirme`.
- 2026-10-06 · bug-375 (375px verification): `/unirme` changed from route handler to page (`src/app/unirme/page.tsx`); server actions redirecting to a route handler left the browser URL on /unirme and the next form POSTed there (405). The `ns_flujo` cookie moved to `src/proxy.ts`; step2 resolves the next step directly. Also: enviado stepper/centering (modal shell height chain now `flex-1 flex-col`), close button and step2 back link at 44x44, callback keeps a safe `next` on `auth_callback_failed` (Codex review). Gates: 1734/1734 src, 26/26 DB, tsc/oxlint/oxfmt 0.
- Superseded: pending for T8 (UI): `/solicitar/estado` page, `PipelineProgress` stepper, enviado CTA to `/solicitar/estado` when in flow.

### File List
