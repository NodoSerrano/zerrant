# Story 4.3: Editar habilidades (3.3)

Status: in-progress

Linear: ZER-34 · Branch: `estudionomade2025/zer-34-m43-editar-habilidades`

## Story

As a serrano,
I want to edit my own skills from my profile,
so that I can keep my skills up to date with the tags the community already uses.

## Acceptance Criteria

1. **Access Control (self-service)**
   - Route `/profile/habilidades` (edita las skills del propio perfil).
   - Unauthenticated → redirect `/auth/login`.
   - `tier === "tourist"` → redirect `/profile` (los tourists no tienen skills).
   - No hay edición de skills de terceros: RLS solo permite `auth.uid() = profile_id`.

2. **UI – Pencil 3.3**
   - Follow exactly frame `3.3 Editar habilidades` (`sYaBa`) from `design/nodo-serrano.pen`.
   - Topbar: chevron-left (volver a `/profile`) + título "Habilidades" + "Guardar".
   - Header: "Tus habilidades" + subtitle "Agregá tags. Te sugerimos los que ya usa la comunidad."
   - Input de búsqueda "Agregar habilidad..." que filtra las sugerencias.
   - Skills actuales como chips removibles (pill verde con `x`).
   - Sección "Sugerencias" con chips del catálogo (pill `surface` con `+`).
   - Sin duplicados entre seleccionadas y sugerencias.

3. **Data & Logic**
   - Load current `profile_skills` + all `skills` (catálogo) desde el server.
   - Add/remove skills vía `profile_skills` (única por `profile_id, skill_id`).
   - On save: delete las removidas + insert las agregadas (`ignoreDuplicates`).
   - Al guardar → `revalidatePath` + `redirect("/profile")`.
   - Skills normalizadas (trim, collapse whitespace, dedup case-insensitive).

4. **Integration with existing code**
   - Reuse `Chip`, `Input`, `PrimaryButton` y tokens del DS.
   - Entrada desde `SerranoMenu` (item "Mis habilidades" → `/profile/habilidades`).
   - No duplicar lógica de permisos; el gate vive en el server component.

5. **TDD Mandatory**
   - Red → green → refactor.
   - Test: normalización, dedup, diff add/remove, sugerencias, permisos, save flow, UI, empty states.
   - Final: `pnpm test && pnpm typecheck && pnpm lint` limpios.

6. **Edge Cases**
   - Sin skills aún.
   - Todas las skills ya agregadas.
   - Network error on save.
   - Tourist intentando editar (redirect).

## Out of Scope

- Edición completa del perfil (solo skills).
- Crear skills nuevas en el catálogo (RLS: solo admin; Pencil solo muestra sugerencias del catálogo).
- Editar skills de terceros.
- Import masivo / sugerencias por ML.

## Technical Notes

- Route: `/profile/habilidades` (server component con auth gate + tourist redirect).
- Server Action para el save (patrón de `src/features/profile/actions.ts`).
- Componente cliente `EditSkills.tsx` en `src/features/plantel/`.
- Helpers puros en `skills.ts` (normalización + diff + sugerencias).

## Tasks

- [x] Story file + sprint-status.yaml (ZER-34 → in-progress)
- [x] RED: tests de helpers `skills.ts`
- [x] GREEN: helpers `skills.ts`
- [x] RED: tests de `saveProfileSkills`
- [x] GREEN: server action `skills-actions.ts`
- [x] RED: tests UI `EditSkills.test.tsx`
- [x] GREEN: `EditSkills.tsx` + `page.tsx`
- [x] Wire `SerranoMenu` (item "Mis habilidades" → `/profile/habilidades`)
- [x] Verify `pnpm test && pnpm typecheck && pnpm lint`
- [ ] PR con `Closes ZER-34` (deferido hasta el merge de ZER-33 / PR #21)

**DoD:** Tests green, matches Pencil 3.3, permissions enforced (self/tourist), skills persisted, sin PR hasta merge de ZER-33.

## File List

| File                                                       | Acción                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| `src/features/plantel/skills.ts`                           | NEW — helpers puros (normalizar, dedup, diff, sugerencias)        |
| `src/features/plantel/skills.test.ts`                      | NEW                                                               |
| `src/features/plantel/skills-actions.ts`                   | NEW — server action `saveProfileSkills`                           |
| `src/features/plantel/skills-actions.test.ts`              | NEW                                                               |
| `src/features/plantel/EditSkills.tsx`                      | NEW — componente cliente (Pencil 3.3)                             |
| `src/features/plantel/EditSkills.test.tsx`                 | NEW                                                               |
| `src/app/(app)/profile/habilidades/page.tsx`               | NEW — gate auth/tourist + carga skills/catálogo                   |
| `src/app/(app)/profile/habilidades/page.test.tsx`          | NEW                                                               |
| `src/app/(app)/profile/SerranoMenu.tsx`                    | UPDATE — "Mis habilidades" → `<Link href="/profile/habilidades">` |
| `src/features/profile/__tests__/profile-serrano.test.tsx`  | UPDATE — assert del link                                          |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | UPDATE — `4-3-editar-habilidades: ZER-34` + in-progress           |

## Change Log

- Alcance corregido según Linear ZER-34: ruta `/profile/habilidades` (self-service), no `/plantel/[id]/edit-skills`. Sin edición de skills de terceros (RLS solo permite `auth.uid() = profile_id`).
- `saveProfileSkills` usa `upsert({ onConflict: "profile_id,skill_id", ignoreDuplicates: true })` para evitar duplicados (la constraint `unique (profile_id, skill_id)` ya existe en la migración de ZER-32).

## Dev Agent Record

### Completion Notes

- Implementado self-service de edición de habilidades en `/profile/habilidades`, fiel al frame Pencil `sYaBa` (3.3).
- Reutiliza `skills` + `profile_skills` (catálogo normalizado), tokens del DS y helpers compartidos (`suggestSkills`, `computeSkillDiff`, `dedupeSkillNames`, `normalizeSkillName`).
- RLS existente cubre el write (self insert/delete); el gate de tourist vive en el server component.
- Sin push ni PR: la rama queda lista hasta que se mergee ZER-33 (PR #21).
- Verificación: `pnpm test` (719 passing), `pnpm typecheck`, `pnpm lint` limpios.
