# Data model notes (M7)

## No new tables

M7 **does not** add Postgres tables for birthdays or PWA.

### Inputs (already shipped)

| Source             | Field / artifact                                                                    | Use in M7                    |
| ------------------ | ----------------------------------------------------------------------------------- | ---------------------------- |
| `profiles`         | `fecha_nacimiento date` (nullable in types; required by onboarding step1 gate)      | Age + upcoming birthday list |
| `profiles`         | visible name fields (`nombre`, `apellido`, `apodo`, `nombre_visible`, `avatar_url`) | Birthday row identity        |
| `events` (M6)      | `titulo`, `inicio`, `fin`, `lugar`, …                                               | Inicio "próximos eventos"    |
| Design tokens (M0) | CSS variables + `.dark`                                                             | Dark polish                  |
| Auth session       | Supabase SSR cookie session                                                         | Who sees Inicio              |

### Derived (application layer only)

- **Age** — calendar age from `fecha_nacimiento` as of "today" in a single documented timezone strategy (prefer America/Argentina/Buenos_Aires or explicit UTC date-only math; pick one in the pure-lib story and test it).
- **Next birthday occurrence** — next month/day ≥ today, else next year; leap day: define Feb 28/Mar 1 policy in tests.
- **Upcoming window** — default **30 days** inclusive unless Pencil IA shows a fixed count; if Pencil shows a fixed N rows, prefer that count once node id is resolved.

### RLS

No new policies. Birthday list reads profiles the viewer is already allowed to see (same visibility class as plantel for serranos; tourists must not gain a backdoor directory via Inicio). **Rule:** Inicio birthday queries must reuse the same visibility constraints as the plantel directory (non-tourist members only, or whatever plantel uses today) — never `select * from profiles` unrestricted.

### PWA / client storage

- Manifest and SW caching are **not** a data model.
- Do not persist other users' PII in Cache Storage beyond what the offline shell requires (static assets + shell routes).

### Grants

No new tables → no new grants story. If a SECURITY DEFINER helper is needed for birthday visibility, it follows existing `is_non_tourist` / plantel patterns and ships with tests.
