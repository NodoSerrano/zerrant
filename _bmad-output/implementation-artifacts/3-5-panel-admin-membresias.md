---
baseline_commit: TBD
---

# Story 3.5: Panel admin — cola de membresías (6.1)

Status: ready-for-dev

<!-- Story context engine — from Linear ZER-28, M3 milestone, Pencil frame sIj6D. -->

## Story

As a platform admin,
I want to see pending membership requests and approve or reject them,
so that tourists can become Serranos and join the community.

## Acceptance Criteria

### 1. Admin guard (FR24)

**Given** a user navigates to any `/admin/*` route
**When** the page renders
**Then** `is_platform_admin` is checked via `profiles.is_platform_admin`
**And** non-admins are redirected to `/nodo/tasks`
**And** unauthenticated users are redirected to `/auth/login`

### 2. Page chrome matching Pencil (FR24, UX-DR12)

**Given** Pencil frame `sIj6D` (6.1 · Admin — Membresías)
**When** `/admin/membresias` renders for an admin
**Then** header row: Lucide `ChevronLeft` (24×24, `text-text-primary`) + "Panel de admin" (`font-display text-[16px] font-medium text-text-primary`)
**And** the chevron navigates back (use `router.back()` or link to `/profile`)
**And** section title: "Solicitudes pendientes" (`font-display text-[22px] font-bold text-text-primary`)
**And** section subtitle: "Turistas esperando ser Serranos" (`font-body text-[13px] text-text-secondary`)
**And** counter badge: membership count in coral pill (`rounded-pill bg-coral text-white font-display text-[14px] font-bold px-[13px] py-[7px]`)

### 3. Segmented tabs matching Pencil (FR24)

**Given** Pencil segmented switch `p4k5E`
**When** `/admin/membresias` renders
**Then** a segmented control renders: `flex gap-1 p-1 rounded-[14px] bg-surface-inset` filling container width
**And** "Membresías" tab is active: `rounded-[11px] bg-surface h-[38px] flex-1 flex items-center justify-center` with shadow (`blur 6, y 2, #1a161418`) and text `font-display text-[13px] font-semibold text-text-primary`
**And** "Roles" tab is inactive: `rounded-[11px] h-[38px] flex-1 flex items-center justify-center text-text-muted font-display text-[13px] font-medium` — NO onClick, NO link, purely visual
**And** tab labels include counts: "Membresías · {n}" and "Roles · {m}"
**And** pending membership count `n` comes from `SELECT count(*) FROM membership_requests WHERE estado = 'pendiente'`
**And** pending roles count shows 0 (real `SELECT count(*) FROM profile_roles WHERE confirmado = false` in a follow-up story — M3.7)

### 4. Request list matching Pencil (FR24)

**Given** pending membership requests exist in DB
**When** `/admin/membresias` renders
**Then** the list renders as a vertical column `gap-3`
**And** each request renders a `<RequestCard>` component

### 5. RequestCard component matching Pencil (FR24)

**Given** Pencil `RequestCard` node `i9N6j`
**When** rendered with a membership request
**Then** container: `rounded-[24px] bg-surface border border-border p-4 flex flex-col gap-3.5` with shadow (`blur 30, y 10, spread -12, #1a161426`)
**And** top row: Avatar (48×48, ref `aaHkg`, initials from `profiles.nombre + profiles.apellido`) next to a column:
  - Name: `displayName(profile)` (`font-display text-[16px] font-medium text-text-primary`)
  - Email: `profiles.email` or `auth.users.email` (`font-body text-[12px] text-text-muted`)
  - Meta: relative time "Solicitó hace {n} horas/días/semanas" (`font-body text-[11px] text-text-muted`)
**And** actions row: two buttons side by side `gap-2.5`
  - Aprobar: `rounded-pill bg-primary h-[44px] flex-1 flex items-center justify-center gap-1.5` with Lucide `Check` icon (17×17, `text-on-primary`) + "Aprobar" (`font-display text-[15px] font-medium text-on-primary`)
  - Rechazar: `rounded-pill bg-surface border border-border h-[44px] flex-1 flex items-center justify-center` with "Rechazar" (`font-display text-[15px] font-medium text-text-secondary`)
**And** buttons trigger server actions via `<form action={...}>` for approve/reject
**And** clicking a button calls the corresponding action with the `request.id`
**And** the expanded message (`mensaje`) from the request is displayed between the top row and actions when present (matching Pencil expand pattern — implement as always-visible or expand-on-click; Pencil shows it always-visible inline)

### 6. Approve action (FR24)

**Given** an admin clicks "Aprobar" on a pending request
**When** the server action executes
**Then** `membership_requests` row is updated: `estado = 'aprobada'`, `revisado_por = auth.uid()`, `actualizado_en = now()`
**And** the corresponding `profiles.tier` is set to the requested tier (default `standard`)
**And** on success, the page revalidates (re-renders with updated list)
**And** on error, an error message is shown

### 7. Reject action (FR24)

**Given** an admin clicks "Rechazar" on a pending request
**When** the server action executes
**Then** `membership_requests` row is updated: `estado = 'rechazada'`, `revisado_por = auth.uid()`, `actualizado_en = now()`
**And** the profile tier is NOT changed
**And** on success, the page revalidates
**And** on error, an error message is shown

### 8. Empty state (FR24)

**Given** no pending membership requests exist
**When** `/admin/membresias` renders
**Then** counter badge shows "0"
**And** the list area shows an empty state message: "No hay solicitudes pendientes" (`font-body text-[14px] text-text-muted text-center py-8`)

### 9. Historial tab (FR24)

**Given** the "Historial" nomenclature is implied by resolved requests
**When** looking at the page structure
**Then** a second tab/segment for "Historial" is NOT implemented in this story
**And** only pending requests are shown
**And** the Historial tab is reserved for a follow-up

### 10. Branch exclusivity (FR24)

**Given** a non-admin user somehow reaches `/admin/membresias`
**When** the page renders
**Then** they are redirected before any admin content renders
**And** the redirect happens at the layout level for all `/admin/*` routes

### 11. Tests (NFR2)

**Given** TDD required
**When** implemented
**Then** tests cover: admin guard redirects non-admin, page renders pending requests with RequestCard, approve action updates estado and tier, reject action updates estado, counter badge matches count, segmented tabs render with correct active state, empty state renders when no pending requests
**And** `pnpm test`, `pnpm typecheck`, and `pnpm lint` pass

## Pencil → Tailwind Token Map

### Page shell (sIj6D)

| Pencil property     | Pencil value      | Tailwind class              |
| ------------------- | ----------------- | --------------------------- |
| Header row          | gap 12            | `gap-3`                     |
| ChevronLeft size    | 24×24             | `size-6`                    |
| Header text size    | 16, weight 500    | `text-[16px] font-medium`   |
| Section title size  | 22, weight 700    | `text-[22px] font-bold`     |
| Section subtitle    | 13, normal        | `text-[13px]`               |
| Counter pill fill   | `$coral`          | `bg-coral`                  |
| Counter pill radius | 999               | `rounded-pill`              |
| Counter text        | 14, weight 700    | `text-[14px] font-bold`     |
| Counter padding     | [13, 7]           | `px-[13px] py-[7px]`       |

### Segmented tabs (p4k5E)

| Pencil property       | Pencil value                        | Tailwind class                     |
| --------------------- | ----------------------------------- | ---------------------------------- |
| Container radius      | 14                                  | `rounded-[14px]`                   |
| Container fill        | `$surface-inset`                    | `bg-surface-inset`                 |
| Container padding     | 4, gap 4                            | `p-1 gap-1`                        |
| Active tab radius     | 11                                  | `rounded-[11px]`                   |
| Active tab fill       | `$surface`                          | `bg-surface`                       |
| Active tab height     | 38                                  | `h-[38px]`                         |
| Active tab shadow     | blur 6, y 2, #1a161418              | `shadow-[0_2px_6px_#1a161418]`     |
| Active tab text       | 13, weight 600, `$text-primary`     | `text-[13px] font-semibold text-text-primary` |
| Inactive tab text     | 13, weight 500, `$text-muted`       | `text-[13px] font-medium text-text-muted` |
| Tab font              | `$font-display`                     | `font-display`                     |

### RequestCard (i9N6j)

| Pencil property     | Pencil value                                          | Tailwind class                            |
| ------------------- | ----------------------------------------------------- | ----------------------------------------- |
| Container radius    | 24                                                    | `rounded-[24px]`                          |
| Container fill      | `$surface`                                            | `bg-surface`                              |
| Container stroke    | `$border` 1px inner                                   | `border border-border`                    |
| Container padding   | 16                                                    | `p-4`                                     |
| Container gap       | 14                                                    | `gap-3.5`                                 |
| Shadow              | blur 30, y 10, spread -12, #1a161426                  | `shadow-[0_10px_30px_-12px_#1a161426]`    |
| Avatar size         | 48×48 (ref `aaHkg`)                                   | `size-12` on Avatar component             |
| Name font           | 16, weight 500, `$font-display`, `$text-primary`      | `text-[16px] font-medium font-display text-text-primary` |
| Email font          | 12, normal, `$font-body`, `$text-muted`               | `text-xs font-body text-text-muted`       |
| Meta font           | 11, normal, `$font-body`, `$text-muted`               | `text-[11px] font-body text-text-muted`   |
| Actions gap         | 10                                                    | `gap-2.5`                                 |
| Approve button fill | `$primary`                                            | `bg-primary`                              |
| Approve button h    | 44                                                    | `h-[44px]`                                |
| Approve button rad  | 999                                                   | `rounded-pill`                            |
| Approve icon        | Check, 17×17, `$on-primary`                           | `size-[17px] text-on-primary`             |
| Approve text        | 15, weight 500, `$font-display`, `$on-primary`        | `text-[15px] font-medium font-display text-on-primary` |
| Reject button fill  | `$surface`                                            | `bg-surface`                              |
| Reject text         | 15, weight 500, `$font-display`, `$text-secondary`    | `text-[15px] font-medium font-display text-text-secondary` |

## Tasks / Subtasks

- [ ] **T1 — Red: test scaffold** (AC: 1, 2, 3, 4, 5, 8, 10, 11)
  - [ ] `src/app/(app)/admin/__tests__/membresias-page.test.tsx` — page-level tests
  - [ ] `src/components/__tests__/RequestCard.test.tsx` — component unit tests
  - [ ] `src/features/admin/__tests__/actions.test.ts` — server action tests
  - [ ] Mock `@/lib/supabase/server` with admin profile fixture (`is_platform_admin: true`), membership requests list, and empty state
  - [ ] Mock `next/navigation` redirect for auth/admin guards
  - [ ] Tests cover all AC 1–10
  - [ ] Verify RED: no admin page exists, all tests fail

- [ ] **T2 — Green: admin layout + guard** (AC: 1, 10)
  - [ ] Create `src/app/(app)/admin/layout.tsx` with admin guard (server component, checks `is_platform_admin`, redirects non-admin)
  - [ ] Create `src/app/(app)/admin/membresias/page.tsx` server component
  - [ ] Auth guard: `getUser()` → redirect `/auth/login`
  - [ ] Admin guard: `profiles.is_platform_admin` → redirect `/nodo/tasks`

- [ ] **T3 — Green: page shell + segmented tabs** (AC: 2, 3)
  - [ ] Header: ChevronLeft + "Panel de admin"
  - [ ] Section: "Solicitudes pendientes" + subtitle + counter badge
  - [ ] Segmented tabs: Membresías (active) + Roles (inactive, no-op)
  - [ ] Query `count(*)` for pending membership requests and pending roles

- [ ] **T4 — Green: RequestCard component** (AC: 5)
  - [ ] Create `src/components/RequestCard.tsx`
  - [ ] Props: `request: { id, profile: { nombre, apellido, avatar_url }, mensaje, created_at }`
  - [ ] Avatar (48px) + name + email/meta + mensaje + approve/reject buttons

- [ ] **T5 — Green: request list + empty state** (AC: 4, 8)
  - [ ] Query pending requests with join: `membership_requests(estado, mensaje, created_at, profiles(nombre, apellido, apodo, nombre_visible, avatar_url))`
  - [ ] Map to `<RequestCard>` components
  - [ ] Empty state when no pending requests

- [ ] **T6 — Green: approve/reject server actions** (AC: 6, 7)
  - [ ] Create `src/features/admin/actions.ts` with `approveRequest(id)` and `rejectRequest(id)`
  - [ ] Each action: verify admin, update `membership_requests` row, update `profiles.tier` on approve
  - [ ] Client component wrapper for forms: `<form action={approveRequest.bind(null, requestId)}>`

- [ ] **T7 — Verify**
  - [ ] `pnpm test` passes (all new + existing tests)
  - [ ] `pnpm typecheck` passes
  - [ ] `pnpm lint` passes
  - [ ] Manual check: `/admin/membresias` as admin shows Pencil shell; non-admin redirected

## Files to Touch

| Action | File                                                     |
| ------ | -------------------------------------------------------- |
| NEW    | `src/app/(app)/admin/layout.tsx`                         |
| NEW    | `src/app/(app)/admin/membresias/page.tsx`                |
| NEW    | `src/components/RequestCard.tsx`                         |
| NEW    | `src/features/admin/actions.ts`                          |
| NEW    | `src/app/(app)/admin/__tests__/membresias-page.test.tsx` |
| NEW    | `src/components/__tests__/RequestCard.test.tsx`          |
| NEW    | `src/features/admin/__tests__/actions.test.ts`           |

### Existing files unchanged

| File                                 | Reason                                            |
| ------------------------------------ | ------------------------------------------------- |
| `src/components/Avatar.tsx`          | DS primitive — consumed, not modified             |
| `src/components/PrimaryButton.tsx`   | Not used; RequestCard has inline Pencil buttons   |
| `src/features/auth/actions.ts`       | `signOut` — not affected                          |
| `supabase/migrations/`               | M3.1 migration already applied                    |
| `src/lib/supabase/database.types.ts` | May need type update (see Dev Notes)              |

## Dev Notes

### Database types mismatch

The `database.types.ts` and the migration are out of sync. The migration has:

```sql
create table public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mensaje text,
  tier_solicitado tier not null default 'standard',
  estado membership_request_estado not null default 'pendiente',
  revisado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
```

But `database.types.ts` has `resuelta_por` instead of `revisado_por`, and is missing `tier_solicitado` and `actualizado_en`. **Before development**, regenerate types with:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

This ensures `revisado_por`, `tier_solicitado`, and `actualizado_en` are in the type system.

### Admin guard pattern (layout-level)

The existing app uses per-page guard patterns (`createClient()` + `getUser()` + `redirect()`). For admin routes, use a layout-level guard in `src/app/(app)/admin/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).single();
  if (!profile?.is_platform_admin) redirect("/nodo/tasks");

  return <>{children}</>;
}
```

### Page component pattern (server-rendered with client island actions)

The page is a server component that fetches data. But approve/reject buttons need `action` handlers — they can use `<form action={serverAction}>` directly (Next.js server actions work in server components).

```tsx
// src/app/(app)/admin/membresias/page.tsx
export const dynamic = "force-dynamic";

export default async function AdminMembresiasPage() {
  const supabase = await createClient();

  // Pending count
  const { count: pendingCount } = await supabase
    .from("membership_requests")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente");

  // Roles count (placeholder — real count in M3.7)
  const pendingRolesCount = 0;

  // Pending requests with profile data
  const { data: requests } = await supabase
    .from("membership_requests")
    .select("id, mensaje, created_at, profiles(nombre, apellido, apodo, nombre_visible, avatar_url)")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* ... header, segmented tabs, request list ... */}
    </div>
  );
}
```

### Email access for RequestCard

The `profiles` table does NOT store email (email is in `auth.users`). For the admin panel, use `displayName(profile)` only — omit email or show a placeholder. A follow-up story can add email display via a secure method (admin-only RPC function, etc.).

The Pencil `email` field in RequestCard is a `text-muted` line; replace it with `displayName()` if no email is available, or fetch it via a custom query.

### Relative time formatting

Use a simple `timeAgo()` utility:

```ts
export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
}
```

### Action button implementation

Approve/reject buttons use `<form action={...}>` to trigger server actions. Since the form needs to be inside a client component (for error handling), extract the actions row into a client component:

```tsx
"use client";

import { approveRequest, rejectRequest } from "@/features/admin/actions";
import { Check } from "lucide-react";
import { useActionState } from "react";

export function RequestCardActions({ requestId }: { requestId: string }) {
  const [approveState, approveAction] = useActionState(approveRequest, null);
  const [rejectState, rejectAction] = useActionState(rejectRequest, null);

  return (
    <div className="flex gap-2.5">
      <form action={approveAction} className="flex-1">
        <input type="hidden" name="requestId" value={requestId} />
        <button type="submit" className="...">
          <Check className="size-[17px] text-on-primary" />
          <span className="...">Aprobar</span>
        </button>
      </form>
      <form action={rejectAction} className="flex-1">
        <input type="hidden" name="requestId" value={requestId} />
        <button type="submit" className="...">
          <span className="...">Rechazar</span>
        </button>
      </form>
    </div>
  );
}
```

### Server actions

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveRequest(_prevState: unknown, formData: FormData) {
  const requestId = formData.get("requestId") as string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Verify admin
  const { data: profile } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).single();
  if (!profile?.is_platform_admin) return { error: "No autorizado" };

  // Update membership request
  const { error: updateError } = await supabase
    .from("membership_requests")
    .update({ estado: "aprobada", revisado_por: user.id, actualizado_en: new Date().toISOString() })
    .eq("id", requestId);

  if (updateError) return { error: "Error al aprobar" };

  // Update profile tier
  const { data: request } = await supabase.from("membership_requests").select("profile_id, tier_solicitado").eq("id", requestId).single();
  if (request) {
    await supabase.from("profiles").update({ tier: request.tier_solicitado }).eq("id", request.profile_id);
  }

  revalidatePath("/admin/membresias");
  return { success: true };
}

// Similar for rejectRequest — sets estado = "rechazada", does NOT change tier
```

### Segmented tabs — "Roles" tab

The "Roles" tab is a **placeholder** (no-op, no link). It shows the UI element matching Pencil but has no interaction. M3.7 (ZER-30) will implement the roles confirmation page at `/admin/roles`. The count shown can be hardcoded to 0 or queried from `profile_roles`:

```ts
const { count: pendingRolesCount } = await supabase
  .from("profile_roles")
  .select("*", { count: "exact", head: true })
  .eq("confirmado", false);
```

### Category → Pencil node map

| Pencil node        | id       | Code location                            |
| ------------------ | -------- | ---------------------------------------- |
| Root frame         | `sIj6D`  | `page.tsx`                               |
| Header row         | `F6eecR` | Top bar (chevron + title)                |
| Section header     | `TZEI8`  | "Solicitudes pendientes" + badge         |
| Segmented tabs     | `p4k5E`  | Membresías/Roles switch                  |
| Request list       | `aNQ9v`  | `.map()` over requests                   |
| RequestCard (comp) | `i9N6j`  | `<RequestCard>` component                |
| Approve button     | `k7k1S`  | Aprobar form action                      |
| Reject button      | `A0E7o`  | Rechazar form action                     |

### Testing strategy

**Mock setup** follows existing patterns in `solicitar/page.test.tsx`:

```ts
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
  membershipSelect: vi.fn(),
  membershipCount: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mocks.profilesSelectSingle })),
        })),
      };
      if (table === "membership_requests") return {
        select: mocks.membershipSelect.mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn(),
          limit: vi.fn(),
        }),
      };
      return {};
    }),
  }),
}));
```

**Admin profile fixture:**

```ts
const adminProfile = {
  id: "admin-1",
  is_platform_admin: true,
  nombre: "Admin",
  apellido: "User",
  tier: "standard",
};
```

**Pending request fixture:**

```ts
const pendingRequests = [
  {
    id: "req-1",
    mensaje: "Quiero ayudar con la huerta",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    profiles: { nombre: "Sofía", apellido: "Vega", apodo: null, nombre_visible: "nombre_apellido", avatar_url: null },
  },
  {
    id: "req-2",
    mensaje: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: { nombre: "Julián", apellido: "Ríos", apodo: null, nombre_visible: "nombre_apellido", avatar_url: null },
  },
];
```

**Test cases:**

1. **Admin guard** — non-admin profile (`is_platform_admin: false`) → redirect `/nodo/tasks`
2. **Auth guard** — no user → redirect `/auth/login`
3. **Page renders with pending requests** — admin profile + 2 requests → 2 RequestCards visible
4. **Counter badge** — shows correct pending count
5. **Segmented tabs** — Membresías active, Roles inactive
6. **Empty state** — 0 pending requests → "No hay solicitudes pendientes"
7. **RequestCard** — renders name, relative time, mensaje, approve/reject buttons
8. **Approve action** — calls `approveRequest`, updates estado to `aprobada` and profile tier
9. **Reject action** — calls `rejectRequest`, updates estado to `rechazada`, does NOT change tier
10. **Admin-only actions** — non-admin calling actions returns error

### Do NOT

- **No** Historial tab implementation (just pending for now)
- **No** Roles page creation (`/admin/roles`) — that is M3.7
- **No** email fetching via auth.admin API (security risk)
- **No** changes to Avatar, TierBadge, or any DS primitive
- **No** changes to `middleware.ts` — guard at layout level
- **No** fake/stub data — use real Supabase queries
- **No** `globals.css` or `@theme` changes
- **No** TabBar changes

### Grey-box search targets (post-implementation)

Must be PRESENT:

```bash
# Admin guard
rg "is_platform_admin" src/app/\(app\)/admin/

# RequestCard component
rg "RequestCard" src/components/

# Server actions
rg "approveRequest\|rejectRequest" src/features/admin/

# Pencil tokens
rg "rounded-\[24px\]" src/components/RequestCard.tsx
rg "rounded-\[14px\]" src/app/\(app\)/admin/
rg "bg-surface-inset" src/app/\(app\)/admin/
```

### References

- Linear [ZER-28](https://linear.app/zerrant/issue/ZER-28/m35-panel-admin-cola-de-membresias-61)
- `docs/roadmap/M3 · Membresía y roles.md` — milestone scope
- `design/nodo-serrano.pen` — Pencil frame `sIj6D` (6.1 · Admin — Membresías)
- `design/nodo-serrano.pen` — RequestCard component `i9N6j`
- `supabase/migrations/20260728190000_membership_roles.sql` — DB schema
- `src/lib/supabase/database.types.ts` — TypeScript types (regenerate before development)
- `src/app/(app)/solicitar/page.tsx` — guard pattern reference
- `src/app/(app)/profile/page.tsx` — server component + data fetching pattern
- `src/features/membership/actions.test.ts` — action test patterns
- `src/app/(app)/solicitar/page.test.tsx` — page test patterns

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### Change Log

| Date       | Change                        |
| ---------- | ----------------------------- |
| 2026-07-29 | Story created — ready for dev |

### File List

- `src/app/(app)/admin/layout.tsx` (new)
- `src/app/(app)/admin/membresias/page.tsx` (new)
- `src/components/RequestCard.tsx` (new)
- `src/features/admin/actions.ts` (new)
- `src/app/(app)/admin/__tests__/membresias-page.test.tsx` (new)
- `src/components/__tests__/RequestCard.test.tsx` (new)
- `src/features/admin/__tests__/actions.test.ts` (new)
