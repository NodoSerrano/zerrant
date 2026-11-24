<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Production-first — mandatory

The goal is **shipping to production**, not prototypes or demos.

- Every change must be **production-ready**: correct, tested, and deployable.
- **Do not leave intentional tech debt** ("fix later", vibecode UI, fake controls, stub backends for in-scope work).
- If something is in scope, finish it properly (real data, real storage, real design parity) or explicitly cut it from scope — never half-ship.
- UI source of truth: `design/nodo-serrano.pen`. Do not invent alternate layouts.
- Active UI fidelity contract: `_bmad-output/specs/spec-ui-fidelity-m0-m2/`.

# TDD — mandatory

Test-driven development is REQUIRED for all implementation work. Before writing any implementation code, write a failing test first. Then write the minimal code to make it pass. Never write implementation before tests.

- Vitest + Testing Library for all tests
- Tests must pass (`pnpm test`) before claiming work is done
- Server actions: test the logic in isolation (mock Supabase)
- Components: test rendering and user interactions
- Hooks/helpers: test all branches and edge cases

# BMad Method — mandatory

The BMad Method skills in `.claude/skills/` (and `.agents/skills/`) are MANDATORY for all workflow decisions. Never skip the process.

## Entry points by context

| When you need to...                    | Use skill                                         |
| -------------------------------------- | ------------------------------------------------- |
| Start ANY new feature or creative work | `bmad-brainstorming`                              |
| Create/review product requirements     | `bmad-create-prd` or `bmad-prd`                   |
| Create epics and user stories          | `bmad-create-epics-and-stories`                   |
| Plan a sprint                          | `bmad-sprint-planning`                            |
| Develop a story (implementation)       | `bmad-dev-story`                                  |
| Code review                            | `bmad-code-review`                                |
| Define architecture                    | `bmad-architecture` or `bmad-create-architecture` |
| Test architecture / ATDD               | `bmad-testarch-framework` / `bmad-testarch-atdd`  |
| Run a retrospective                    | `bmad-retrospective`                              |
| Not sure what to do next               | `bmad-help`                                       |
| Validate PRD completeness              | `bmad-validate-prd`                               |
| Quick dev without full ceremony        | `bmad-quick-dev`                                  |

## Rules

- **Never skip the process** — even for "simple" changes, run `bmad-help` if unsure
- **PRD before code** — features need requirements, even if lightweight
- **TDD within BMad** — `bmad-dev-story` works with the TDD cycle
- **Fresh context** — run each BMad skill in a fresh conversation window as recommended

# Project roadmap — essential reading

Before implementing any feature, read the relevant milestone spec in `docs/roadmap/`. These define scope, DoD, and data model for each milestone.

- **`docs/roadmap/STATUS.md`** — live operational status (`main` vs `develop`, open PRs, Linear counts, risks)
- **`docs/roadmap/PROGRESS.md`** — overall milestone completion status (check alongside `STATUS.md`)
- **`docs/roadmap/M*.md`** — individual milestone specs (scope, screens, data, DoD)
- **`docs/roadmap/Modelo de datos.md`** — database schema reference
- **`docs/roadmap/Seguridad RLS.md`** — Row Level Security rules
- **`docs/roadmap/Stack técnico.md`** — architecture decisions
- **`docs/roadmap/Glosario.md`** — domain terminology (serrano, tier, rol, etc.)
- **`docs/superpowers/specs/`** — full PRD and design specs
- **`docs/templates/linear-issue-templates.md`** & **`.github/ISSUE_TEMPLATE/`** — issue templates and Linear ↔ GitHub workflow (feature PRs target `develop`, releases merge `develop` → `main`)
- **`Linear`** — workspace at https://linear.app/zerrant (legacy UI fidelity M0–M2 ref: https://linear.app/zerrant/project/nodo-serrano-ui-fidelity-m0-m2-38ca59210685)
  - Story files in `_bmad-output/implementation-artifacts/` are the SSOT for acceptance criteria
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` maps story keys to Linear ZER-# IDs
  - Use Linear / issue tools to update issue status, add comments, and link PRs
