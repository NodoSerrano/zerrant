import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProjectsPage from "./page";

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
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    "aria-label"?: string;
    role?: string;
    "aria-selected"?: boolean;
  }) => (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      role={role}
      aria-selected={ariaSelected}
    >
      {children}
    </a>
  ),
}));

vi.mock("@/components/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid={`avatar-${name}`}>{name}</div>,
}));

function createProjectsChain(projects: unknown[]) {
  const resolveData = { data: projects, error: null };
  const chain: Record<string, unknown> & { then: (cb: (v: unknown) => void) => unknown } = {
    then: (cb: (v: unknown) => void) => cb(resolveData),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };
  return chain;
}

function mockSupabase(overrides: { projects?: unknown[]; tier?: string; user?: unknown } = {}) {
  const { projects = [], tier = "serrano", user = { id: "user-1" } } = overrides;
  let projectsChain: ReturnType<typeof createProjectsChain> | null = null;

  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "projects") {
        projectsChain = createProjectsChain(projects);
        return projectsChain;
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { tier }, error: null }),
        };
      }
      return createProjectsChain([]);
    }),
    getProjectsChain: () => projectsChain,
  };
  return client;
}

async function renderPage() {
  const element = await ProjectsPage();
  return render(element);
}

describe("ProjectsPage", () => {
  it("renders Nodo header and community subtitle", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
    await renderPage();
    expect(screen.getByText("Nodo")).toBeInTheDocument();
    expect(screen.getByText("Tareas y proyectos de la comunidad")).toBeInTheDocument();
  });

  it("marks Proyectos active and keeps both halves as links", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
    await renderPage();
    expect(screen.getByRole("tab", { name: "Proyectos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Tareas" })).toHaveAttribute("href", "/nodo/tasks");
    expect(screen.getByRole("tab", { name: "Proyectos" })).toHaveAttribute(
      "href",
      "/nodo/projects",
    );
  });

  it("links Volver back to Inicio (/)", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
    await renderPage();
    const back = screen.getByRole("link", { name: "Volver a Inicio" });
    expect(back).toHaveAttribute("href", "/");
  });

  it("renders ProjectCards from mocked projects rows", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({
        projects: [
          {
            id: "p1",
            nombre: "Sitio web de Nodo",
            descripcion: "Landing y backoffice",
            estado: "en_curso",
            ingreso: "aprobacion",
            project_members: [
              {
                estado: "aprobado",
                profiles: {
                  nombre: "Ana",
                  apellido: "Diaz",
                  apodo: null,
                  nombre_visible: "Ana",
                  avatar_url: null,
                },
              },
            ],
          },
        ],
      }),
    );
    await renderPage();
    expect(screen.getByText("Sitio web de Nodo")).toBeInTheDocument();
    expect(screen.getByText("Landing y backoffice")).toBeInTheDocument();
    expect(screen.getByText("En curso")).toBeInTheDocument();
    expect(screen.getByText("Por aprobación")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sitio web de Nodo/i })).toHaveAttribute(
      "href",
      "/nodo/projects/p1",
    );
  });

  it("renders empty state copy from frame 7.3 when there are no projects", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ projects: [], tier: "serrano" }),
    );
    await renderPage();
    expect(screen.getByText("Sin proyectos todavía")).toBeInTheDocument();
    expect(
      screen.getByText("Creá el primero y sumá gente para hacerlo realidad."),
    ).toBeInTheDocument();
    expect(screen.queryByText("No hay tareas")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Crear proyecto/i })).toHaveAttribute(
      "href",
      "/nodo/projects/new",
    );
  });

  it("hides create CTA for tourists on empty state", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ projects: [], tier: "tourist" }),
    );
    await renderPage();
    expect(screen.getByText("Sin proyectos todavía")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Crear proyecto/i })).not.toBeInTheDocument();
  });

  it("shows FAB create link when serrano and list is populated", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({
        tier: "serrano",
        projects: [
          {
            id: "p1",
            nombre: "Taller",
            descripcion: null,
            estado: "idea",
            ingreso: "abierto",
            project_members: [],
          },
        ],
      }),
    );
    const { container } = await renderPage();
    const fab = container.querySelector(
      'a[href="/nodo/projects/new"][aria-label="Crear proyecto"]',
    );
    expect(fab).toBeTruthy();
  });
});
