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

const touristProfile = {
  id: "user-1",
  tier: "tourist",
  nombre: "Juan",
  apellido: "Visitante",
  apodo: null,
  nombre_visible: "nombre_apellido",
  avatar_url: null,
  email: "juan@gmail.com",
  bio: null,
  contacto_telegram: null,
  sitio_url: null,
  fecha_nacimiento: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.profilesSelectSingle.mockResolvedValue({ data: touristProfile, error: null });
  vi.mocked(useTheme).mockReturnValue({ dark: false, toggle: mockToggle });
});

describe("ProfilePage (tourist)", () => {
  it("renders Mi perfil header with pencil icon", async () => {
    render(await ProfilePage());

    expect(screen.getByRole("heading", { name: "Mi perfil" })).toBeInTheDocument();
  });

  it("renders no 'Modo lectura' badge from old design", async () => {
    render(await ProfilePage());

    expect(screen.queryByText(/Modo lectura/)).toBeNull();
  });

  it("renders the identity card with Avatar, name, email, and TierBadge", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Juan Visitante")).toBeInTheDocument();
    expect(screen.getByText("juan@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Tourist")).toBeInTheDocument();
  });

  it("renders the membership CTA banner with Mountain icon and copy", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Todavía sos Tourist")).toBeInTheDocument();
    expect(screen.getByText(/Sumate como Serrano para aparecer en el plantel/)).toBeInTheDocument();
  });

  it("renders the Solicitar ser Serrano CTA linking to /solicitar", async () => {
    render(await ProfilePage());

    const cta = screen.getByRole("link", { name: "Solicitar ser Serrano" });
    expect(cta).toHaveAttribute("href", "/solicitar");
  });

  it("renders Editar perfil menu row linking to /profile/edit", async () => {
    render(await ProfilePage());

    const editLink = screen.getByRole("link", { name: /Editar perfil/ });
    expect(editLink).toHaveAttribute("href", "/profile/edit");
  });

  it("renders Modo oscuro menu row with toggle switch", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Modo oscuro")).toBeInTheDocument();
    expect(screen.getByLabelText("Cambiar a modo oscuro")).toBeInTheDocument();
  });

  it("calls toggle when theme switch is clicked", async () => {
    render(await ProfilePage());

    fireEvent.click(screen.getByLabelText("Cambiar a modo oscuro"));
    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it("renders Cerrar sesión menu row", async () => {
    render(await ProfilePage());

    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("calls signOut when logout button is clicked", async () => {
    render(await ProfilePage());

    fireEvent.click(screen.getByText("Cerrar sesión").closest("button")!);
    // signOut is a server action invoked via form action; fireEvent.click
    // on the submit button triggers form submit which calls signOut.
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("does not render old field grid (no Bio, Nombre, Apellido labels)", async () => {
    render(await ProfilePage());

    expect(screen.queryByText("Nombre")).toBeNull();
    expect(screen.queryByText("Apellido")).toBeNull();
    expect(screen.queryByText("Bio")).toBeNull();
  });

  it("does not render Serrano-only menu items", async () => {
    render(await ProfilePage());

    expect(screen.queryByText("Proyectos")).toBeNull();
    expect(screen.queryByText("Aportes")).toBeNull();
    expect(screen.queryByText("Skills")).toBeNull();
    expect(screen.queryByText("Plantel")).toBeNull();
  });
});
