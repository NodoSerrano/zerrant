---
title: "ZER-66: Remove the fake phone StatusBar from the web shell"
type: "chore"
created: "2026-09-19"
status: "done"
review_loop_iteration: 0
context: []
baseline_commit: "8bba3d2bdb112028acdd0f334e73de233943cd56"
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Both app shells render a fake mobile status bar (hardcoded `9:41` clock + decorative signal/battery SVGs) copied from the Pencil device frames. It's device chrome, not product UI, explicitly excluded by the UI-fidelity spec — but it shipped anyway and now sits under the real browser chrome showing a permanently wrong clock.

**Approach:** Delete `StatusBar` (component, test, barrel export) and its usage in both `(app)/layout.tsx` and `(modal)/layout.tsx`. The content wrappers in both layouts already implement the correct `pt` spacing from the Pencil hub/focused contracts independently of the StatusBar's height, so no new spacing is expected to be needed — verify this visually after removal rather than adding padding speculatively.

## Boundaries & Constraints

**Always:** Delete, don't comment out or flag-gate. Keep each layout's existing `pt-2/px-5/pb-5` (hub) and `pt-1.5/px-5/pb-6` (modal) wrapper classes exactly as-is — they are the real Pencil contract and are independent of StatusBar. Update both layout tests to drop the StatusBar mock/assertion and add an assertion that `9:41` is absent.

**Ask First:** If, after removal, a visual check (dev server, 375px viewport) shows content flush against the top edge or otherwise wrong, stop and ask before inventing a new spacing value — the Pencil MCP was unavailable during planning so the padding contract wasn't re-verified live against `design/nodo-serrano.pen`.

**Never:** Touch `TabBar`/`TabBarClient` (real navigation, stays). Touch `(app)/template.tsx` / `(modal)/template.tsx` (onboarding-gate re-check on navigation, unrelated to StatusBar/padding — confirmed during investigation). Any other fidelity change to the shells.

## I/O & Edge-Case Matrix

| Scenario                  | Input / State               | Expected Output / Behavior                                | Error Handling |
| ------------------------- | --------------------------- | --------------------------------------------------------- | -------------- |
| `(app)` hub render        | Any route under `(app)`     | No StatusBar in DOM, no `9:41` text, TabBar still renders | N/A            |
| `(modal)` focused render  | Any route under `(modal)`   | No StatusBar in DOM, no `9:41` text                       | N/A            |
| Repo-wide reference check | `rg "StatusBar\|9:41" src/` | Zero matches                                              | N/A            |

</frozen-after-approval>

## Code Map

- `src/components/StatusBar.tsx` -- component to delete (63 lines, hardcoded `9:41`, `h-11`)
- `src/components/StatusBar.test.tsx` -- its test file, delete alongside
- `src/components/index.ts:6` -- barrel export line to delete
- `src/app/(app)/layout.tsx` -- remove `StatusBar` import + `<StatusBar />` usage; keep `pt-2 px-5 pb-5` wrapper untouched
- `src/app/(app)/layout.test.tsx` -- remove StatusBar mock + `status-bar` testid assertion; add assertion that `9:41` is absent; keep existing padding-class assertions
- `src/app/(modal)/layout.tsx` -- same as `(app)/layout.tsx`, keep `pt-1.5 px-5 pb-6` wrapper untouched
- `src/app/(modal)/layout.test.tsx` -- same treatment as `(app)/layout.test.tsx`

## Tasks & Acceptance

**Execution:**

- [x] `src/app/(app)/layout.test.tsx` -- remove StatusBar mock/testid assertion, add "no 9:41 text" assertion (RED first) -- TDD: prove today's test still expects StatusBar before removing it
- [x] `src/app/(modal)/layout.test.tsx` -- same as above for the modal shell
- [x] `src/app/(app)/layout.tsx` -- remove `StatusBar` import and usage -- make the hub test pass
- [x] `src/app/(modal)/layout.tsx` -- remove `StatusBar` import and usage -- make the modal test pass
- [x] `src/components/StatusBar.tsx`, `src/components/StatusBar.test.tsx` -- delete both files -- component is now unused
- [x] `src/components/index.ts` -- delete the `StatusBar` barrel export line -- keep the barrel matching what actually exists

**Acceptance Criteria:**

- Given any route under `(app)` or `(modal)`, when rendered, then no `StatusBar` element and no `9:41` text appear in the DOM.
- Given the repo, when running `rg "StatusBar|9:41" src/`, then it returns no matches.
- Given the existing wrapper padding assertions in both layout tests, when StatusBar is removed, then those assertions still pass unchanged (proves the padding contract was never StatusBar-dependent).
- Given a real browser at 375px width, when visually inspected post-removal, then content is not flush against the viewport edge (manual confirmation, since Pencil MCP was unavailable during planning).

## Spec Change Log

## Verification

**Commands:**

- `./node_modules/.bin/vitest run --exclude '**/.claude/worktrees/**' --exclude '**/node_modules/**'` -- expected: all pass, no StatusBar references left in test files
- `./node_modules/.bin/tsc --noEmit` -- expected: no new errors
- `./node_modules/.bin/oxlint --quiet` -- expected: clean on touched files
- `./node_modules/.bin/oxfmt --check` -- expected: clean on touched files
- `rg "StatusBar|9:41" src/` -- expected: zero matches
- `next build` (via `./node_modules/.next/... ` binary or `node node_modules/next/dist/bin/next build`) -- expected: production build succeeds

**Manual checks:**

- Dev server at 375px viewport, at least one `(app)` route and one `(modal)` route -- content sits with the same visual top spacing as before (no fake status bar, no gap collapse against the browser chrome).

## Suggested Review Order

**Removing the fake StatusBar from both shells**

- Entry point: hub shell drops the import and usage, content wrapper padding untouched.
  [`(app)/layout.tsx:1`](<../../src/app/(app)/layout.tsx#L1>)

- Same removal in the focused/modal shell.
  [`(modal)/layout.tsx:3`](<../../src/app/(modal)/layout.tsx#L3>)

- Component, hardcoded `9:41` clock and all, deleted entirely rather than hidden.
  `src/components/StatusBar.tsx` (deleted)

- Barrel export dropped so it matches what actually exists.
  [`components/index.ts:6`](../../src/components/index.ts#L6)

**Test coverage for the removal**

- New assertion proves the fake clock text is gone; old StatusBar mock/testid removed.
  [`(app)/layout.test.tsx:29`](<../../src/app/(app)/layout.test.tsx#L29>)

- Same treatment for the modal shell test.
  [`(modal)/layout.test.tsx:30`](<../../src/app/(modal)/layout.test.tsx#L30>)

- Its own test deleted alongside the component.
  `src/components/StatusBar.test.tsx` (deleted)

**Docs reconciliation (from adversarial review triage)**

- M0 scope checklist no longer instructs building StatusBar as a reusable shell component.
  [`M0 · Fundación.md:17`](../../docs/roadmap/M0%20·%20Fundación.md#L17)

- Fidelity spec non-goal updated from "not pixel-perfect" to "removed entirely".
  [`SPEC.md:82`](../specs/spec-ui-fidelity-m0-m2/SPEC.md#L82)

**Peripherals**

- Four findings from the adversarial review routed to deferred work (parallel worktrees, other stories' dangling references, a frozen spec doc's component count, and unverified `.pen` re-check) rather than fixed here.
  [`deferred-work.md:34`](deferred-work.md#L34)
