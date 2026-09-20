# Screen inventory (in-scope)

Pencil SSOT: `design/nodo-serrano.pen`. Mobile frame width **390**.

| Pencil frame          | Node id | App route(s)                     | CAP      | Notes                                                                           |
| --------------------- | ------- | -------------------------------- | -------- | ------------------------------------------------------------------------------- |
| 2.1 · Inicio          | `TBD`   | `/` (or `/inicio` if IA demands) | CAP-2, 3 | Upcoming events + birthdays; replaces profile redirect for completed onboarding |
| 7.5 · Offline / error | `TBD`   | offline shell / error UI         | CAP-5, 6 | Designed offline and recoverable error                                          |
| 7.6 · 404             | `TBD`   | `not-found`                      | CAP-6    | App-owned 404                                                                   |

Routes above are the **expected** shape and may be adjusted to match Pencil IA once node ids are resolved; the frame column is the binding part.

## Node ids are unresolved — resolve before implementing

Every `Node id` cell reads `TBD` on purpose. `design/nodo-serrano.pen` is **encrypted**: never open with `Read`/`bat`/`rg`/filesystem tools.

**Mandatory step before each UI story:** resolve that frame's node id through `mcp__pencil` and record it back into this table.

## Surfaces touched but not owned by a new frame

| Surface          | File / area                                   | Change                                                                                               |
| ---------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Root `/`         | `src/app/page.tsx`                            | Stop unconditional redirect-to-profile for completed onboarding; render Inicio (or route group page) |
| TabBar           | `src/components/TabBar.tsx`                   | Reintroduce Inicio as 5th tab (ZER-67 removed it while `/` only redirected)                          |
| Manifest / icons | `public/`, app metadata                       | Installability                                                                                       |
| Service worker   | Serwist (preferred) or documented alternative | Offline shell                                                                                        |
| Dark theme       | shipped screens using tokens                  | Polish pass, not a new theme                                                                         |

## Explicitly out of scope (this spec)

M5/M6 frames already ticketed. Push notification UI. Full offline data sync. Backlog items.

## Acceptance method

For each row: Pencil frame (via `mcp__pencil`) next to live route at ~390px. Fail on IA, primary CTA, or key-copy divergence. For PWA: install + offline shell evidence on a real device or browser profile, recorded on the QA story.
