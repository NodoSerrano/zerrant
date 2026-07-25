# Story 4.2: Empty tasks state (7.2)

Status: done

## Story

As a user with no tasks,
I want the empty state to match Pencil,
so that I know what to do next.

## Acceptance Criteria

1. **Given** Pencil frame `7.2 · Vacío — Tareas` (`ZSmb5`)
   **When** `EmptyState` component renders with a subtitle
   **Then** it shows a 96×96 clipboard-list icon circle (bg-surface-inset, rounded-full) with text-muted icon
   **And** heading "No hay tareas" (font-display, 20px, bold)
   **And** the provided subtitle text (font-body, 14px, text-secondary, leading-relaxed, centered)
   **And** a CTA button with gradient green→blue, rounded-pill, 48px height, plus icon + action label
   **(FR12, UX-DR11)**

2. **Given** the CTA button
   **When** rendered with an `onAction` callback
   **Then** clicking the button fires the callback
   **And** when no `onAction` is provided, clicking does not throw

3. **Given** props customization
   **When** `actionLabel` is provided
   **Then** the button shows that label instead of "Publicar tarea"
   **And** `className` prop merges with the container classes

4. **Given** TDD
   **When** implementation is complete
   **Then** component tests assert all Pencil-correct classes
   **And** `pnpm test` passes
   **(NFR2)**

5. **Out of scope**
   - Navigation logic (handled by parent page)
   - Auth checks (tourist vs serrano — handled by parent)
   - Header "Nodo" + subtitle (part of 4.3 hub)
   - TabBar (already DS-matched from 1.4)

## Tasks

- [x] **T1 — RED**: Write EmptyState.test.tsx (10 tests)
- [x] **T2 — GREEN**: Implement EmptyState.tsx component matching Pencil
- [x] **T3 — VERIFY**: pnpm test 100% pass, pnpm typecheck clean

## Dev Notes

### Pencil specs

#### Frame `ZSmb5` — 7.2 · Vacío — Tareas

Empty content area (`iwIvG`):

| Element              | Pencil                                                              | Tailwind                                                                           |
| -------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Icon circle          | 96×96, rounded-full, surface-inset, centered                        | `size-24 rounded-full bg-surface-inset flex items-center justify-center`           |
| Icon                 | lucide "clipboard-list", 40×40, text-muted                          | `<ClipboardList className="size-10 text-text-muted" />`                            |
| Heading              | "No hay tareas", display, 20px, bold                                | `font-display text-[20px] font-bold text-text-primary`                             |
| Subtitle             | body, 14px, normal, secondary, lineHeight 1.5, centered             | `font-body text-sm font-normal text-text-secondary leading-relaxed text-center`    |
| Gap text group       | 8                                                                   | `gap-2`                                                                            |
| CTA button           | rounded-pill, gradient green→blue 135°, h 48, padding [22,0], gap 8 | `rounded-pill bg-linear-to-br from-brand-green to-brand-blue h-12 px-[22px] gap-2` |
| CTA icon             | lucide "plus", 18×18, on-primary                                    | `<Plus className="size-[18px] text-on-primary" />`                                 |
| CTA label            | "Publicar tarea", display, 15px, 500, on-primary                    | `font-display text-[15px] font-medium text-on-primary`                             |
| Gap between sections | 18                                                                  | `gap-[18px]`                                                                       |

### Props interface

```ts
interface EmptyStateProps {
  subtitle: string;
  actionLabel?: string; // default "Publicar tarea"
  onAction?: () => void;
  className?: string;
}
```

### Testing

| Test             | What it verifies                                                              |
| ---------------- | ----------------------------------------------------------------------------- |
| Icon circle      | size-24, rounded-full, bg-surface-inset, ClipboardList SVG                    |
| Icon color       | text-muted on svg                                                             |
| Heading          | "No hay tareas", font-display, text-[20px], font-bold, text-text-primary      |
| Subtitle text    | renders provided text                                                         |
| Subtitle classes | font-body, text-sm, text-text-secondary, leading-relaxed, text-center         |
| CTA button       | rounded-pill, gradient, text-on-primary, h-12, default label "Publicar tarea" |
| CTA icon         | plus icon inside button, 18px, on-primary                                     |
| Custom label     | actionLabel prop changes button text                                          |
| onAction         | fires on click                                                                |
| No onAction      | does not throw                                                                |
| className merge  | custom class on container                                                     |

### Do NOT

- Do not add header "Nodo" + subtitle (part of 4.3)
- Do not add TabBar
- Do not add auth/tier checks
- Do not touch DS primitives
- Do not add navigation logic

## Dev Agent Record

### Agent Model Used

OpenCode (deepseek-v4-pro)

### Completion Notes

Implemented directly via TDD. 10 tests, all pass. Component uses lucide ClipboardList + Plus icons.

### File List

- `src/components/EmptyState.tsx` — NEW
- `src/components/EmptyState.test.tsx` — NEW (10 tests)
