# Story: ZER-42 SEC split RLS tasks (creador vs tomador)

Status: done

## Goal

Close the PostgREST bypass where a task **taker** could set `estado = verificada` and rewrite content columns because one UPDATE policy + column grants allowed creator OR taker on the full row.

## Approach

**A + BEFORE UPDATE trigger** (`enforce_task_update_guard`).

RLS policies split row access (creator / taker / claim open / admin). Column-level transition rules live in the trigger (Postgres RLS cannot restrict which columns change). Pure TS mirror: `src/features/tasks/task-update-guard.ts`.

## Acceptance

- [x] Taker cannot set `verificada` via direct update
- [x] Taker cannot edit titulo/descripcion/categoria/urgencia
- [x] Taker can claim abierta → tomada and mark tomada → hecha
- [x] Creator can edit content while abierta; cancel abierta|tomada
- [x] Admin can hecha → verificada
- [x] creado_por immutable
- [x] Existing actions keep working (same `.update()` paths; DB enforces)

## Migration

`supabase/migrations/20260918120000_zer42_tasks_rls_split.sql`

## Out of scope

ZER-44 (0-row false success), ZER-43 tarifa, UI, sprint-status bulk sync.

## Verify

`pnpm test && pnpm typecheck && pnpm lint`
