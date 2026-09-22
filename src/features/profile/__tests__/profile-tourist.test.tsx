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
  requestsMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "membership_requests") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ limit: () => ({ maybeSingle: mocks.requestsMaybeSingle }) }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ single: mocks.profilesSelectSingle }),
        }),
      };
    }),
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
  mocks.requestsMaybeSingle.mockResolvedValue({ data: null, error: null });
  vi.mocked(useTheme).mockReturnValue({ dark: false, toggle: mockToggle });
});

describe("ProfilePage (tourist)", () => {
  it("renders Mi perfil header without a non-interactive pencil icon", async () => {
    const { container } = render(await ProfilePage());

    expect(screen.getByRole("heading", { name: "Mi perfil" })).toBeInTheDocument();
    // Dead pencil was a bare lucide icon in the header — must not reappear.
    expect(container.querySelector("svg.lucide-pencil")).toBeNull();
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

  it("renders Solicitar ser Serrano CTA as a link to /solicitar", async () => {
    render(await ProfilePage());

    const cta = screen.getByText("Solicitar ser Serrano");
    const ctaLink = cta.closest("a");
    expect(ctaLink).not.toBeNull();
    expect(ctaLink).toHaveAttribute("href", "/solicitar");
  });

  describe("pending membership request (ZER-110)", () => {
    beforeEach(() => {
      mocks.requestsMaybeSingle.mockResolvedValue({ data: { id: "req-1" }, error: null });
    });

    it("keeps the tourist profile shell while the request is pending", async () => {
      render(await ProfilePage());

      expect(screen.getByRole("heading", { name: "Mi perfil" })).toBeInTheDocument();
      expect(screen.getByText("Juan Visitante")).toBeInTheDocument();
      expect(screen.getByText("juan@gmail.com")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Editar perfil/ })).toHaveAttribute(
        "href",
        "/profile/edit",
      );
      expect(screen.getByText("Modo oscuro")).toBeInTheDocument();
      expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
    });

    it("swaps only the membership card to pending review state", async () => {
      render(await ProfilePage());

      expect(screen.getByText("Solicitud en revisión")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Un admin de Nodo va a revisar tu solicitud pronto. Cuando te aprueben, pasás de Turista a Serrano y vas a aparecer en el plantel.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText("Todavía sos Tourist")).toBeNull();
      expect(screen.queryByText("Solicitar ser Serrano")).toBeNull();
      expect(screen.queryByRole("link", { name: "Solicitar ser Serrano" })).toBeNull();
      expect(screen.queryByRole("link", { name: "Explorar Nodo" })).toBeNull();
    });

    it("does not render a full-screen post-request replacement title as page chrome", async () => {
      render(await ProfilePage());

      expect(screen.queryByRole("heading", { name: "Tu cuenta está en revisión" })).toBeNull();
    });
  });

  it("fails closed on membership request read error (shows tourist shell)", async () => {
    mocks.requestsMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "boom" },
    });
    render(await ProfilePage());

    expect(screen.getByText("Todavía sos Tourist")).toBeInTheDocument();
    expect(screen.queryByText("Solicitud en revisión")).toBeNull();
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
