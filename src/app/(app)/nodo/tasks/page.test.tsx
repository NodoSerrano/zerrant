import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TasksPage from "./page";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    "aria-label": ariaLabel,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
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

    it("Proyectos tab is a span not a link (placeholder)", async () => {
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
              categoria: "Reparacion",
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

    it("EmptyState link points to /nodo/tasks/new when serrano", async () => {
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
      expect(screen.getByText("Cancelada")).toBeInTheDocument();
    });

    it("the Cancelada pill filters by that estado", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      const { container } = await renderPage();

      const pill = Array.from(container.querySelectorAll("a")).find(
        (a) => a.textContent === "Cancelada",
      );
      expect(pill).toHaveAttribute("href", "/nodo/tasks?estado=cancelada");
    });
  });

  // La columna `categoria` guarda el valor del enum, en minúscula y sin tilde.
  // Si el hub se lo pasa crudo a TaskCard, la tarjeta imprime "reparacion" y no
  // encuentra el ícono, porque su índice está en castellano.
  describe("categoria display", () => {
    function taskWithCategoria(categoria: string) {
      return {
        id: "task-1",
        titulo: "Arreglar el caño",
        categoria,
        estado: "abierta",
        urgencia: "alta",
        created_at: "2026-07-27T12:00:00Z",
        creado_por: "user-1",
        profiles: { nombre: "Juan", apellido: "Perez", apodo: null, nombre_visible: "Juan" },
      };
    }

    it("shows the Spanish label, not the raw enum value", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [taskWithCategoria("reparacion")] }),
      );

      await renderPage();

      expect(screen.getByText(/Reparación ·/)).toBeInTheDocument();
      expect(screen.queryByText(/reparacion ·/)).not.toBeInTheDocument();
    });

    it("renders the icon that matches the categoria", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [taskWithCategoria("limpieza")] }),
      );

      const { container } = await renderPage();

      const icons = Array.from(container.querySelectorAll("svg")).map((s) =>
        s.getAttribute("class"),
      );
      expect(icons.some((c) => c?.includes("lucide-spray-can"))).toBe(true);
    });
  });

  describe("estado mapping robustness", () => {
    // El enum `task_estado` de Postgres puede crecer. Si el hub traduce estados
    // con un lookup parcial, cualquier valor nuevo llega como `undefined` a
    // TaskCard y la pantalla entera revienta al leer `estadoData.bg`. La lista
    // tiene que degradar, no caerse.
    function taskWithEstado(estado: unknown) {
      return {
        id: "task-1",
        titulo: "Tarea con estado nuevo",
        categoria: "reparacion",
        estado,
        urgencia: "alta",
        created_at: "2026-07-27T12:00:00Z",
        creado_por: "user-1",
        profiles: { nombre: "Juan", apellido: "Perez", apodo: null, nombre_visible: "Juan" },
      };
    }

    it("renders a task whose estado is not in the map instead of crashing", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [taskWithEstado("un-estado-que-todavia-no-existe")] }),
      );

      await renderPage();

      expect(screen.getByText("Tarea con estado nuevo")).toBeInTheDocument();
    });

    it("falls back to the 'Abierta' badge for an unmapped estado", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [taskWithEstado("un-estado-que-todavia-no-existe")] }),
      );

      await renderPage();

      const badge = screen.getByText("Abierta", { selector: "span" });
      expect(badge.className).toContain("bg-blue-raw/20");
    });

    it("shows a cancelled task with its own badge, not as 'Abierta'", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [taskWithEstado("cancelada")] }),
      );

      await renderPage();

      const badge = screen.getByText("Cancelada", { selector: "span" });
      expect(badge.className).toContain("bg-surface-inset");
    });

    it("renders a task with a null estado instead of crashing", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [taskWithEstado(null)] }),
      );

      await renderPage();

      expect(screen.getByText("Tarea con estado nuevo")).toBeInTheDocument();
    });
  });

  describe("auth and permissions", () => {
    it("shows FAB when user is serrano", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tier: "serrano" }),
      );
      const { container } = await renderPage();
      const fabLink = container.querySelector(
        'a[href="/nodo/tasks/new"][aria-label="Crear tarea"]',
      );
      expect(fabLink).toBeTruthy();
    });

    it("hides FAB when user is tourist", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tier: "tourist" }),
      );
      const { container } = await renderPage();
      const fabLink = container.querySelector('a[aria-label="Crear tarea"]');
      expect(fabLink).toBeNull();
    });

    it("shows login prompt when no user", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase({ user: null }));
      await renderPage();
      expect(screen.getByText(/Iniciá sesión/)).toBeInTheDocument();
    });
  });
});
