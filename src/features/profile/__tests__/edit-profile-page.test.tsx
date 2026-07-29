import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUpdateProfile = vi.hoisted(() => vi.fn());
const mockRouterBack = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockRouterBack }),
}));

vi.mock("@/features/profile/actions", () => ({
  updateProfile: mockUpdateProfile,
  uploadAvatar: vi.fn(),
}));

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
  select: vi.fn(),
  rolesSelectAll: vi.fn(),
  profileRolesSelect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => ({
      select: vi.fn((_args: unknown[]) => {
        if (table === "roles") {
          return mocks.rolesSelectAll();
        }
        return {
          eq: vi.fn(() => {
            if (table === "profile_roles") {
              return mocks.profileRolesSelect();
            }
            return { single: mocks.profilesSelectSingle };
          }),
        };
      }),
    })),
  }),
}));

import EditProfilePage from "@/app/(app)/profile/edit/page";

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
  mocks.rolesSelectAll.mockResolvedValue({
    data: [
      { id: "r-charlas", nombre: "Charlas" },
      { id: "r-infra", nombre: "Infra" },
      { id: "r-rrss", nombre: "RRSS" },
      { id: "r-tesoreria", nombre: "Tesorería" },
      { id: "r-organizacion", nombre: "Organización" },
    ],
    error: null,
  });
  mocks.profileRolesSelect.mockResolvedValue({
    data: [{ role_id: "r-charlas" }, { role_id: "r-infra" }],
    error: null,
  });
});

describe("EditProfilePage", () => {
  it("renders the Pencil header with chevron, title, and Guardar action", async () => {
    render(await EditProfilePage());

    expect(screen.getByText("Editar perfil")).toBeInTheDocument();
    expect(screen.getByText("Guardar")).toBeInTheDocument();
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

  it("renders roles section with toggleable RoleChips and helper text", async () => {
    render(await EditProfilePage());

    expect(screen.getByText("Roles en el nodo")).toBeInTheDocument();
    expect(screen.getByText("Charlas")).toBeInTheDocument();
    expect(screen.getByText("Infra")).toBeInTheDocument();
    expect(screen.getByText("RRSS")).toBeInTheDocument();
    expect(screen.getByText("Tesorería")).toBeInTheDocument();
    expect(screen.getByText("Organización")).toBeInTheDocument();
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

  it("shows Guardar cambios CTA", async () => {
    render(await EditProfilePage());

    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
  });
});
