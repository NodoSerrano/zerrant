# 4.3 Nodo Tasks Hub (ZER-20) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `/nodo/tasks` hub using TaskCard and EmptyState components with segmented control header and FAB.

**Architecture:** Add optional `href` prop to TaskCard for link-mode rendering. Create `relativeTime` utility for Spanish time-ago strings. Rewrite the hub server component to compose TaskCards + EmptyState + segmented control + FAB.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase, Tailwind CSS 4, Vitest + Testing Library, lucide-react

## Global Constraints

- All user-facing UI strings in Spanish (as in Pencil)
- Code identifiers in English
- TDD: write failing test first, then implementation
- Vitest + Testing Library for all tests
- `pnpm test` must pass before claiming done
- Production-ready: no intentional tech debt
- Pencil is SSOT; do not invent alternate layouts
- Follow existing code conventions (cn() for className merging, barrel exports)
- Branch base: `estudionomade2025/zer-18-41-taskcard-component`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/TaskCard.tsx` | Modify | Add optional `href` prop for link-mode |
| `src/components/TaskCard.test.tsx` | Modify | Add href-mode test cases |
| `src/components/EmptyState.tsx` | Modify | Add optional `href` prop for link-mode |
| `src/components/EmptyState.test.tsx` | Modify | Add href-mode test cases |
| `src/lib/time.ts` | Create | `relativeTime(date: string): string` utility |
| `src/lib/time.test.ts` | Create | Tests for relativeTime |
| `src/app/(app)/nodo/tasks/page.tsx` | Rewrite | Hub: TaskCards, EmptyState, segmented, FAB |
| `src/app/(app)/nodo/tasks/page.test.tsx` | Create | Integration tests for hub page |

---

### Task 1: TaskCard `href` prop — tests first

**Files:**
- Modify: `src/components/TaskCard.test.tsx`
- Modify: `src/components/TaskCard.tsx`

**Interfaces:**
- Consumes: existing TaskCard props
- Produces: `href?: string` — optional prop; when set, card wraps in `<Link>`, action button becomes non-interactive `<span>`

- [ ] **Step 1: Add href-mode test cases to TaskCard.test.tsx**

```tsx
// Add these imports at the top of src/components/TaskCard.test.tsx
import Link from "next/link";

// Mock next/link to render a real <a> tag for assertions
vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Add these tests inside the existing describe("TaskCard", () => { ... }) block:

describe("href mode", () => {
  const hrefProps = {
    ...defaultProps,
    href: "/nodo/tasks/abc-123",
  };

  it("renders card as <a> when href is set", () => {
    const { container } = render(<TaskCard {...hrefProps} />);
    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/nodo/tasks/abc-123");
  });

  it("does not render <button> for action when href is set", () => {
    render(<TaskCard {...hrefProps} />);
    // actionLabel text is still rendered but inside <span>, not <button>
    expect(screen.getByText("Tomar")).toBeInTheDocument();
    expect(screen.getByText("Tomar").tagName).toBe("SPAN");
  });

  it("renders as <div> when href is not set (backward compat)", () => {
    const { container } = render(<TaskCard {...defaultProps} />);
    expect(container.querySelector("a")).not.toBeInTheDocument();
    expect(container.firstElementChild?.tagName).toBe("DIV");
  });

  it("action button is <button> when href is not set", () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText("Tomar").tagName).toBe("BUTTON");
  });

  it("merges className on Link wrapper", () => {
    const { container } = render(<TaskCard {...hrefProps} className="my-custom" />);
    const link = container.querySelector("a");
    expect(link).toHaveClass("my-custom");
    expect(link).toHaveClass("rounded-[20px]");
    expect(link).toHaveClass("bg-surface");
  });

  it("preserves card styling classes on link wrapper", () => {
    const { container } = render(<TaskCard {...hrefProps} />);
    const link = container.querySelector("a")!;
    expect(link).toHaveClass("rounded-[20px]");
    expect(link).toHaveClass("bg-surface");
    expect(link).toHaveClass("border");
    expect(link).toHaveClass("p-4");
    expect(link).toHaveClass("gap-3");
    expect(link).toHaveClass("flex");
    expect(link).toHaveClass("flex-col");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/TaskCard.test.tsx
```
Expected: href-mode tests fail because `href` prop doesn't exist yet / rendering is not implemented.

- [ ] **Step 3: Implement `href` prop in TaskCard.tsx**

Replace the component implementation:

```tsx
import { Flame, MoreHorizontal, Settings, ShoppingCart, SprayCan, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  href?: string;
  title: string;
  category: string;
  timeAgo: string;
  estado: "abierta" | "tomada" | "hecha";
  urgencia: "alta" | "media" | "baja";
  actionLabel: string;
  onAction?: () => void;
  className?: string;
}

const categoryIcons: Record<string, LucideIcon> = {
  Reparación: Wrench,
  Limpieza: SprayCan,
  Compra: ShoppingCart,
  Mantenimiento: Settings,
  Otro: MoreHorizontal,
};

const estadoConfig = {
  abierta: { label: "Abierta", bg: "bg-blue-raw/20", text: "text-brand-blue" },
  tomada: { label: "Tomada", bg: "bg-coral/20", text: "text-coral" },
  hecha: { label: "Hecha", bg: "bg-mint-raw/20", text: "text-brand-mint" },
} as const;

const urgenciaConfig = {
  alta: { label: "Urgencia alta", color: "text-warm-orange" },
  media: { label: "Urgencia media", color: "text-warm-yellow" },
  baja: { label: "Urgencia baja", color: "text-text-muted" },
} as const;

const getCategoryIcon = (category: string): LucideIcon => {
  return categoryIcons[category] ?? MoreHorizontal;
};

export function TaskCard({
  href,
  title,
  category,
  timeAgo,
  estado,
  urgencia,
  actionLabel,
  onAction,
  className,
}: TaskCardProps) {
  const Icon = getCategoryIcon(category);
  const estadoData = estadoConfig[estado];
  const urgenciaData = urgenciaConfig[urgencia];

  const baseClasses = cn(
    "rounded-[20px] bg-surface border border-border shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)] p-4 flex flex-col gap-3 w-full",
    className,
  );

  const content = (
    <>
      <div className="flex items-center gap-3 w-full">
        <div className="size-10 rounded-xl bg-warm-yellow/[0.09] flex items-center justify-center shrink-0">
          <Icon size={18} className="text-warm-orange" />
        </div>
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <span className="font-display text-[15px] font-medium text-text-primary truncate">
            {title}
          </span>
          <span className="font-body text-xs font-normal text-text-muted">
            {category} · {timeAgo}
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-pill px-[11px] py-[5px] font-display text-xs font-semibold",
            estadoData.bg,
            estadoData.text,
          )}
        >
          {estadoData.label}
        </span>
      </div>
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-[5px]">
          <Flame size={14} className={urgenciaData.color} />
          <span className={cn("font-body text-xs font-normal", urgenciaData.color)}>
            {urgenciaData.label}
          </span>
        </div>
        {href ? (
          <span className="shrink-0 rounded-pill bg-surface-inset border border-border px-4 py-[7px] font-display text-[13px] font-semibold text-brand-green">
            {actionLabel}
          </span>
        ) : (
          <button
            type="button"
            className="shrink-0 rounded-pill bg-surface-inset border border-border px-4 py-[7px] font-display text-[13px] font-semibold text-brand-green"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/TaskCard.test.tsx
```
Expected: all tests pass (including existing ones + new href-mode tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/TaskCard.tsx src/components/TaskCard.test.tsx
git commit -m "feat: add optional href prop to TaskCard for link-mode rendering"
```

---

### Task 1b: EmptyState `href` prop — TDD

**Files:**
- Modify: `src/components/EmptyState.test.tsx`
- Modify: `src/components/EmptyState.tsx`

**Interfaces:**
- Consumes: existing EmptyState props
- Produces: `href?: string` — optional prop; when set, action button becomes `<Link>`, no `onAction` needed

- [ ] **Step 1: Add href-mode test cases to EmptyState.test.tsx**

```tsx
import Link from "next/link";  // add import
// Add vi.mock for next/link (same as TaskCard):
vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Add inside describe("EmptyState"):
describe("href mode", () => {
  it("action button is a link when href is set", () => {
    render(<EmptyState subtitle="test" href="/nodo/tasks/new" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/nodo/tasks/new");
  });

  it("does not render action button when no href and no onAction", () => {
    render(<EmptyState subtitle="test" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders button when onAction is provided (backward compat)", () => {
    const onAction = vi.fn();
    render(<EmptyState subtitle="test" onAction={onAction} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/EmptyState.test.tsx
```
Expected: href-mode tests fail.

- [ ] **Step 3: Implement `href` prop in EmptyState.tsx**

```tsx
import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  subtitle: string;
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  subtitle,
  href,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const hasAction = !!(href || (actionLabel && onAction));

  return (
    <div className={cn("flex flex-col items-center gap-[18px] py-5 px-5 pb-[90px]", className)}>
      <div className="size-24 rounded-full bg-surface-inset flex items-center justify-center">
        <ClipboardList className="size-10 text-text-muted" />
      </div>

      <div className="flex flex-col items-center gap-2 w-full">
        <h2 className="font-display text-[20px] font-bold text-text-primary">No hay tareas</h2>
        <p className="font-body text-sm text-text-secondary leading-relaxed text-center">
          {subtitle}
        </p>
      </div>

      {href ? (
        <Link
          href={href}
          className={cn(
            "flex items-center justify-center gap-2 rounded-pill h-12 px-[22px]",
            "bg-linear-to-br from-brand-green to-brand-blue",
            "font-display text-[15px] font-medium text-on-primary",
          )}
        >
          <Plus className="size-[18px] text-on-primary" />
          {actionLabel ?? "Publicar tarea"}
        </Link>
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            "flex items-center justify-center gap-2 rounded-pill h-12 px-[22px]",
            "bg-linear-to-br from-brand-green to-brand-blue",
            "font-display text-[15px] font-medium text-on-primary",
          )}
        >
          <Plus className="size-[18px] text-on-primary" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
```

Key changes:
- `href?: string` added to props
- `actionLabel` default removed (`undefined` instead of `"Publicar tarea"`)
- Button now conditionally rendered based on `href` or `(actionLabel && onAction)`

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/EmptyState.test.tsx
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/EmptyState.tsx src/components/EmptyState.test.tsx
git commit -m "feat: add optional href prop to EmptyState for server-component usage"
```

---

### Task 2: `relativeTime` utility — TDD

**Files:**
- Create: `src/lib/time.ts`
- Create: `src/lib/time.test.ts`

**Interfaces:**
- Produces: `relativeTime(date: string): string` — returns Spanish relative time string

- [ ] **Step 1: Write failing tests**

Create `src/lib/time.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { relativeTime } from "./time";

describe("relativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'ahora' for less than a minute ago", () => {
    expect(relativeTime("2026-07-28T11:59:30Z")).toBe("ahora");
  });

  it("returns 'hace 1 min' for one minute ago", () => {
    expect(relativeTime("2026-07-28T11:59:00Z")).toBe("hace 1 min");
  });

  it("returns 'hace 5 min' for five minutes ago", () => {
    expect(relativeTime("2026-07-28T11:55:00Z")).toBe("hace 5 min");
  });

  it("returns 'hace 1 hora' for 61 minutes ago", () => {
    expect(relativeTime("2026-07-28T10:59:00Z")).toBe("hace 1 hora");
  });

  it("returns 'hace 3 horas' for three hours ago", () => {
    expect(relativeTime("2026-07-28T09:00:00Z")).toBe("hace 3 horas");
  });

  it("returns 'hace 1 día' for 25 hours ago", () => {
    expect(relativeTime("2026-07-27T11:00:00Z")).toBe("hace 1 día");
  });

  it("returns 'hace 5 días' for five days ago", () => {
    expect(relativeTime("2026-07-23T12:00:00Z")).toBe("hace 5 días");
  });

  it("returns 'hace 1 mes' for 35 days ago", () => {
    expect(relativeTime("2026-06-23T12:00:00Z")).toBe("hace 1 mes");
  });

  it("returns 'hace 3 meses' for three months ago", () => {
    expect(relativeTime("2026-04-28T12:00:00Z")).toBe("hace 3 meses");
  });

  it("returns 'hace 1 año' for 400 days ago", () => {
    expect(relativeTime("2025-06-23T12:00:00Z")).toBe("hace 1 año");
  });

  it("returns 'hace 2 años' for two years ago", () => {
    expect(relativeTime("2024-07-28T12:00:00Z")).toBe("hace 2 años");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/time.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement relativeTime**

Create `src/lib/time.ts`:

```ts
export function relativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "ahora";
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  if (diffDays < 30) return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  if (diffDays < 365) {
    const meses = Math.floor(diffDays / 30);
    return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  }
  const años = Math.floor(diffDays / 365);
  return `hace ${años} ${años === 1 ? "año" : "años"}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/time.test.ts
```
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/time.ts src/lib/time.test.ts
git commit -m "feat: add relativeTime utility for Spanish time-ago formatting"
```

---

### Task 3: Hub page — TDD

**Files:**
- Create: `src/app/(app)/nodo/tasks/page.test.tsx`
- Rewrite: `src/app/(app)/nodo/tasks/page.tsx`

**Interfaces:**
- Consumes: `TaskCard` (with `href` prop), `EmptyState`, `relativeTime` utility, `createClient` from `@/lib/supabase/server`
- Page signature: `export default async function TasksPage({ searchParams }: { searchParams: Promise<{ estado?: string }> })`

- [ ] **Step 1: Write failing tests for hub page**

Create `src/app/(app)/nodo/tasks/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TasksPage from "./page";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function createTasksChain(tasks: unknown[]) {
  const resolveData = { data: tasks, error: null };
  const chain: Record<string, unknown> & { then: (cb: (v: unknown) => void) => unknown } = {
    then: (cb: (v: unknown) => void) => cb(resolveData),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };
  return chain;
}

function mockSupabase(overrides: { tasks?: unknown[]; tier?: string; user?: unknown } = {}) {
  const { tasks = [], tier = "serrano", user = { id: "user-1" } } = overrides;

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "tasks") return createTasksChain(tasks);
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { tier }, error: null }),
        };
      }
      return createTasksChain([]);
    }),
  };
}

async function renderPage(searchParams: Record<string, string> = {}) {
  const params = Promise.resolve(searchParams);
  const element = await TasksPage({ searchParams: params });
  return render(element);
}

describe("TasksPage", () => {
  describe("header and layout", () => {
    it("renders 'Nodo' header", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      expect(screen.getByText("Nodo")).toBeInTheDocument();
    });

    it("renders segmented control with Tareas and Proyectos tabs", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      expect(screen.getByText("Tareas")).toBeInTheDocument();
      expect(screen.getByText("Proyectos")).toBeInTheDocument();
    });

    it("Proyectos tab is not a link (placeholder)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      const { container } = await renderPage();
      const links = container.querySelectorAll("a");
      const proyectosLink = Array.from(links).find((l) => l.textContent === "Proyectos");
      expect(proyectosLink).toBeUndefined();
    });
  });

  describe("tasks list", () => {
    it("renders TaskCards when tasks exist", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({
          tasks: [
            {
              id: "task-1",
              titulo: "Arreglar cerca",
              categoria: "Reparación",
              estado: "abierta",
              urgencia: "alta",
              created_at: "2026-07-27T12:00:00Z",
              creado_por: "user-1",
              profiles: { nombre: "Juan", apellido: "Perez", apodo: null, nombre_visible: "Juan" },
            },
          ],
        }),
      );
      await renderPage();
      expect(screen.getByText("Arreglar cerca")).toBeInTheDocument();
    });

    it("TaskCard links to task detail page", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({
          tasks: [
            {
              id: "task-1",
              titulo: "Test",
              categoria: "Otro",
              estado: "abierta",
              urgencia: "baja",
              created_at: "2026-07-28T12:00:00Z",
              creado_por: "user-1",
              profiles: { nombre: "X", apellido: "Y", apodo: null, nombre_visible: "X" },
            },
          ],
        }),
      );
      const { container } = await renderPage();
      const links = container.querySelectorAll("a");
      const taskLink = Array.from(links).find((l) =>
        l.getAttribute("href")?.startsWith("/nodo/tasks/task-1"),
      );
      expect(taskLink).toBeTruthy();
    });

    it("renders EmptyState when no tasks exist", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [], tier: "serrano" }),
      );
      await renderPage();
      expect(screen.getByText("No hay tareas")).toBeInTheDocument();
    });

    it("EmptyState button links to create task when serrano", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [], tier: "serrano" }),
      );
      await renderPage();
      const link = screen.getByRole("link", { name: /Publicar tarea/ });
      expect(link).toHaveAttribute("href", "/nodo/tasks/new");
    });

    it("EmptyState has no button when tourist", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [], tier: "tourist" }),
      );
      await renderPage();
      expect(screen.getByText("No hay tareas")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Publicar/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows filter pills", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      expect(screen.getByText("Todas")).toBeInTheDocument();
      expect(screen.getByText("Abierta")).toBeInTheDocument();
      expect(screen.getByText("Tomada")).toBeInTheDocument();
      expect(screen.getByText("Hecha")).toBeInTheDocument();
      expect(screen.getByText("Verificada")).toBeInTheDocument();
    });
  });

  describe("auth and permissions", () => {
    it("shows FAB when user is serrano", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tier: "serrano" }),
      );
      const { container } = await renderPage();
      const fabLink = container.querySelector('a[href="/nodo/tasks/new"]');
      expect(fabLink).toBeTruthy();
    });

    it("hides FAB when user is tourist", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tier: "tourist" }),
      );
      const { container } = await renderPage();
      const fabLink = container.querySelector('a[href="/nodo/tasks/new"]');
      expect(fabLink).toBeNull();
    });

    it("shows login prompt when no user", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ user: null }),
      );
      await renderPage();
      expect(screen.getByText(/Iniciá sesión/)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/app/\(app\)/nodo/tasks/page.test.tsx
```
Expected: some tests fail because the page still has the old implementation.

- [ ] **Step 3: Rewrite the hub page**

Replace `src/app/(app)/nodo/tasks/page.tsx`:

```tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/time";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import type { TaskEstado } from "@/features/tasks/types";

const ESTADO_LABELS: Record<string, string> = {
  abierta: "Abierta",
  tomada: "Tomada",
  hecha: "Hecha",
  verificada: "Verificada",
};

const ESTADO_MAP: Record<string, "abierta" | "tomada" | "hecha"> = {
  abierta: "abierta",
  tomada: "tomada",
  hecha: "hecha",
  verificada: "hecha",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <p className="text-text-secondary p-5">Iniciá sesión para ver las tareas.</p>;

  const { estado } = await searchParams;

  let query = supabase
    .from("tasks")
    .select("*, profiles:creado_por(nombre, apellido, apodo, nombre_visible)")
    .order("created_at", { ascending: false });

  if (estado && estado !== "todas") {
    query = query.eq("estado", estado as TaskEstado);
  }

  const { data: tasks } = await query;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const canCreate = profile && profile.tier !== "tourist";

  const filtros = ["todas", "abierta", "tomada", "hecha", "verificada"];

  return (
    <div className="flex flex-col gap-5 relative">
      <h1 className="font-display text-2xl font-bold text-text-primary">Nodo</h1>

      <div className="flex rounded-pill bg-surface p-0.5 border border-border">
        <span className="flex-1 text-center py-2 font-display text-sm font-semibold bg-primary text-on-primary rounded-pill">
          Tareas
        </span>
        <span className="flex-1 text-center py-2 font-display text-sm font-medium text-text-muted">
          Proyectos
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filtros.map((f) => (
          <Link
            key={f}
            href={f === "todas" ? "/nodo/tasks" : `/nodo/tasks?estado=${f}`}
            className={cn(
              "inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-semibold font-display whitespace-nowrap transition-colors",
              (f === "todas" && !estado) || estado === f
                ? "bg-primary text-on-primary"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary",
            )}
          >
            {f === "todas" ? "Todas" : ESTADO_LABELS[f]}
          </Link>
        ))}
      </div>

      {!tasks || tasks.length === 0 ? (
        <EmptyState
          href={canCreate ? "/nodo/tasks/new" : undefined}
          subtitle={
            canCreate
              ? "Parece que todavia no hay tareas publicadas. Queres crear la primera?"
              : "Parece que todavia no hay tareas publicadas."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              href={`/nodo/tasks/${task.id}`}
              title={task.titulo}
              category={task.categoria}
              timeAgo={relativeTime(task.created_at)}
              estado={ESTADO_MAP[task.estado ?? "abierta"]}
              urgencia={task.urgencia ?? "media"}
              actionLabel="Tomar"
            />
          ))}
        </div>
      )}

      {canCreate && (
        <Link
          href="/nodo/tasks/new"
          className={cn(
            "fixed bottom-24 right-5 z-40",
            "size-14 rounded-full",
            "bg-linear-to-br from-brand-green to-brand-blue",
            "shadow-[0_4px_14px_rgba(26,22,20,0.25)]",
            "flex items-center justify-center",
            "active:scale-95 transition-transform",
          )}
          aria-label="Crear tarea"
        >
          <Plus className="size-6 text-on-primary" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/app/\(app\)/nodo/tasks/page.test.tsx
```
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/nodo/tasks/page.tsx src/app/\(app\)/nodo/tasks/page.test.tsx
git commit -m "feat: rewrite nodo tasks hub with TaskCards, EmptyState, segmented control, and FAB"
```

---

### Task 4: Run full test suite and linter

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```
Expected: all tests pass.

- [ ] **Step 2: Run linter**

```bash
pnpm lint
```
Expected: no errors.

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Verify the branch and commit history**

```bash
git log --oneline -5
```
