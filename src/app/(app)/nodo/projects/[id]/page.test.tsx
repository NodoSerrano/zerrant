import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
  notFound: () => notFound(),
}));

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

vi.mock("@/components/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid={`avatar-${name}`}>{name}</div>,
}));

import { createClient } from "@/lib/supabase/server";
import ProjectDetailPage from "./page";

function mockClient({
  user = { id: "viewer-1" } as { id: string } | null,
  project = null as unknown,
  viewerMembership = null as unknown,
} = {}) {
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: project, error: null }),
        };
      }
      if (table === "project_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: viewerMembership, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
  vi.mocked(createClient).mockResolvedValue(client as never);
  return client;
}

const sampleProject = {
  id: "proj-1",
  nombre: "Sitio web de Nodo",
  descripcion: "Landing y backoffice de la comunidad.",
  estado: "en_curso",
  ingreso: "aprobacion",
  creado_por: "u1",
  project_members: [
    {
      profile_id: "u1",
      estado: "aprobado",
      rol: "admin",
      profiles: {
        id: "u1",
        nombre: "Nóbel",
        apellido: "Dam",
        apodo: null,
        nombre_visible: "nombre_apellido",
        avatar_url: null,
      },
    },
    {
      profile_id: "u2",
      estado: "pendiente",
      rol: "miembro",
      profiles: {
        id: "u2",
        nombre: "Pending",
        apellido: "User",
        apodo: null,
        nombre_visible: "nombre_apellido",
        avatar_url: null,
      },
    },
    {
      profile_id: "u3",
      estado: "aprobado",
      rol: "miembro",
      profiles: {
        id: "u3",
        nombre: "Lucía",
        apellido: "Morales",
        apodo: null,
        nombre_visible: "nombre_apellido",
        avatar_url: null,
      },
    },
  ],
};

describe("ProjectDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated viewers to login", async () => {
    mockClient({ user: null });
    await expect(ProjectDetailPage({ params: Promise.resolve({ id: "proj-1" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/auth/login",
    );
  });

  it("calls notFound when the project is missing", async () => {
    mockClient({ project: null });
    await expect(ProjectDetailPage({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("renders approved members only and the aprobacion join affordance for outsiders", async () => {
    mockClient({ project: sampleProject, viewerMembership: null });
    const ui = await ProjectDetailPage({ params: Promise.resolve({ id: "proj-1" }) });
    render(ui);

    expect(screen.getByRole("heading", { name: "Sitio web de Nodo" })).toBeInTheDocument();
    expect(screen.getAllByText("Nóbel Dam").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lucía Morales").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pending User")).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Solicitar ingreso" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Solicitudes de ingreso" })).not.toBeInTheDocument();
  });

  it("shows Unirse when ingreso is abierto and the viewer is not a member", async () => {
    mockClient({
      project: { ...sampleProject, ingreso: "abierto" },
      viewerMembership: null,
    });
    const ui = await ProjectDetailPage({ params: Promise.resolve({ id: "proj-1" }) });
    render(ui);
    expect(screen.getByRole("button", { name: "Unirse" })).toBeInTheDocument();
  });

  it("shows pending state without a join CTA", async () => {
    mockClient({
      project: sampleProject,
      viewerMembership: { estado: "pendiente", rol: "miembro" },
    });
    const ui = await ProjectDetailPage({ params: Promise.resolve({ id: "proj-1" }) });
    render(ui);
    expect(screen.getByText("Solicitud pendiente")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar ingreso" })).not.toBeInTheDocument();
  });

  it("hides join CTA for approved members and shows queue for project admins", async () => {
    mockClient({
      project: sampleProject,
      viewerMembership: { estado: "aprobado", rol: "admin" },
    });
    const ui = await ProjectDetailPage({ params: Promise.resolve({ id: "proj-1" }) });
    render(ui);
    expect(screen.queryByRole("button", { name: "Solicitar ingreso" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Solicitudes de ingreso" })).toHaveAttribute(
      "href",
      "/nodo/projects/proj-1/requests",
    );
    // ZER-84: promote on aprobado miembro only (u3), not admin creator (u1)
    expect(screen.getByRole("button", { name: "Designar admin" })).toBeInTheDocument();
  });

  it("does not offer promote to plain miembros", async () => {
    mockClient({
      project: sampleProject,
      viewerMembership: { estado: "aprobado", rol: "miembro" },
    });
    const ui = await ProjectDetailPage({ params: Promise.resolve({ id: "proj-1" }) });
    render(ui);
    expect(screen.queryByRole("button", { name: "Designar admin" })).not.toBeInTheDocument();
  });
});
