import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  rolesResponse: Promise.resolve({ data: [] as unknown[] }) as Promise<{ data: unknown[] }>,
  rolesSelect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === "profile_roles") {
        return {
          select: mocks.rolesSelect.mockImplementation(() => ({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn(() => mocks.rolesResponse),
          })),
        };
      }
      if (table === "membership_requests") {
        return {
          select: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ count: 0 }),
          })),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("@/features/roles/roles-confirmation-panel", () => ({
  RolesConfirmationPanel: ({
    data,
  }: {
    data: { profileName: string; roles: { roleName: string }[] }[];
  }) => (
    <div data-testid="roles-panel">
      {data.length === 0
        ? "empty"
        : data.map((p) => (
            <div key={p.profileName}>
              {p.profileName}: {p.roles.map((r) => r.roleName).join(",")}
            </div>
          ))}
    </div>
  ),
}));

import AdminRolesPage from "../roles/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rolesResponse = Promise.resolve({ data: [] });
});

describe("AdminRolesPage", () => {
  it("renders admin shell header", async () => {
    render(await AdminRolesPage());
    expect(screen.getByText("Panel de admin")).toBeInTheDocument();
  });

  it("renders Roles tab as active", async () => {
    render(await AdminRolesPage());
    expect(screen.getByText(/^Roles ·/)).toBeInTheDocument();
    expect(screen.getByText(/^Membresías ·/)).toBeInTheDocument();
  });

  it("groups pending roles by profile and passes them to the panel", async () => {
    mocks.rolesResponse = Promise.resolve({
      data: [
        {
          profile_id: "p1",
          role_id: "r1",
          profiles: {
            id: "p1",
            nombre: "Sofía",
            apellido: "Vega",
            apodo: null,
            nombre_visible: "nombre_apellido",
          },
          roles: { nombre: "Infra" },
        },
        {
          profile_id: "p1",
          role_id: "r2",
          profiles: {
            id: "p1",
            nombre: "Sofía",
            apellido: "Vega",
            apodo: null,
            nombre_visible: "nombre_apellido",
          },
          roles: { nombre: "RRSS" },
        },
        {
          profile_id: "p2",
          role_id: "r3",
          profiles: {
            id: "p2",
            nombre: "Julián",
            apellido: "Ríos",
            apodo: null,
            nombre_visible: "nombre_apellido",
          },
          roles: { nombre: "Charlas" },
        },
      ],
    });

    render(await AdminRolesPage());
    expect(screen.getByText("Sofía Vega: Infra,RRSS")).toBeInTheDocument();
    expect(screen.getByText("Julián Ríos: Charlas")).toBeInTheDocument();
  });

  it("filters out rows with null profile embeds", async () => {
    mocks.rolesResponse = Promise.resolve({
      data: [
        {
          profile_id: "p1",
          role_id: "r1",
          profiles: {
            id: "p1",
            nombre: "Sofía",
            apellido: "Vega",
            apodo: null,
            nombre_visible: "nombre_apellido",
          },
          roles: { nombre: "Infra" },
        },
        {
          profile_id: "p2",
          role_id: "r2",
          profiles: null,
          roles: { nombre: "RRSS" },
        },
      ],
    });

    render(await AdminRolesPage());
    expect(screen.getByText("Sofía Vega: Infra")).toBeInTheDocument();
    expect(screen.queryByText(/RRSS/)).not.toBeInTheDocument();
  });

  it("handles null data from supabase", async () => {
    mocks.rolesResponse = Promise.resolve({ data: null as unknown as unknown[] });
    render(await AdminRolesPage());
    expect(screen.getByTestId("roles-panel")).toHaveTextContent("empty");
  });
});
