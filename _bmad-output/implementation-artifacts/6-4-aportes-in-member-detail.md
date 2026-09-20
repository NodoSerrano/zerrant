# Story 6.4: Aportes in member detail

Status: review

## Linear

- **ZER-90** — Story 6.4: Aportes en el detalle de miembro
- URL: https://linear.app/zerrant/issue/ZER-90
- Branch: `juantandil123/zer-90-story-64-aportes-en-el-detalle-de-miembro`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- Unblocks the M6 "no dead chrome" acceptance: _"the \"Mis aportes\" row and member-detail \"Aportes\" section show real data."_
- Depends on stories 6.1 (ZER-87) and 6.2 (ZER-88).
- ⚠️ **Shares a test case with story 5.8 (ZER-85).** See "The shared test case" in Dev Notes.

## Story

As a serrano browsing the plantel,
I want to see another member's aportes on their detail screen,
so that the directory reflects what people actually contribute.

## Acceptance Criteria

1. **Given** the hardcoded `"Todavía no hay aportes."` line at `src/features/plantel/MemberDetail.tsx:73`
   **When** I open a member's detail in the plantel
   **Then** the "Aportes" section lists that member's real aportes (FR42)

2. **Given** a member with no aportes
   **When** their detail renders
   **Then** the "Aportes" section renders a sensible empty line rather than a broken or missing section (FR42)

3. **Given** an aporte with `monto = null`
   **When** its row renders in member detail
   **Then** it renders without an empty or zeroed amount slot (FR42, FR39)

4. **Given** the `aportes` read policy is serranos-only (`public.is_non_tourist()`)
   **When** a tourist views the app
   **Then** they see no aportes data — the read is refused by the database, and the screen degrades to the empty line rather than leaking rows or crashing (FR39, NFR14)

5. **Given** the test case `renders empty aportes and proyectos previews` at `src/features/plantel/MemberDetail.test.tsx:101`, which pins both `"Todavía no hay aportes."` and `"Todavía no hay proyectos."`
   **When** this story lands
   **Then** the aportes half of that assertion is updated to the new behaviour **without** touching or weakening the proyectos half, which story 5.8 owns (FR42, NFR11)

6. **Given** the rest of member detail
   **When** it renders after this change
   **Then** roles, skills, tarifa visibility, bio, the Telegram CTA, and the Proyectos section from story 5.8 all behave exactly as before — no regression (NFR19)

7. **Given** the design-system constraint
   **When** an aporte row is rendered here
   **Then** it reuses the shared `AporteItem` from story 6.3 rather than a second, page-local rendering of the same data (NFR17)

8. **Given** the whole section
   **When** it is reviewed
   **Then** it contains no payment, checkout or "pagar" affordance — aportes are recorded, never charged (NFR12)

9. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [x] **T0 — Read the framework docs and coordinate with story 5.8** (AC: 5, 6)
  - [x] Read the relevant guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).
  - [x] Read the "The shared test case" note in Dev Notes **before** editing `MemberDetail.test.tsx`. Story 5.8 (ZER-85) edits the same test.
  - [x] This story has **no Pencil frame**: `screen-inventory.md` lists member detail under "Surfaces touched but not owned by a frame". It keeps its M0–M2 layout and only gains real data — no node id to resolve, and no redesign.

- [x] **T1 — RED: failing tests first** (AC: 1, 2, 3, 5, 9)
  - [x] `MemberDetail` test: a member with aportes renders them via `AporteItem`.
  - [x] `MemberDetail` test: a member with none renders the empty line.
  - [x] `MemberDetail` test: a null-monto aporte renders no amount slot; a `0`-monto aporte renders `0` (the truthiness trap).
  - [x] Split `renders empty aportes and proyectos previews` per the Dev Notes plan.
  - [x] Page test: the detail read requests that member's aportes.
  - [x] Verify RED.

- [x] **T2 — GREEN: the data read** (AC: 1, 4)
  - [x] `src/app/(app)/plantel/[id]/page.tsx`: read that member's `aportes`, ordered by `fecha`.
  - [x] Handle the serrano-only read: a refused or empty read degrades to the empty line, never to a crash or a leaked row.
  - [x] Do not regress the ZER-43 `tarifa_hora` masking while touching this read path — the detail page reads through `public.profiles_with_rate`, and `select *` on base `profiles` is not available.

- [x] **T3 — GREEN: the section** (AC: 1, 2, 3, 7)
  - [x] Extend `SerranoMemberDetail` in `src/features/plantel/types.ts` with the member's aportes (additive).
  - [x] Extend `buildSerranoMemberDetail` in `src/features/plantel/transform.ts` accordingly.
  - [x] Replace line 73's `<p>Todavía no hay aportes.</p>` with the real list; keep `<SectionTitle>Aportes</SectionTitle>` at line 72 and the section's position in the page order.
  - [x] Reuse `AporteItem` from story 6.3.
  - [x] Leave the Proyectos section (lines 76–79) exactly as story 5.8 left it.

- [x] **T4 — Verify** (AC: 5, 6, 9)
  - [x] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [x] Re-read `MemberDetail.test.tsx` and confirm the proyectos assertion is unchanged.
  - [x] Visual check at ~390px: section order preserved; rate card, roles, skills unaffected.

## Dev Notes

### Current state / problem

`src/features/plantel/MemberDetail.tsx:71–74` is a section whose entire body is a hardcoded sentence:

```tsx
<section className="flex flex-col gap-3">
  <SectionTitle>Aportes</SectionTitle>
  <p className="font-body text-sm text-text-secondary">Todavía no hay aportes.</p>
</section>
```

This is M4's directory surface: the plantel is where contributions are supposed to be legible, and today it states the opposite of the truth for anyone who has registered an aporte.

**Line-number note:** `epics-m5-m6.md` (FR42) and `screen-inventory.md` both cite `src/features/plantel/MemberDetail.tsx:72`. On `main` today line 72 is `<SectionTitle>Aportes</SectionTitle>`; the `"Todavía no hay aportes."` `<p>` is on **line 73**. Cite 73 for the placeholder and 71–74 for the section.

### The shared test case (coordinate with story 5.8 / ZER-85)

`src/features/plantel/MemberDetail.test.tsx:101` is a **single** test that pins **both** placeholders:

```tsx
it("renders empty aportes and proyectos previews", () => {
  render(<MemberDetail member={member} />);
  expect(screen.getByText("Aportes")).toBeInTheDocument();
  expect(screen.getByText("Proyectos")).toBeInTheDocument();
  expect(screen.getByText("Todavía no hay aportes.")).toBeInTheDocument();
  expect(screen.getByText("Todavía no hay proyectos.")).toBeInTheDocument();
});
```

**This story (6.4) and story 5.8 (ZER-85) both have to change it**, and a careless edit by either one silently deletes the other's coverage.

**The plan — whichever story lands first does the split:**

1. Replace the one `it(...)` with **two** independent cases, one per section:
   - `renders the aportes section` — this story rewrites this one.
   - `renders the proyectos section` — keeps asserting `"Todavía no hay proyectos."` until 5.8 lands (or asserts the real list if 5.8 already landed).
2. Each story then edits **only its own** case and leaves the sibling byte-identical.
3. Whichever story lands second: before editing, re-read the file. If the split is already there, do step 2 only. If it is not, do step 1 then step 2.
4. Neither story may delete the whole `it(...)` block, weaken the sibling assertion to a `queryBy`, or merge the two cases back together.

Both stories also touch `SerranoMemberDetail` (`types.ts`) and `buildSerranoMemberDetail` (`transform.ts`): 5.8 adds the projects field, this story adds the aportes field. Adding a field is additive and safe; **replacing** the type or the shared `member` fixture wholesale is not.

If 5.8 has already landed, this story must also keep its Proyectos assertions green — that is AC 6.

### Tourist read

`aportes` SELECT is gated on `public.is_non_tourist()`. A tourist's read returns nothing (or is refused), so the section must degrade to the empty line. It must not crash on `null`, and it must not fall back to a client-side "sample" list. Tourists also do not appear in the plantel at all (`docs/roadmap/Seguridad RLS.md:12`), so this is defence in depth rather than a primary path — which is exactly why it is easy to leave broken.

### `monto !== null`, not truthiness

`0` is a legitimate stored amount and is falsy. Reusing `AporteItem` from story 6.3 inherits the correct check; a second, page-local rendering is how the bug gets reintroduced. That is what AC 7 is for.

### Files to touch

| Area      | Path                                            | Notes                                                        |
| --------- | ----------------------------------------------- | ------------------------------------------------------------ |
| EDIT      | `src/features/plantel/MemberDetail.tsx`         | Line 73 becomes a real list. Lines 76–79 untouched.          |
| EDIT      | `src/features/plantel/MemberDetail.test.tsx`    | ⚠️ Shared with story 5.8 — follow the split plan above       |
| EDIT      | `src/features/plantel/types.ts`                 | Add the aportes field to `SerranoMemberDetail` (additive)    |
| EDIT      | `src/features/plantel/transform.ts` (+ tests)   | Populate it in `buildSerranoMemberDetail`                    |
| EDIT      | `src/app/(app)/plantel/[id]/page.tsx` (+ test)  | Read that member's aportes; keep the ZER-43 rate path intact |
| REUSE     | `src/features/aportes/AporteItem.tsx`           | From story 6.3 — do not re-render aportes a second way       |
| Prior art | `src/features/plantel/detail-transform.test.ts` | Transform test patterns                                      |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first. The `MemberDetail.test.tsx` split is part of the RED step, not a cleanup afterwards.
- Assert both a `null` monto and a `0` monto, so the truthiness bug cannot slip through.
- Keep the whole existing `MemberDetail` suite green: back link, title, ellipsis absence, spacer, name classes, tier badge, availability, roles, skills, rate card (integer and decimal), bio, CTA.
- Keep `pnpm db:check-grants` green — this story changes no schema but touches a read path guarded by ZER-43's column mask.
- `pnpm test` green before done.

### Out of scope

- Registering an aporte — story 6.2.
- "Mis aportes" and the profile row — story 6.3.
- Editing or deleting an aporte — no policy exists; denied by design.
- Totals, sums, or any aggregation of a member's aportes — no frame asks for it, and Puntos Serrano is parked.
- Redesigning member detail. It is a "surface touched but not owned by a frame" and keeps its M0–M2 layout.
- The Proyectos section — story 5.8.
- Any payment, checkout, or wallet affordance — parked.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** edit the proyectos half of `MemberDetail.test.tsx`. Story 5.8 owns it.
- **Do NOT** delete or merge the shared test case; split it as described.
- **Do NOT** rewrite the `member` fixture in a way that drops fields another case asserts.
- **Do NOT** render a second, page-local aporte row — reuse `AporteItem`.
- **Do NOT** drive the amount slot off truthiness.
- **Do NOT** fall back to sample/placeholder aportes when the read returns nothing.
- **Do NOT** change the section order in `MemberDetail`.
- **Do NOT** reintroduce `select *` on `profiles` in the detail page — ZER-43 revoked base-column SELECT on `tarifa_hora`.
- **Do NOT** add totals or a "puntos" figure.
- **Do NOT** add any payment affordance.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR42: The \"Aportes\" section of plantel member detail (`src/features/plantel/MemberDetail.tsx:72`) lists that member's real aportes instead of the \"Todavía no hay aportes.\" placeholder, feeding M4's directory."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "`src/features/plantel/MemberDetail.test.tsx:101` pins the current placeholder text and must be updated by stories 5.8 and 6.4."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** aportes read follows the serrano-only read policy — a tourist viewing the app sees no aportes data (FR39, NFR14)"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "the existing placeholder assertion in `src/features/plantel/MemberDetail.test.tsx` is updated to the new behavior; monto visibility follows the same read rule as the rest of the table (read = serranos)."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md` — "These are existing screens that M6 must un-stub. They have no new Pencil frame of their own; they keep their M0–M2 layout and only gain real data."]
- [Source: `src/features/plantel/MemberDetail.tsx:73` — `<p className="font-body text-sm text-text-secondary">Todavía no hay aportes.</p>`]
- [Source: `docs/roadmap/Seguridad RLS.md:13` — "Base table reads must omit `tarifa_hora` / avoid `select *`."]

## Dev Agent Record

### Agent Model Used

Gentle AI on Hermes Agent

### Debug Log References

### Completion Notes List

- Rebased onto main after ZER-89 landed `AporteItem`.
- Split shared empty aportes/proyectos test; left proyectos half byte-identical for ZER-85.
- Member detail aportes list reuses shared `AporteItem`; null monto omits amount, `0` keeps `$0`.
- Page reads `aportes` for member id ordered by `fecha` desc; refused/empty → empty list.
- Additive `aportes` on `SerranoMemberDetail` / `buildSerranoMemberDetail`; profiles_with_rate path unchanged.

### Change Log

- 2026-09-20: Implement ZER-90 member-detail aportes list.

### File List

- src/features/plantel/MemberDetail.tsx
- src/features/plantel/MemberDetail.test.tsx
- src/features/plantel/types.ts
- src/features/plantel/transform.ts
- src/features/plantel/detail-transform.test.ts
- src/app/(app)/plantel/[id]/page.tsx
- src/app/(app)/plantel/[id]/page.test.tsx
- _bmad-output/implementation-artifacts/6-4-aportes-in-member-detail.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
