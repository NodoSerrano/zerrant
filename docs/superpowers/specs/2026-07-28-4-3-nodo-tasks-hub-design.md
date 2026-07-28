# 4.3 Nodo Tasks Hub (ZER-20)

**Status:** approved
**Linear:** https://linear.app/zerrant/issue/ZER-20
**Branch base:** `estudionomade2025/zer-18-41-taskcard-component`
**Pencil frame:** `P77en` (2.3 · Nodo — Tareas)
**Route:** `/nodo/tasks`

## Acceptance Criteria Trace

| AC | Implementation |
|---|---|
| Header "Nodo" | `<h1>Nodo</h1>` replaces current "Tareas" title |
| Segmented control: Tareas / Proyectos | Both tabs visible; Proyectos styled inactive, no link (placeholder until M5) |
| TaskCard list (from 4.1) or empty state (from 4.2) | TaskCards when tasks exist; `<EmptyState>` when empty |
| FAB/create pattern | Floating circular `+` button, bottom-right, links to `/nodo/tasks/new` |
| Filters/estado navigation preserved | Existing filter pills (`todas`, `abierta`, `tomada`, `hecha`, `verificada`) preserved |
| Tourist cannot create | FAB hidden when `profile.tier === "tourist"` |
| TaskCard integration | `href` prop on TaskCard; when set, card wraps in `<Link>`, action button becomes non-interactive `<span>` |

## Architecture

```
src/
├── app/(app)/nodo/tasks/
│   ├── page.tsx          ← REWRITE: server component, TaskCard + EmptyState + segmented + FAB
│   └── page.test.tsx     ← NEW: hub tests
├── components/
│   ├── TaskCard.tsx       ← MODIFY: add optional `href` prop
│   ├── TaskCard.test.tsx  ← MODIFY: add href-mode tests
│   ├── EmptyState.tsx     ← unchanged
│   └── index.ts           ← unchanged (TaskCard already exported)
```

## Files changed

### 1. `src/components/TaskCard.tsx` — add `href` prop

- New optional prop: `href?: string`
- When `href` is set: wrap card root in `<Link href={href}>`, change action button from `<button>` to `<span>` (decorative only, navigation via card wrapper)
- When `href` is absent: existing behavior unchanged
- Component remains a server-compatible component when `href` is used

### 2. `src/components/TaskCard.test.tsx` — href-mode tests

- Card renders as `<a>` when `href` is set
- Action button is a `<span>` (not `<button>`) when `href` is set
- `className` merges correctly with href wrapper
- Without `href`: all existing tests pass unchanged

### 3. `src/app/(app)/nodo/tasks/page.tsx` — rewrite

Server component. Data flow:
1. `createClient()` → get user
2. Read `searchParams.estado` for filter
3. Query `tasks` with profile join, filter by estado if set
4. Query `profiles.tier` for current user → `canCreate`

Render:
```
<div>
  <h1>Nodo</h1>
  <SegmentedControl: Tareas (active) | Proyectos (inactive)>
  <FilterPills: {filtros.map(...)}>
  {tasks.length > 0
    ? <TaskCardList: {tasks.map(t => <TaskCard href={...} ... />)}>
    : <EmptyState subtitle="..." actionLabel="Publicar tarea" />
  }
  {canCreate && <FAB href="/nodo/tasks/new" />}
</div>
```

- FAB: fixed bottom-right, `rounded-full`, brand gradient, `+` icon from lucide, wrapped in `<Link>`
- EmptyState: only shown to non-tourists with action; for tourists, omit the action button
- Relative time: server-side helper computes `"hace X días/horas"` from `created_at`
- Grid: single column, `gap-3`

### 4. `src/app/(app)/nodo/tasks/page.test.tsx` — new tests

Key test cases:
- Renders "Nodo" header
- Segmented control: shows "Tareas" and "Proyectos" tabs
- Proyectos tab is inactive (no link, muted style)
- When tasks exist: renders TaskCards with correct data (title, category, estado)
- TaskCards link to `/nodo/tasks/[id]`
- When no tasks: renders EmptyState
- FAB visible when user is serrano (tier !== "tourist")
- FAB hidden when user is tourist
- FAB links to `/nodo/tasks/new`
- Filter pills render and have correct active state
- Filter pill links contain correct `estado` query param

Test approach: mock `createClient` to return controlled auth + task data, render async component.

## Non-goals

- No changes to server actions (`actions.ts`, `task-actions.tsx`)
- No changes to `EmptyState` or other primitives
- No changes to RLS, DB schema, or data model
- No Proyectos functionality (M5)
- No real-time updates or websockets
- No changes to task detail or create pages

## Edge cases

- **Tourist with no tasks:** EmptyState without action button (FAB already hidden)
- **Serrano with no tasks:** EmptyState with "Publicar tarea" button + FAB
- **Mixed estados:** only `abierta`, `tomada`, `hecha` map to TaskCard states; `verificada` treated as `hecha`
- **Time formatting:** locale `es`, relative: `<1h` = "hace unos minutos", `<24h` = "hace X horas", `<30d` = "hace X días", else locale date
