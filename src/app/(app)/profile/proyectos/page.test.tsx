import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesEq: vi.fn(),
  profilesSingle: vi.fn(),
  membersSelect: vi.fn(),
  membersEqProfile: vi.fn(),
  membersEqEstado: vi.fn(),
  membersOrder: vi.fn(),
  redirect: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
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

import MisProyectosPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.profilesSingle.mockResolvedValue({ data: { tier: "standard" }, error: null });
  mocks.membersOrder.mockResolvedValue({ data: [], error: null });

  mocks.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: mocks.profilesSelect.mockImplementation(() => ({
          eq: mocks.profilesEq.mockImplementation(() => ({ single: mocks.profilesSingle })),
        })),
      };
    }
    if (table === "project_members") {
      return {
        select: mocks.membersSelect.mockImplementation(() => ({
          eq: mocks.membersEqProfile.mockImplementation(() => ({
            eq: mocks.membersEqEstado.mockImplementation(() => ({
              order: mocks.membersOrder,
            })),
          })),
        })),
      };
    }
    return {};
  });
});

describe("MisProyectosPage", () => {
  it("redirects unauthenticated users to login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(MisProyectosPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("redirects tourists to /profile", async () => {
    mocks.profilesSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    await expect(MisProyectosPage()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("queries only the viewer approved memberships", async () => {
    mocks.membersOrder.mockResolvedValue({
      data: [
        {
          project_id: "proj-2",
          projects: {
            id: "proj-2",
            nombre: "Taller ZK",
            descripcion: "Charlas",
            estado: "en_curso",
            ingreso: "abierto",
          },
        },
        {
          project_id: "proj-1",
          projects: {
            id: "proj-1",
            nombre: "Nodo hub",
            descripcion: null,
            estado: "idea",
            ingreso: "aprobacion",
          },
        },
      ],
      error: null,
    });

    const el = await MisProyectosPage();
    render(el);

    expect(mocks.membersSelect).toHaveBeenCalledWith(
      "project_id, projects:project_id(id, nombre, descripcion, estado, ingreso)",
    );
    expect(mocks.membersEqProfile).toHaveBeenCalledWith("profile_id", "user-1");
    expect(mocks.membersEqEstado).toHaveBeenCalledWith("estado", "aprobado");
    expect(mocks.membersOrder).toHaveBeenCalledWith("created_at", { ascending: false });

    expect(screen.getByText("Taller ZK")).toBeInTheDocument();
    expect(screen.getByText("Nodo hub")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Taller ZK/i })).toHaveAttribute(
      "href",
      "/nodo/projects/proj-2",
    );
  });

  it("renders empty state for zero approved projects", async () => {
    mocks.membersOrder.mockResolvedValue({ data: [], error: null });

    const el = await MisProyectosPage();
    render(el);

    expect(screen.getByText(/No hay proyectos/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mis proyectos" })).toBeInTheDocument();
  });

  it("shows total count summary matching the list length", async () => {
    mocks.membersOrder.mockResolvedValue({
      data: [
        {
          project_id: "proj-1",
          projects: {
            id: "proj-1",
            nombre: "Nodo hub",
            descripcion: null,
            estado: "idea",
            ingreso: "abierto",
          },
        },
      ],
      error: null,
    });

    const el = await MisProyectosPage();
    render(el);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/proyectos en total/i)).toBeInTheDocument();
  });
});
