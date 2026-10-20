import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockToggle = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());

vi.mock("@/lib/useTheme", () => ({
  useTheme: vi.fn(),
}));

vi.mock("@/features/auth/actions", () => ({
  signOut: mockSignOut,
}));

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  countEq: vi.fn(),
  approvedRequest: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  }),
}));

import { useTheme } from "@/lib/useTheme";
import ProfilePage from "@/app/(app)/profile/page";

const serranoProfile = {
  id: "user-1",
  tier: "standard",
  nombre: "Nóbel",
  apellido: "Dam",
  apodo: null,
  nombre_visible: "nombre_apellido",
  avatar_url: null,
  email: "nobel@nodo.ar",
  bio: null,
  contacto_telegram: null,
  sitio_url: null,
  fecha_nacimiento: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.profilesSelectSingle.mockResolvedValue({ data: serranoProfile, error: null });
  mocks.approvedRequest.mockResolvedValue({ data: null, error: null });
  const makeCountChain = (): {
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    not: ReturnType<typeof vi.fn>;
  } & Promise<{ count: number; error: null }> => {
    const result = Promise.resolve({ count: 0, error: null });
    const chain = Object.assign(result, {
      eq: vi.fn(() => makeCountChain()),
      is: vi.fn(() => makeCountChain()),
      not: vi.fn(() => makeCountChain()),
    });
    return chain;
  };
  mocks.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: mocks.select.mockImplementation(() => ({
          eq: vi.fn(() => ({ single: mocks.profilesSelectSingle })),
        })),
      };
    }
    if (table === "membership_requests") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: mocks.approvedRequest,
                })),
              })),
            })),
          })),
        })),
      };
    }
    return {
      select: vi.fn(() => makeCountChain()),
    };
  });
  vi.mocked(useTheme).mockReturnValue({ dark: false, toggle: mockToggle });
});

describe("ProfilePage (serrano)", () => {
  it("renders Mi perfil header without a non-interactive pencil icon", async () => {
    const { container } = render(await ProfilePage());

    expect(screen.getByRole("heading", { name: "Mi perfil" })).toBeInTheDocument();
    // Dead pencil was a bare lucide icon in the header — must not reappear.
    expect(container.querySelector("svg.lucide-pencil")).toBeNull();
  });

  it("renders Editar perfil menu row linking to /profile/edit", async () => {
    render(await ProfilePage());

    const editLink = screen.getByRole("link", { name: /Editar perfil/ });
    expect(editLink).toHaveAttribute("href", "/profile/edit");
  });

  it("renders the identity card with Avatar, name, and email", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
    expect(screen.getByText("nobel@nodo.ar")).toBeInTheDocument();
  });

  it("shows an explicit confirmation when the membership request was approved", async () => {
    mocks.approvedRequest.mockResolvedValue({ data: { id: "req-1" }, error: null });

    render(await ProfilePage());

    expect(screen.getByRole("heading", { name: "Ya sos miembro del Nodo" })).toBeInTheDocument();
    expect(screen.getByText("Miembro")).toBeInTheDocument();
  });

  it("renders Spanish TierBadge for serrano tier", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Miembro")).toBeInTheDocument();
    expect(screen.queryByText("Standard")).toBeNull();
  });

  it("renders platform Admin badge on identity when is_platform_admin", async () => {
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { ...serranoProfile, is_platform_admin: true },
      error: null,
    });

    render(await ProfilePage());

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("hides platform Admin badge on identity when not admin", async () => {
    render(await ProfilePage());
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("renders quick actions group rows", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Mis proyectos")).toBeInTheDocument();
    expect(screen.getByText("Mis aportes")).toBeInTheDocument();
  });

  it("renders settings group rows", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Mis habilidades")).toBeInTheDocument();
  });

  it("does not show availability or rates", async () => {
    mocks.profilesSelectSingle.mockResolvedValue({
      data: {
        ...serranoProfile,
        disponibilidad: "disponible",
        visibilidad_tarifa: "publica",
        tarifa_hora: 40,
      },
      error: null,
    });

    render(await ProfilePage());

    expect(screen.queryByText("Disponibilidad")).not.toBeInTheDocument();
    expect(screen.queryByText("Visibilidad de tarifa")).not.toBeInTheDocument();
    expect(screen.queryByText("Disponible")).not.toBeInTheDocument();
    expect(screen.queryByText(/tarifa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/USD/)).not.toBeInTheDocument();

    const selected = String(mocks.select.mock.calls[0]?.[0] ?? "");
    expect(selected).not.toContain("disponibilidad");
    expect(selected).not.toContain("visibilidad_tarifa");
    expect(selected).not.toContain("tarifa_hora");
  });

  it("links Mis habilidades to /profile/habilidades", async () => {
    render(await ProfilePage());

    const link = screen.getByRole("link", { name: "Mis habilidades" });
    expect(link).toHaveAttribute("href", "/profile/habilidades");
  });

  it("links Mis proyectos to /profile/proyectos with a real count", async () => {
    render(await ProfilePage());

    const link = screen.getByRole("link", { name: /Mis proyectos/i });
    expect(link).toHaveAttribute("href", "/profile/proyectos");
    expect(link).toHaveTextContent("0");
  });

  it("renders action group rows", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Modo oscuro")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("calls toggle when theme switch is clicked", async () => {
    render(await ProfilePage());

    fireEvent.click(screen.getByRole("switch", { name: "Modo oscuro" }));
    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it("calls signOut when logout button is clicked", async () => {
    render(await ProfilePage());

    fireEvent.click(screen.getByText("Cerrar sesión").closest("button")!);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("does not render membership CTA banner", async () => {
    render(await ProfilePage());

    expect(screen.queryByText("Todavía sos Turista")).toBeNull();
    expect(screen.queryByText("Solicitar ser Serrano")).toBeNull();
  });

  it("does not render old 'Modo lectura' badge", async () => {
    render(await ProfilePage());

    expect(screen.queryByText(/Modo lectura/)).toBeNull();
  });

  it("selects is_platform_admin for the serrano profile shell", async () => {
    render(await ProfilePage());

    expect(mocks.select).toHaveBeenCalled();
    const selected = String(mocks.select.mock.calls[0]?.[0] ?? "");
    expect(selected).toContain("is_platform_admin");
  });

  it("hides Panel de admin when the viewer is not a platform admin", async () => {
    render(await ProfilePage());

    expect(screen.queryByRole("link", { name: /Panel de admin/i })).toBeNull();
    expect(screen.queryByText("Panel de admin")).toBeNull();
  });

  it("links Panel de admin to /admin/membresias for platform admins", async () => {
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { ...serranoProfile, is_platform_admin: true },
      error: null,
    });

    render(await ProfilePage());

    const link = screen.getByRole("link", { name: /Panel de admin/i });
    expect(link).toHaveAttribute("href", "/admin/membresias");
    expect(link.className).not.toMatch(/\/40/);
    expect(link.innerHTML).not.toMatch(/\/40/);
  });

  it("does not render old field grid (Nombre, Apellido, Bio)", async () => {
    render(await ProfilePage());

    expect(screen.queryByText("Nombre")).toBeNull();
    expect(screen.queryByText("Apellido")).toBeNull();
    expect(screen.queryByText("Bio")).toBeNull();
  });
});
