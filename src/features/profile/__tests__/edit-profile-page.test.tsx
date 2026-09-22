import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUpdateProfile = vi.hoisted(() => vi.fn());

vi.mock("@/features/profile/actions", () => ({
  updateProfile: mockUpdateProfile,
  uploadAvatar: vi.fn(),
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

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      expect(table).toBe("profiles_with_rate");
      return {
        select: mocks.select.mockImplementation(() => ({
          eq: vi.fn(() => ({ single: mocks.profilesSelectSingle })),
        })),
      };
    }),
  }),
}));

import EditProfilePage from "@/app/(modal)/profile/edit/page";

const profileFixture = {
  id: "user-1",
  nombre: "Nóbel",
  apellido: "Dam",
  apodo: "nobel",
  nombre_visible: "nombre_apellido",
  avatar_url: null,
  email: "nobel@nodo.ar",
  tier: "standard",
  bio: null,
  contacto_telegram: null,
  sitio_url: null,
  disponibilidad: null,
  visibilidad_tarifa: null,
  fecha_nacimiento: null,
  tarifa_hora: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.profilesSelectSingle.mockResolvedValue({ data: profileFixture, error: null });
});

describe("EditProfilePage", () => {
  it("renders header with chevron, centered title, and no header Guardar", async () => {
    render(await EditProfilePage());

    expect(screen.getByText("Editar perfil")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
    expect(screen.queryByText("Guardar")).not.toBeInTheDocument();
  });

  it("links Volver to /profile as a real anchor (not history-only back)", async () => {
    render(await EditProfilePage());

    const back = screen.getByRole("link", { name: "Volver al perfil" });
    expect(back).toHaveAttribute("href", "/profile");
  });

  it("renders the AvatarPicker", async () => {
    render(await EditProfilePage());

    expect(screen.getByText("Agregar foto")).toBeInTheDocument();
  });

  it("prefills form fields from profile", async () => {
    render(await EditProfilePage());

    expect(screen.getByLabelText("Nombre")).toHaveValue("Nóbel");
    expect(screen.getByLabelText("Apellido")).toHaveValue("Dam");
    expect(screen.getByDisplayValue("nobel")).toBeInTheDocument();
  });

  it("renders nombre visible as segmented control", async () => {
    render(await EditProfilePage());

    expect(screen.getByText("Nombre visible en el plantel")).toBeInTheDocument();
    expect(screen.getByText("Nombre Apellido")).toBeInTheDocument();
  });

  it("renders roles section as NO-OP with helper text", async () => {
    render(await EditProfilePage());

    expect(screen.getByText("Roles en el nodo")).toBeInTheDocument();
    expect(screen.getByText(/Los roles nuevos los confirma un admin/)).toBeInTheDocument();
  });

  it("renders disponibilidad as segmented control", async () => {
    render(await EditProfilePage());

    expect(screen.getByText("Disponibilidad")).toBeInTheDocument();
  });

  it("renders tarifa por hora field", async () => {
    render(await EditProfilePage());

    expect(screen.getByLabelText("Tarifa por hora")).toBeInTheDocument();
  });

  it("renders visibilidad de tarifa segmented control", async () => {
    render(await EditProfilePage());

    expect(screen.getByText("Visibilidad de tarifa")).toBeInTheDocument();
  });

  it("shows exactly one save control: bottom Guardar cambios", async () => {
    render(await EditProfilePage());

    const saveButtons = screen.getAllByRole("button", { name: /guardar/i });
    expect(saveButtons).toHaveLength(1);
    expect(saveButtons[0]).toHaveAccessibleName("Guardar cambios");
  });
});
