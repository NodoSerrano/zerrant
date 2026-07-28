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
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: mocks.select.mockImplementation(() => ({
        eq: vi.fn(() => ({ single: mocks.profilesSelectSingle })),
      })),
    })),
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
  vi.mocked(useTheme).mockReturnValue({ dark: false, toggle: mockToggle });
});

describe("ProfilePage (serrano)", () => {
  it("renders Mi perfil header", async () => {
    render(await ProfilePage());

    expect(screen.getByRole("heading", { name: "Mi perfil" })).toBeInTheDocument();
  });

  it("renders the identity card with Avatar, name, and email", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
    expect(screen.getByText("nobel@nodo.ar")).toBeInTheDocument();
  });

  it("renders RoleChips for serrano tier", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Standard")).toBeInTheDocument();
  });

  it("renders quick actions group rows", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Mis proyectos")).toBeInTheDocument();
    expect(screen.getByText("Mis aportes")).toBeInTheDocument();
  });

  it("renders settings group rows", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Mis habilidades")).toBeInTheDocument();
    expect(screen.getByText("Disponibilidad")).toBeInTheDocument();
    expect(screen.getByText("Visibilidad de tarifa")).toBeInTheDocument();
  });

  it("renders action group rows", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Modo oscuro")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("calls toggle when theme switch is clicked", async () => {
    render(await ProfilePage());

    fireEvent.click(screen.getByLabelText("Cambiar a modo oscuro"));
    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it("calls signOut when logout button is clicked", async () => {
    render(await ProfilePage());

    fireEvent.click(screen.getByText("Cerrar sesión").closest("button")!);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("does not render membership CTA banner", async () => {
    render(await ProfilePage());

    expect(screen.queryByText("Todavía sos Tourist")).toBeNull();
    expect(screen.queryByText("Solicitar ser Serrano")).toBeNull();
  });

  it("does not render old 'Modo lectura' badge", async () => {
    render(await ProfilePage());

    expect(screen.queryByText(/Modo lectura/)).toBeNull();
  });

  it("does not render old field grid (Nombre, Apellido, Bio)", async () => {
    render(await ProfilePage());

    expect(screen.queryByText("Nombre")).toBeNull();
    expect(screen.queryByText("Apellido")).toBeNull();
    expect(screen.queryByText("Bio")).toBeNull();
  });
});
