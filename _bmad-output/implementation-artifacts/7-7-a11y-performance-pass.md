# Story 7.7: A11y + performance pass

Status: review

## Linear

- **ZER-104** — Story 7.7: Pasada a11y y performance
- URL: https://linear.app/zerrant/issue/ZER-104/story-77-pasada-a11y-y-performance
- Branch: `juantandil123/zer-104-story-77-pasada-a11y-y-performance`
- Priority: Medium (P3) · Status: In Progress → review · Assignee: Juan
- Project: **Nodo Serrano — M7 Cumpleaños, PWA y pulido** · Milestone: **Epic 7 — Cumpleaños, PWA y pulido**

- Depends on: 7.2–7.5 (ZER-99 → ZER-102).

## Story

As a member,
I want Inicio and system states keyboard-reachable and free of M7-induced performance foot-guns,
so that the MVP close includes a basic quality bar.

## Acceptance Criteria

1. **Given** Inicio and system states
   **When** used with keyboard
   **Then** primary links/controls are reachable and named (FR60)

2. **Given** icons/images introduced by M7 (PWA icons, avatars on birthday rows)
   **When** rendered
   **Then** sizing/alt are appropriate; huge uncompressed assets are not shipped as LCP bombs (FR60)

3. **Given** layout
   **When** events/birthdays load
   **Then** obvious CLS foot-guns from late-loading sections are mitigated (skeletons/min-heights as needed) (FR58, FR60)

4. **Given** evidence
   **When** done
   **Then** a short checklist (a11y + perf notes) is attached to Linear/PR — not an unbounded rewrite (FR60, NFR22)

## Tasks / Subtasks

- [x] **T1 — A11y:** keyboard reachability + accessible names on Inicio and system states
- [x] **T2 — Perf:** icon/image sizing; mitigate obvious CLS on late Inicio sections
- [x] **T3 — Evidence** short checklist on PR/Linear (`src/features/a11y-perf/m7Checklist.ts`)

## Out of scope

- Full WCAG certification audit. Rewriting M0–M6 unrelated screens.

## Completion Notes

- Decorative icons on TabBar / EmptyState / system states are `aria-hidden`.
- Birthday row Avatar uses `alt=""` because the link already names the person.
- Avatar ships `sizes` matching fixed px dimensions.
- System-state + Inicio primary CTAs/links get `focus-visible` rings.
- Birthday cards `min-h-[72px]` align with skeleton slots; PWA icons stay under 16 KiB.
- Evidence module: `src/features/a11y-perf/m7Checklist.ts` (also in PR body).
