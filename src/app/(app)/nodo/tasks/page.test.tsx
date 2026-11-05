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
    role,
    "aria-selected": ariaSelected,
    "data-testid": dataTestId,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    "aria-label"?: string;
    role?: string;
    "aria-selected"?: boolean;
    "data-testid"?: string;
  }) => (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      role={role}
      aria-selected={ariaSelected}
      data-testid={dataTestId}
    >
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
    neq: vi.fn().mockReturnThis(),
  };
  return chain;
}

function mockSupabase(overrides: { tasks?: unknown[]; tier?: string; user?: unknown } = {}) {
  const { tasks = [], tier = "serrano", user = { id: "user-1" } } = overrides;
  let tasksChain: ReturnType<typeof createTasksChain> | null = null;

  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "tasks") {
        tasksChain = createTasksChain(tasks);
        return tasksChain;
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { tier }, error: null }),
        };
      }
      return createTasksChain([]);
    }),
    getTasksChain: () => tasksChain,
  };
  return client;
}

async function renderPage(searchParams: Record<string, string> = {}) {
  const params = Promise.resolve(searchParams);
  const element = await TasksPage({ searchParams: params });
  return render(element);
}

describe("TasksPage", () => {
  describe("header and layout", () => {
    it("titles the section Proyectos y Tareas with no subtitle (ZER-206)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Proyectos y Tareas");
      expect(screen.queryByText("Nodo")).not.toBeInTheDocument();
      expect(screen.queryByText("Tareas y proyectos de la comunidad")).not.toBeInTheDocument();
    });

    it("renders segmented control with Tareas and Proyectos tabs", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      expect(screen.getByText("Tareas")).toBeInTheDocument();
      expect(screen.getByText("Proyectos")).toBeInTheDocument();
    });

    it("Proyectos tab is a real link to /nodo/projects", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      const proyectos = screen.getByRole("tab", { name: "Proyectos" });
      expect(proyectos).toHaveAttribute("href", "/nodo/projects");
      expect(proyectos).toHaveAttribute("aria-selected", "false");
    });

    it("Tareas tab is active on /nodo/tasks", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      expect(screen.getByRole("tab", { name: "Tareas" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: "Tareas" })).toHaveAttribute("href", "/nodo/tasks");
    });

    it("has no back link to Inicio: the TabBar handles navigation (ZER-206)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      expect(screen.queryByRole("link", { name: "Volver a Inicio" })).not.toBeInTheDocument();
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
              categorias: ["reparacion"],
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
              categorias: ["otro"],
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

    it("EmptyState on estado=todas links to /nodo/tasks/new when serrano", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [], tier: "serrano" }),
      );
      await renderPage({ estado: "todas" });
      const link = screen.getByRole("link", { name: /Publicar tarea/ });
      expect(link).toHaveAttribute("href", "/nodo/tasks/new");
    });

    it("EmptyState has no button when tourist on estado=todas", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [], tier: "tourist" }),
      );
      await renderPage({ estado: "todas" });
      expect(screen.getByText("No hay tareas")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Publicar/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows filter pills without Verificada", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      expect(screen.getByText("Todas")).toBeInTheDocument();
      expect(screen.getByText("Abierta")).toBeInTheDocument();
      expect(screen.getByText("Tomada")).toBeInTheDocument();
      expect(screen.getByText("Hecha")).toBeInTheDocument();
      expect(screen.getByText("Cancelada")).toBeInTheDocument();
      expect(screen.queryByText("Verificada")).not.toBeInTheDocument();
    });

    it("estado pills order Abierta · Tomada · Hecha · Cancelada; Todas is separate (ZER-225)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();

      const estadoGroup = screen.getByTestId("task-hub-filter-estado");
      const estadoLabels = Array.from(estadoGroup.querySelectorAll("a")).map((a) => a.textContent);
      expect(estadoLabels).toEqual(["Abierta", "Tomada", "Hecha", "Cancelada"]);

      const todas = screen.getByTestId("task-hub-filter-todas");
      expect(todas).toHaveTextContent("Todas");
      expect(estadoGroup.contains(todas)).toBe(false);
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

    it("marks Abierta active by default (no estado param) (ZER-225)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage();
      const abierta = screen.getByRole("link", { name: "Abierta" });
      expect(abierta.className).toContain("bg-primary");
      expect(abierta).toHaveAttribute("href", "/nodo/tasks");
      expect(screen.getByRole("link", { name: "Todas" }).className).not.toContain("bg-primary");
      expect(screen.getByRole("link", { name: "Todas" })).toHaveAttribute(
        "href",
        "/nodo/tasks?estado=todas",
      );
    });

    it("marks Todas active when estado=todas", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage({ estado: "todas" });
      const todas = screen.getByRole("link", { name: "Todas" });
      expect(todas.className).toContain("bg-primary");
      expect(screen.getByRole("link", { name: "Abierta" }).className).not.toContain("bg-primary");
    });

    it("marks Abierta active when estado=abierta", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
      await renderPage({ estado: "abierta" });
      expect(screen.getByRole("link", { name: "Abierta" }).className).toContain("bg-primary");
      expect(screen.getByRole("link", { name: "Todas" }).className).not.toContain("bg-primary");
    });

    it("empty + concrete filter (incl. default abierta): no Publicar CTA and no FAB (ZER-209)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [], tier: "serrano" }),
      );
      const { container } = await renderPage();
      expect(screen.getByText("No hay tareas")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Publicar tarea/ })).not.toBeInTheDocument();
      expect(container.querySelector('a[aria-label="Crear tarea"]')).toBeNull();
      expect(screen.getByText(/No hay tareas con este estado/)).toBeInTheDocument();
    });

    it("empty + estado=todas: serrano gets Publicar tarea and FAB (ZER-62/209)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [], tier: "serrano" }),
      );
      const { container } = await renderPage({ estado: "todas" });
      expect(screen.getByRole("link", { name: /Publicar tarea/ })).toHaveAttribute(
        "href",
        "/nodo/tasks/new",
      );
      expect(container.querySelector('a[aria-label="Crear tarea"]')).toBeTruthy();
    });
  });

  describe("estado query filter", () => {
    it("default (no searchParams) uses eq abierta (ZER-225)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const client = mockSupabase();
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      await renderPage();

      const chain = client.getTasksChain();
      expect(chain?.eq).toHaveBeenCalledWith("estado", "abierta");
      expect(chain?.neq).not.toHaveBeenCalled();
    });

    it("estado=todas excludes cancelada via neq (ZER-62)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const client = mockSupabase();
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      await renderPage({ estado: "todas" });

      const chain = client.getTasksChain();
      expect(chain?.neq).toHaveBeenCalledWith("estado", "cancelada");
      expect(chain?.eq).not.toHaveBeenCalledWith("estado", expect.anything());
    });

    it("estado=abierta uses eq and does not neq cancelada", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const client = mockSupabase();
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      await renderPage({ estado: "abierta" });

      const chain = client.getTasksChain();
      expect(chain?.eq).toHaveBeenCalledWith("estado", "abierta");
      expect(chain?.neq).not.toHaveBeenCalled();
    });

    it("estado=cancelada uses eq for cancelada", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const client = mockSupabase();
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      await renderPage({ estado: "cancelada" });

      const chain = client.getTasksChain();
      expect(chain?.eq).toHaveBeenCalledWith("estado", "cancelada");
      expect(chain?.neq).not.toHaveBeenCalled();
    });

    it("legacy estado=verificada falls back to abierta (ZER-225)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const client = mockSupabase();
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);
      await renderPage({ estado: "verificada" });

      const chain = client.getTasksChain();
      expect(chain?.eq).toHaveBeenCalledWith("estado", "abierta");
      expect(chain?.eq).not.toHaveBeenCalledWith("estado", "verificada");
      expect(chain?.neq).not.toHaveBeenCalled();
      expect(screen.queryByText("Verificada")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Abierta" }).className).toContain("bg-primary");
    });
  });

  // The `categorias` column stores enum values, lowercase and unaccented.
  // If the hub passes it raw to TaskCard, the card prints "reparacion" and
  // finds no icon, because its index is keyed by the Spanish label.
  describe("categoria display", () => {
    function taskWithCategoria(categoria: string) {
      return {
        id: "task-1",
        titulo: "Arreglar el caño",
        categorias: [categoria],
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

  describe("several categories (ZER-208)", () => {
    function taskWith(categorias: string[], categoria_otra: string | null = null) {
      return {
        id: "task-1",
        titulo: "Arreglar el caño",
        categorias,
        categoria_otra,
        estado: "abierta",
        urgencia: "alta",
        created_at: "2026-07-27T12:00:00Z",
        creado_por: "user-1",
        profiles: { nombre: "Juan", apellido: "Perez", apodo: null, nombre_visible: "Juan" },
      };
    }

    it("lists every category on the card, with the first one's icon", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [taskWith(["limpieza", "compra"])] }),
      );

      const { container } = await renderPage();

      expect(screen.getByText(/Limpieza, Compra ·/)).toBeInTheDocument();
      const icons = Array.from(container.querySelectorAll("svg")).map((s) =>
        s.getAttribute("class"),
      );
      expect(icons.some((c) => c?.includes("lucide-spray-can"))).toBe(true);
    });

    it("shows the Otro text instead of Otro", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({ tasks: [taskWith(["reparacion", "otro"], "Jardinería")] }),
      );

      await renderPage();

      expect(screen.getByText(/Reparación, Jardinería ·/)).toBeInTheDocument();
    });
  });

  describe("estado mapping robustness", () => {
    // The Postgres `task_estado` enum can grow. If the hub translates states
    // with a partial lookup, any new value reaches TaskCard as `undefined`
    // and the whole screen crashes reading `estadoData.bg`. The list has to
    // degrade, not fall over.
    function taskWithEstado(estado: unknown) {
      return {
        id: "task-1",
        titulo: "Tarea con estado nuevo",
        categorias: ["reparacion"],
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

    const TAKER_ID = "11111111-1111-4111-8111-111111111111";

    it("shows the taker display name and not the profile id", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const client = mockSupabase({
        tasks: [
          {
            id: "task-1",
            titulo: "Arreglar cerca",
            categorias: ["reparacion"],
            estado: "tomada",
            urgencia: "media",
            created_at: "2026-07-27T12:00:00Z",
            creado_por: "user-1",
            tomada_por: TAKER_ID,
            profiles: {
              nombre: "Juan",
              apellido: "Perez",
              apodo: null,
              nombre_visible: "nombre_apellido",
            },
            tomador: {
              nombre: "Ana",
              apellido: "Sosa",
              apodo: null,
              nombre_visible: "nombre_apellido",
            },
          },
        ],
      });
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);

      await renderPage();

      expect(screen.getByText("Tomada por Ana Sosa")).toBeInTheDocument();
      expect(screen.queryByText(TAKER_ID)).not.toBeInTheDocument();
      expect(client.getTasksChain()?.select).toHaveBeenCalledWith(
        expect.stringContaining("tomador:tomada_por(nombre, apellido, apodo, nombre_visible)"),
      );
    });

    it("does not print a profile id when a taken task has no taker profile", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({
          tasks: [
            {
              id: "task-1",
              titulo: "Arreglar cerca",
              categorias: ["reparacion"],
              estado: "tomada",
              urgencia: "media",
              created_at: "2026-07-27T12:00:00Z",
              creado_por: "user-1",
              tomada_por: TAKER_ID,
              tomador: null,
              profiles: {
                nombre: "Juan",
                apellido: "Perez",
                apodo: null,
                nombre_visible: "nombre_apellido",
              },
            },
          ],
        }),
      );

      await renderPage();

      expect(screen.queryByText(TAKER_ID)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tomada por/)).not.toBeInTheDocument();
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
    it("shows FAB when serrano has tasks (non-empty list)", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase({
          tier: "serrano",
          tasks: [
            {
              id: "task-1",
              titulo: "Arreglar cerca",
              categorias: ["reparacion"],
              estado: "abierta",
              urgencia: "alta",
              created_at: "2026-07-27T12:00:00Z",
              creado_por: "user-1",
              profiles: { nombre: "Juan", apellido: "Perez", apodo: null, nombre_visible: "Juan" },
            },
          ],
        }),
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
