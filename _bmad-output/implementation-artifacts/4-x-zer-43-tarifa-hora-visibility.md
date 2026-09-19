# Story 4.x: ZER-43 SEC mask `tarifa_hora` by `visibilidad_tarifa`

Status: review

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a serrano (and as the platform),
I want `tarifa_hora` enforced as private at the database / PostgREST boundary,
so that private rates cannot leak via direct REST reads even when the UI already hides them.

## Linear

- **ZER-43** — SEC: ocultar tarifa_hora cuando visibilidad_tarifa != publica
- URL: https://linear.app/zerrant/issue/ZER-43/sec-ocultar-tarifa-hora-cuando-visibilidad-tarifa-publica
- Branch: `juantandil123/zer-43-sec-ocultar-tarifa_hora-cuando-visibilidad_tarifa-publica`
- Priority: Urgent (P1) · Label: security · Project: Nodo Serrano — Tanda M0–M4 pulido
- Blocks M4 DoD: “tarifa privada según reglas”

## Acceptance Criteria

1. **Given** serrano A with JWT and serrano B with `visibilidad_tarifa = 'privada'` and a non-null `tarifa_hora`  
   **When** A calls PostgREST `GET /rest/v1/profiles?select=id,tarifa_hora&id=eq.<B>` (or the exposed read surface that replaces raw column access)  
   **Then** B’s rate is not disclosed (`tarifa_hora` is `null` **or** selecting that column is denied). No path returns B’s numeric rate to A.

2. **Given** the profile owner’s JWT  
   **When** they read their own row including rate  
   **Then** they always receive their own `tarifa_hora` (public or private).

3. **Given** an `is_platform_admin` JWT  
   **When** they read any profile’s rate  
   **Then** they always receive `tarifa_hora`.

4. **Given** serrano A and serrano B with `visibilidad_tarifa = 'publica'` and non-null rate  
   **When** A reads B  
   **Then** A receives B’s `tarifa_hora`.

5. **Given** a tourist JWT  
   **When** they read any other profile’s rate (public or private)  
   **Then** they never receive a numeric `tarifa_hora`. Owner-self still allowed if a tourist ever has a rate.

6. **Given** existing app routes  
   **When** `/plantel` and `/plantel/[id]` load for authorized users  
   **Then** no regression: list still omits rate columns; detail still shows rate only when allowed; profile edit still loads own rate.

7. **Verification is not UI-only.** Prove with a failing-first automated test of the mask contract, plus a documented PostgREST/JWT check (or local Supabase SQL as authenticated roles) after the migration.

## Tasks / Subtasks

- [x] **TDD — pure mask contract first (RED)** (AC: 1–5)
  - [x] Extend or add pure helper next to `canSeeRate` (recommended: `resolveTarifaHora` / `maskTarifaHora`) that returns `number | null` from `{ tarifaHora, visibilidadTarifa, viewer: { isSelf, isAdmin, isTourist } }`.
  - [x] Cover: self+privada, admin+privada, peer+privada→null, peer+publica→value, tourist+publica→null, null rate→null.
  - [x] Keep existing `canSeeRate` / `buildSerranoMemberDetail` tests green; detail transform must treat tourist viewer as no-rate (today `canSeeRate` does **not** gate tourists — fix that gap).

- [x] **Migration — DB enforcement** (AC: 1–5, 7)
  - [x] New file under `supabase/migrations/` (timestamp after `20260918120000_zer42_tasks_rls_split.sql`), named for ZER-43.
  - [x] Implement the chosen approach below (default: **masked view + revoke base column SELECT**).
  - [x] Reuse `public.is_platform_admin()` (`security definer`); add a sibling helper if needed for “viewer is non-tourist” (**must** be `security definer` + `set search_path = ''` to avoid profiles RLS recursion — same pattern as ZER-38).
  - [x] Comment the migration with the threat model (PostgREST select of `tarifa_hora`).

- [x] **App call-site alignment** (AC: 6)
  - [x] Audit every `from("profiles")` that selects `tarifa_hora` or `*`:
    - `src/app/(app)/plantel/[id]/page.tsx` — detail columns include rate
    - `src/app/(app)/profile/page.tsx` — `select("*")` (breaks under partial column grants)
    - `src/app/(app)/profile/edit/page.tsx` — own rate
  - [x] Point rate reads at the safe surface (view / explicit columns + RPC). Do **not** rely only on JS masking.
  - [x] List route must keep omitting `tarifa_hora` / `visibilidad_tarifa` (already tested).

- [x] **Docs / tracking** (AC: M4 DoD)
  - [x] Clear “riesgo abierto” on `tarifa_hora` in `docs/roadmap/Seguridad RLS.md` once enforced.
  - [x] Story/sprint status only in this change set unless STATUS copy is explicitly in scope.

- [x] **Verify**
  - [x] `pnpm test && pnpm typecheck && pnpm lint`
  - [x] Manual or scripted: JWT of serrano A vs profile B privada → no numeric rate

## Dev Notes

### Problem (current state)

- RLS on `profiles` is **row**-level only. Policy `"Anyone can read serrano profiles"` (`tier <> 'tourist'`) lets any authenticated user read serrano rows **including** `tarifa_hora`.
- UI already masks in `buildSerranoMemberDetail` via `canSeeRate` — **defense in depth missing at DB**.
- M4 list deliberately does not select rate columns; **detail does** and trusts the client transform.
- Roadmap marks this open: [Source: `docs/roadmap/Seguridad RLS.md` — tarifa_hora riesgo abierto].
- M4 DoD: [Source: `docs/roadmap/M4 · Plantel y directorio.md` — “La tarifa privada no se filtra a quien no corresponde”].

### Why column grants alone are insufficient

Postgres **column privileges are not row-conditional**. You cannot GRANT `tarifa_hora` only to the row owner.

Also: table-level `SELECT` still applies if present. Repo history:

1. `20260725033000_grants_authenticated.sql` — `grant select on public.profiles to authenticated`
2. `20260821222554_grants_dml_public.sql` — `grant select … on all tables in schema public to anon, authenticated`
3. `20260725160000_grants_por_columna.sql` — column limits on **INSERT/UPDATE** only (tier / admin), **not** SELECT on `tarifa_hora`

So any fix must: **revoke table-level SELECT** (at least for roles that hit PostgREST), then either re-grant non-sensitive columns + a masked read path, or expose a view and stop selecting the raw column.

Supabase CLS notes: after restricting columns, `select *` fails — callers must list columns or use a view. [Source: Supabase Column Level Security docs]

### Recommended approach (default for implementer)

**Masked read view + revoke raw `tarifa_hora` SELECT on `public.profiles` for `anon`/`authenticated`.**

1. `REVOKE SELECT ON public.profiles FROM anon, authenticated;`
2. `GRANT SELECT ( <all columns except tarifa_hora> ) ON public.profiles TO authenticated;`  
   (Decide `anon`: today plantel is authenticated-only; do not widen anon reads.)
3. Create view e.g. `public.profiles_with_rate` (name bikeshed OK) with:

   - `security_barrier = true` (masking / leakage via predicate pushdown)
   - `security_invoker = true` (Postgres 15+ / Supabase: obey underlying RLS)  
     [Source: Supabase RLS “Expose a view safely”]

4. View projects the same columns the app needs; **`tarifa_hora` is a CASE expression**, not the bare base column:

```sql
case
  when auth.uid() = p.id then p.tarifa_hora
  when public.is_platform_admin() then p.tarifa_hora
  when p.visibilidad_tarifa = 'publica'
       and public.is_non_tourist()  -- security definer helper; name flexible
  then p.tarifa_hora
  else null
end as tarifa_hora
```

5. `GRANT SELECT ON` the view to `authenticated`.
6. App: detail + any rate consumer reads the view (or a thin server helper). Own-profile edit can use the view or self-only path — both must return own rate.
7. **Do not** leave `GRANT SELECT` on base `tarifa_hora` to `authenticated` — that bypasses the view.

**Alternative (ticket b):** security definer function `readable_tarifa_hora(profile_id uuid) returns numeric` + column revoke; plantel selects other columns from table and rate via RPC. More call-site churn; OK if view wiring is painful with generated types.

**Rejected:** JS-only mask (status quo). **Rejected:** relying on “list doesn’t select tarifa” (detail + REST still leak).

### Visibility rule (single source of truth)

| Viewer                          | Target rate visibility | Result                |
| ------------------------------- | ---------------------- | --------------------- |
| Self                            | any                    | show rate if non-null |
| Platform admin                  | any                    | show rate if non-null |
| Serrano (non-tourist, not self) | `publica`              | show                  |
| Serrano                         | `privada`              | hide                  |
| Tourist (not self)              | any                    | hide                  |
| Anyone                          | `tarifa_hora` null     | hide                  |

Align TS (`visibility.ts`) and SQL CASE with this table. Tourist gap is part of AC5.

### Files to touch

| Area          | Path                                                                                                      | Notes                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| NEW migration | `supabase/migrations/20XXXXXXXXXX_zer43_tarifa_hora_visibility.sql`                                       | Enforce mask                                            |
| Pure lib      | `src/features/plantel/visibility.ts` (+ tests)                                                            | Tourist + resolve rate                                  |
| Transform     | `src/features/plantel/transform.ts` (+ `detail-transform.test.ts`)                                        | Pass viewer tourist flag if needed                      |
| Detail page   | `src/app/(app)/plantel/[id]/page.tsx` (+ page test)                                                       | Safe read surface; pass `isTourist`                     |
| Profile       | `src/app/(app)/profile/page.tsx`, `edit/page.tsx`                                                         | `select *` / own tarifa                                 |
| Types         | `src/lib/supabase/database.types.ts`                                                                      | Only if view/RPC added to schema types; don’t hand-wave |
| Docs          | `docs/roadmap/Seguridad RLS.md`                                                                           | Close open risk                                         |
| Prior art     | `supabase/migrations/20260918120000_zer42_tasks_rls_split.sql`, `src/features/tasks/task-update-guard.ts` | SEC pattern: migration + pure mirror + Vitest           |

### Testing requirements (project)

- **TDD mandatory:** failing pure tests before migration/app green.
- Vitest unit tests are the default gate (`pnpm test`). There is **no** in-repo pgTAP suite yet; Stack says Supabase local CLI for RLS integration — if local Supabase is available, add a minimal SQL/role proof; otherwise document exact `curl`/SQL verification steps in the PR and still ship pure contract tests.
- Do **not** claim AC1 done from UI screenshots.
- Preserve plantel list test: never select `tarifa_hora` on list query.

### Previous story intelligence (ZER-42)

- Split enforcement: DB is source of truth; pure TS mirrors for unit tests.
- `security definer` helpers need `set search_path = ''` and tight `GRANT EXECUTE`.
- Profiles RLS recursion already burned once (ZER-38) — never subquery `profiles` inside a profiles policy/view expression without a definer helper.
- Out of scope then: ZER-43 tarifa (this story), ZER-44 0-row false success, UI chrome.

### Git intelligence

- Recent SEC: `4ca5a77` ZER-42 tasks RLS split; `b50c3fb` ZER-38 profiles recursion; column grants pattern from `20260725160000`.
- Plantel detail landed via ZER-33; skills M4.3 ZER-34.

### Project structure / stack

- Next App Router + Supabase SSR; feature folders under `src/features/*`.
- Migrations versioned in `supabase/migrations`; never fix prod only in Dashboard.
- Generated DB types in `src/lib/supabase/database.types.ts`.
- Spanish UI copy; English story/code comments unless extending Spanish docs.

### Out of scope

- ZER-44 (0-row success on updates)
- Redesigning plantel UI / rate card chrome
- Making tourists appear in plantel
- Changing default `visibilidad_tarifa` or rate economics
- Broad sprint-status bulk reconcile (ZER-46)

### Implementation guardrails (anti-patterns)

- **Do not** “fix” only `transform.ts` and close the ticket.
- **Do not** GRANT table-level SELECT again “to make types easier” without excluding `tarifa_hora`.
- **Do not** create a `security definer` view that returns all profile rows without an invoker/RLS story — prefer `security_invoker` + barrier + existing row policies.
- **Do not** subquery `profiles` for admin/tourist checks inside plain invoker expressions without definer helpers (recursion).
- **Do not** break owner UPDATE of `tarifa_hora` / `visibilidad_tarifa` (column UPDATE grants already exist in `20260725160000`).
- **Do not** skip tourist AC because “tourists can’t open plantel” — direct REST still matters; detail URL may be reachable.

### References

- Linear ZER-43 description (AC + verify via PostgREST JWT)
- `docs/roadmap/Seguridad RLS.md`
- `docs/roadmap/M4 · Plantel y directorio.md` (DoD)
- `docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md` (tarifa visibility intent)
- `docs/roadmap/Stack técnico.md` (Vitest + Supabase local)
- Migrations: `20260721194312_profiles_setup.sql`, `20260815120000_skills_profile_skills.sql` (serrano read policy), `20260821223400_fix_rls_recursion_profiles.sql`, `20260821222554_grants_dml_public.sql`, `20260725160000_grants_por_columna.sql`
- App: `src/features/plantel/visibility.ts`, `transform.ts`, `src/app/(app)/plantel/[id]/page.tsx`
- Prior SEC story: `_bmad-output/implementation-artifacts/4-x-zer-42-tasks-rls-split.md`

## Dev Agent Record

### Agent Model Used

Gentle AI on Hermes (grok-4.5)

### Debug Log References

- Local Supabase migration applied: `20260918220000_zer43_tarifa_hora_visibility.sql`
- SQL role proof (request.jwt.claims + role authenticated): peer privada→null, self→40, admin→99, publica peer→99, tourist→null, base `profiles.tarifa_hora` → insufficient_privilege

### Completion Notes List

- Pure contract: `resolveTarifaHora` + tourist gate on `canSeeRate`
- DB: revoke table SELECT on profiles for anon/authenticated; grant columns except tarifa_hora; `profiles_with_rate` security definer view + `is_non_tourist()`
- App: plantel detail + profile edit read view; profile page explicit columns (no `*`)
- Docs: closed open risk in Seguridad RLS.md
- Gates: pnpm test (846), typecheck, lint green

### File List

- supabase/migrations/20260918220000_zer43_tarifa_hora_visibility.sql
- src/features/plantel/visibility.ts
- src/features/plantel/visibility.test.ts
- src/features/plantel/transform.ts
- src/features/plantel/detail-transform.test.ts
- src/app/(app)/plantel/[id]/page.tsx
- src/app/(app)/plantel/[id]/page.test.tsx
- src/app/(app)/profile/page.tsx
- src/app/(app)/profile/edit/page.tsx
- src/features/profile/displayName.ts
- src/features/profile/**tests**/edit-profile-page.test.tsx
- src/lib/supabase/database.types.ts
- docs/roadmap/Seguridad RLS.md
- _bmad-output/implementation-artifacts/4-x-zer-43-tarifa-hora-visibility.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
