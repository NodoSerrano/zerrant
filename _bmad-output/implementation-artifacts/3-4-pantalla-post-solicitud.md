---
story_key: 3-4-pantalla-post-solicitud
linear: ZER-27
pencil_frame: bWMOv
---

# Story 3.4: Pantalla post-solicitud (1.8)

Status: ready-for-dev

<!-- Linear ZER-27. Replaces tourist profile chrome when a pending membership request exists. -->

## Story

As a tourist with a pending membership request,
I want `/profile` to show Pencil 1.8 instead of the “Solicitar ser Serrano” banner,
so that I know my request is in review and I can keep exploring.

## Acceptance Criteria

Verified against Pencil `bWMOv` (`1.8 · Solicitud en revisión`, 390×844) via Pencil MCP. StatusBar is design chrome only — not required in web.

### 1. Branch on pending request

**Given** a logged-in tourist
**When** they have a `membership_requests` row with `estado = 'pendiente'`
**Then** `/profile` renders the 1.8 composition below — **not** the identity card, “Todavía sos Tourist” banner, or `TouristMenu`
**When** they have no pending request
**Then** keep the existing tourist profile (ZER-15 + CTA → `/solicitar`)
**When** they are not a tourist
**Then** keep the Serrano shell (unchanged)

Query in the server page (same `createClient` pattern). No new table. Fail closed: if the request read errors, do **not** show 1.8 (show tourist profile or redirect `/nodo/tasks` — prefer tourist profile so they are not locked out).

### 2. Visual parity — `bWMOv` wrapper

Inner column (Pencil `huln6`): `flex flex-col items-center justify-center gap-5 px-6 pt-6 pb-7` (pad `[24,24,28,24]`, gap 20).

| Element  | Pencil                                                                                                                                                                    | Implement                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Badge    | 92×92, fill `#ff972820`, `r:999`, centered                                                                                                                                | `size-[92px] rounded-full` + that fill                                             |
| Icon     | Lucide `hourglass` 40×40 fill `#ff4d21`                                                                                                                                   | `Hourglass` `size-10` `#ff4d21`                                                    |
| Title    | `Tu cuenta está en revisión` · Space Grotesk 22 / 500 / `#1a1614` / center                                                                                                | `font-display text-[22px] font-medium text-text-primary text-center`               |
| Subtitle | `Un admin de Nodo va a revisar tu solicitud pronto. Cuando te aprueben, pasás de Turista a Serrano y vas a aparecer en el plantel.` · Inter 14 / `#5a5550` / 1.5 / center | exact copy · `font-body text-[14px] text-text-secondary leading-[1.5] text-center` |

Head stack (`AGGDv`): `flex flex-col items-center gap-2.5` (gap 10).

### 3. Status card

Pencil `Guwic`: surface `#fefbf6`, `r:20`, pad 16, gap 12, row centered.

- Pill **Turista**: bg `#ff972820`, pad `[14,8]`, `r:999`, text Space Grotesk 13 / 500 / `#ff4d21`
- Lucide `arrow-right` 18×18 `#8a847c`
- Pill **Serrano**: bg `#f1ebe0`, pad `[14,8]`, `r:999`, text Space Grotesk 13 / 500 / `#8a847c`

### 4. Info row + actions

Info (`kisLa`): gap 8, centered. Lucide `compass` 16×16 `#0c8a5e`. Text exactly `Mientras tanto, explorá el plantel y la agenda` · Inter 13 / `#5a5550`.

Actions (`oy5oY`): `flex flex-col gap-2.5 w-full` (gap 10).

- CTA **Explorar Nodo**: primary pill 54px, gradient green→blue 135° (`#0c8a5e` → `#1158b0`), label Space Grotesk 16 / 500 / `#f8f4ed`. `href="/nodo/tasks"` (plantel is M4 — do not invent `/plantel`). No `<button>` inside `<a>`.
- **Cerrar sesión**: Space Grotesk 15 / 500 / `#8a847c` / center. Calls existing `signOut` (`src/features/auth/actions.ts`). Reuse the TouristMenu form pattern.

### 5. Out of scope

- Frame 1.9 `/solicitar/enviado` (ZER-26)
- Plantel / agenda routes (M4 / M6)
- Changing `(app)/layout` TabBar or `p-5` (deferred shell)
- Admin approval UI

### 6. Tests (NFR2)

TDD. Cover: tourist + pending → 1.8 copy/CTA; tourist without pending → existing banner + `/solicitar`; serrano unchanged; unauthenticated → login; sign-out still wired; CTA `href="/nodo/tasks"`.
`pnpm test`, `pnpm typecheck`, `pnpm lint`.

## Tasks / Subtasks

- [ ] T1 — RED→GREEN: pending branch in `src/app/(app)/profile/page.tsx` (AC 1)
  - [ ] Extend `src/features/profile/__tests__/profile-tourist.test.tsx` (mock `membership_requests` select)
- [ ] T2 — RED→GREEN: 1.8 chrome + status card + info + actions (AC 2–4)
  - [ ] Prefer a `PendingReview` client/server child under `profile/` so the page stays thin
- [ ] T3 — Verify

## Dev Notes

### Do / do not

- **Do** replace the whole tourist return when pending — 1.8 is a full screen, not a banner swap on the old shell.
- **Do** reuse `signOut`, `PrimaryButton` / primary `Link` classes, Lucide.
- **Do not** add `getPendingRequest` unless you need it in more than one place. A `.select().eq().eq().maybeSingle()` in the page is enough.
- **Do not** use `router.back()`. **Do not** leak PostgREST errors.
- Hexes `#ff4d21` / `#ff972820` / `#f1ebe0` are Pencil-resolved. Use them if no token matches; do not remap to coral/mint “because close enough”.

### Current `/profile` tourist path

`src/app/(app)/profile/page.tsx` (~32–79): identity card + mint→blue banner + Link `/solicitar` + `TouristMenu`. Tests in `src/features/profile/__tests__/profile-tourist.test.tsx` assert the no-op CTA is now a link — keep those for the **no-pending** branch.

Supabase mock there only implements `from().select().eq().single()` for profiles. Pending check needs another `from("membership_requests")` chain — same dual-table mock style as `src/features/membership/actions.test.ts`.

### Shell

`(app)/layout.tsx` still adds `p-5` + TabBar. Accept it. Inner 1.8 padding is on top.

### After ZER-26

Submit flow: form → `/solicitar/enviado` → “Volver al inicio” → `/` → `/profile` → **this** 1.8 branch. Implement even if ZER-26 is not merged; the branch is independent.

### References

- Linear: https://linear.app/zerrant/issue/ZER-27/m34-pantalla-post-solicitud-18
- Pencil: `bWMOv`
- Milestone: `docs/roadmap/M3 · Membresía y roles.md`
- `signOut`: `src/features/auth/actions.ts`
- Sibling story: `_bmad-output/implementation-artifacts/3-3-confirmacion-de-envio.md`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

Ultimate context engine analysis completed - comprehensive developer guide created

### File List
