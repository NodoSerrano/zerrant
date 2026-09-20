# Story 5.8: Projects on profile and member detail

Status: backlog

## Linear

- **ZER-85** — Story 5.8: Proyectos en el perfil y en el detalle de miembro
- URL: https://linear.app/zerrant/issue/ZER-85
- Branch: `juantandil123/zer-85-story-58-proyectos-en-el-perfil-y-en-el-detalle-de-miembro`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 5 — Proyectos**
- Unblocks the M5 "no dead chrome" acceptance: _"the Nodo hub's Proyectos control, the profile 'Mis proyectos' row, and the member-detail 'Proyectos' section all show real data."_
- Depends on stories 5.1 (ZER-78), 5.3 (ZER-80) and 5.5 (ZER-82) — there must be approved memberships to list.
- ⚠️ **Shares a test case with story 6.4 (ZER-90).** See "The shared test case" in Dev Notes.

## Story

As a serrano,
I want my projects visible on my profile and on my plantel card,
so that what I work on is part of who I am in the node.

## Acceptance Criteria

1. **Given** the greyed row at `src/app/(app)/profile/SerranoMenu.tsx:53–58` (the `Mis proyectos` label is on line 55)
   **When** I open my profile
   **Then** the "Mis proyectos" row is enabled, shows a real count of my `estado='aprobado'` projects instead of the `—` placeholder, and navigates to my projects (FR36, NFR12)
   **And** none of the `text-text-primary/40`, `text-brand-blue/40`, `text-text-muted/40` disabled treatments remain on that row (UX-DR28)

2. **Given** a serrano with zero approved projects
   **When** the profile renders
   **Then** the row shows a real `0`, not the `—` placeholder and not a fake number (NFR12)

3. **Given** the "Mis proyectos" destination
   **When** I follow it
   **Then** I land on the viewer's own approved projects — the personal cut, distinct from the Nodo Proyectos list (story 5.2), which lists all visible projects (FR36)

4. **Given** the hardcoded `"Todavía no hay proyectos."` line at `src/features/plantel/MemberDetail.tsx:78`
   **When** I open a member's detail in the plantel
   **Then** the "Proyectos" section lists that member's `estado='aprobado'` projects (FR37)

5. **Given** a member with no approved projects
   **When** their detail renders
   **Then** the "Proyectos" section renders a sensible empty line rather than a broken or missing section (FR37)

6. **Given** a member with `pendiente` rows only
   **When** their detail renders
   **Then** those projects do **not** appear — only `aprobado` memberships are listed (FR37, FR32)

7. **Given** the test case `renders empty aportes and proyectos previews` at `src/features/plantel/MemberDetail.test.tsx:101`, which pins both `"Todavía no hay aportes."` and `"Todavía no hay proyectos."`
   **When** this story lands
   **Then** the proyectos half of that assertion is updated to the new behaviour **without** touching or weakening the aportes half, which story 6.4 owns (FR37, NFR11)

8. **Given** the rest of member detail
   **When** it renders after this change
   **Then** roles, skills, tarifa visibility, bio and the Telegram CTA all behave exactly as before — no regression (NFR19)

9. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** failing tests were written first and `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — Read the framework docs and coordinate with story 6.4** (AC: 7, 8)
  - [ ] Read the relevant guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).
  - [ ] Read the "The shared test case" note in Dev Notes **before** editing `MemberDetail.test.tsx`. Story 6.4 (ZER-90) edits the same test.
  - [ ] This story has **no Pencil frame**: `screen-inventory.md` lists both surfaces under "Surfaces touched but not owned by a frame". They keep their M0–M2 layout and only gain real data — no node id to resolve, and no redesign.

- [ ] **T1 — RED: failing tests first** (AC: 1, 2, 4, 5, 6, 7, 9)
  - [ ] `SerranoMenu` test: the row is a link, shows a numeric count, and carries none of the `/40` disabled classes.
  - [ ] `SerranoMenu` test: zero projects renders `0`.
  - [ ] `MemberDetail` test: a member with approved projects renders them; a member with none renders the empty line; a `pendiente` membership is excluded.
  - [ ] Split `renders empty aportes and proyectos previews` per the Dev Notes plan.
  - [ ] Verify RED.

- [ ] **T2 — GREEN: the data reads** (AC: 1, 2, 3, 4, 6)
  - [ ] Profile page: count `project_members` where `profile_id = auth.uid()` and `estado='aprobado'`.
  - [ ] Plantel detail page: read that member's `estado='aprobado'` memberships joined to `projects`.
  - [ ] Filter `estado='aprobado'` **in the query**, so a later render refactor cannot leak `pendiente` rows.

- [ ] **T3 — GREEN: `SerranoMenu`** (AC: 1, 2, 3)
  - [ ] Turn the `<div>` at lines 53–58 into a `next/link` in the shape of the "Editar perfil" row above it (lines 43–49): full-opacity icon and text, real count, `ChevronRight`.
  - [ ] Accept the count as a prop from the server component — `SerranoMenu` is a `"use client"` component and must not fetch.
  - [ ] Leave the "Mis aportes" row at lines 62–67 untouched; story 6.3 owns it.

- [ ] **T4 — GREEN: `MemberDetail`** (AC: 4, 5, 6, 8)
  - [ ] Extend `SerranoMemberDetail` in `src/features/plantel/types.ts` with the member's approved projects.
  - [ ] Extend `buildSerranoMemberDetail` in `src/features/plantel/transform.ts` accordingly.
  - [ ] Replace line 78's `<p>Todavía no hay proyectos.</p>` with the real list; keep the `<SectionTitle>Proyectos</SectionTitle>` at line 77 and the section's position in the page order.
  - [ ] Leave the Aportes section (lines 71–74) exactly as it is; story 6.4 owns it.

- [ ] **T5 — Verify** (AC: 8, 9)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Re-read `MemberDetail.test.tsx` and confirm the aportes assertion still pins `"Todavía no hay aportes."` unchanged.
  - [ ] Visual check at ~390px: the profile row matches its enabled siblings; member detail keeps its section order.

## Dev Notes

### Current state / problem

Two surfaces still advertise that projects do not exist:

`src/app/(app)/profile/SerranoMenu.tsx:53–58` — a `<div>`, not a link, with every child at 40% opacity and a literal `—` where the count belongs:

```tsx
<div className="flex items-center gap-3 px-4 py-[15px] w-full text-text-primary/40">
  <Folder size={20} className="text-brand-blue/40 shrink-0" />
  <span className="font-body text-[15px] text-left flex-1">Mis proyectos</span>
  <span className="font-body text-sm text-text-muted/40">—</span>
  <ChevronRight size={18} className="text-text-muted/40 shrink-0" />
</div>
```

`src/features/plantel/MemberDetail.tsx:76–79` — a section whose entire body is a hardcoded sentence:

```tsx
<section className="flex flex-col gap-3">
  <SectionTitle>Proyectos</SectionTitle>
  <p className="font-body text-sm text-text-secondary">Todavía no hay proyectos.</p>
</section>
```

The "Editar perfil" row at lines 43–49 of `SerranoMenu.tsx` is the enabled shape to copy.

### The shared test case (coordinate with story 6.4 / ZER-90)

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

**This story (5.8) and story 6.4 (ZER-90) both have to change it**, and a careless edit by either one silently deletes the other's coverage.

**The plan — whichever story lands first does the split:**

1. Replace the one `it(...)` with **two** independent cases, one per section:
   - `renders the aportes section` — keeps asserting `"Todavía no hay aportes."` until 6.4 lands.
   - `renders the proyectos section` — this story rewrites this one.
2. Each story then edits **only its own** case and leaves the sibling byte-identical.
3. Whichever story lands second: before editing, re-read the file. If the split is already there, do step 2 only. If it is not, do step 1 then step 2.
4. Neither story may delete the whole `it(...)` block, weaken the sibling assertion to a `queryBy`, or merge the two cases back together.

Both stories also touch `SerranoMemberDetail` (`types.ts`) and `buildSerranoMemberDetail` (`transform.ts`): 5.8 adds the projects field, 6.4 adds the aportes field. Adding a field is additive and safe; **replacing** the type or the fixture wholesale is not.

### Only `aprobado` counts

A `pendiente` row is a join request, not a project. It must not appear in the profile count, in "Mis proyectos", or in a member's detail list. Filter in the query.

### Line-number accuracy

- `SerranoMenu.tsx:55` (cited by FR36) is the `Mis proyectos` label `<span>`; the row container is line 53 and the `—` count is line 56. All accurate.
- `MemberDetail.tsx:78` (cited by FR37) is the `"Todavía no hay proyectos."` `<p>`. Accurate.
- `MemberDetail.test.tsx:101` is the `it(...)` line of `renders empty aportes and proyectos previews`. Accurate.

### Files to touch

| Area      | Path                                                | Notes                                                                |
| --------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| EDIT      | `src/app/(app)/profile/SerranoMenu.tsx`             | Lines 53–58 become a real link with a real count. Leave 62–67 alone. |
| EDIT      | `src/app/(app)/profile/page.tsx`                    | Fetch the approved-project count; pass it as a prop                  |
| NEW       | `src/app/(app)/profile/proyectos/page.tsx` (+ test) | The viewer's own approved projects (route may follow the Nodo IA)    |
| EDIT      | `src/features/plantel/MemberDetail.tsx`             | Line 78 becomes a real list. Lines 71–74 untouched.                  |
| EDIT      | `src/features/plantel/MemberDetail.test.tsx`        | ⚠️ Shared with story 6.4 — follow the split plan above               |
| EDIT      | `src/features/plantel/types.ts`                     | Add the projects field to `SerranoMemberDetail` (additive)           |
| EDIT      | `src/features/plantel/transform.ts` (+ tests)       | Populate it in `buildSerranoMemberDetail`                            |
| EDIT      | `src/app/(app)/plantel/[id]/page.tsx` (+ test)      | Read the member's approved memberships                               |
| Prior art | `src/app/(app)/profile/SerranoMenu.tsx:43–49`       | The enabled-row shape ("Editar perfil")                              |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- The `MemberDetail.test.tsx` split is part of the RED step, not a cleanup afterwards.
- Assert the disabled classes are gone from the profile row — a row that reads a real count but still renders at 40% opacity fails UX-DR28's "any activated control still renders in its disabled/placeholder form".
- Assert the zero case renders `0`, not `—`.
- Assert `pendiente` exclusion with a fixture that has one of each.
- Keep the existing `MemberDetail` suite green: roles, skills, rate card, bio, CTA, the ellipsis and spacer cases.
- `pnpm test` green before done.

### Out of scope

- The Nodo Proyectos list — story 5.2. This story's profile destination is the **personal** cut.
- Any aportes work — stories 6.3 (the "Mis aportes" row at `SerranoMenu.tsx:62–67`) and 6.4 (the Aportes section at `MemberDetail.tsx:71–74`).
- Redesigning either surface. Both are listed under "Surfaces touched but not owned by a frame" — they keep their M0–M2 layout.
- The "Panel de admin", "Disponibilidad" and "Visibilidad de tarifa" rows in `SerranoMenu`, which stay disabled.
- Showing a member's `pendiente` requests anywhere.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** edit the aportes half of `MemberDetail.test.tsx`. Story 6.4 owns it.
- **Do NOT** delete or merge the shared test case; split it as described.
- **Do NOT** rewrite the `member` fixture in that test file in a way that drops fields another case asserts.
- **Do NOT** leave the `—` placeholder, or any `/40` opacity class, on an activated row.
- **Do NOT** fabricate a count. A real `0` is correct; an invented number is not.
- **Do NOT** count or list `pendiente` memberships.
- **Do NOT** fetch inside `SerranoMenu` — it is `"use client"`. Pass the count in.
- **Do NOT** enable the "Mis aportes" row here; story 6.3 does that.
- **Do NOT** change the section order in `MemberDetail`.
- **Do NOT** regress the tarifa masking behaviour from ZER-43 while touching the detail read path.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR36: The serrano profile menu row \"Mis proyectos\" at `src/app/(app)/profile/SerranoMenu.tsx:55` is enabled, shows a real count, and navigates to the viewer's projects."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR37: The \"Proyectos\" section of plantel member detail (`src/features/plantel/MemberDetail.tsx:78`) lists that member's approved projects instead of the hardcoded \"Todavía no hay proyectos.\" line, and `src/features/plantel/MemberDetail.test.tsx:101` is updated accordingly."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "`src/features/plantel/MemberDetail.test.tsx:101` pins the current placeholder text and must be updated by stories 5.8 and 6.4."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md` — "These are existing screens that M5 must un-stub (CAP-7). They have no new Pencil frame of their own; they keep their M0–M2 layout and only gain real data."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "**Projects list scope:** the Proyectos sub-tab lists all visible projects, not only the viewer's; \"Mis proyectos\" on the profile is the personal cut."]
- [Source: `src/features/plantel/MemberDetail.test.tsx:101` — `it("renders empty aportes and proyectos previews", () => {`]
- [Source: `src/app/(app)/profile/SerranoMenu.tsx:56` — `<span className="font-body text-sm text-text-muted/40">—</span>`]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
