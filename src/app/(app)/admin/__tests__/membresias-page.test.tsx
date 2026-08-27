import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  membershipResponse: Promise.resolve({ data: [] as unknown[], count: 0 }) as Promise<{
    data: unknown[];
    count: number;
  }>,
  membershipSelect: vi.fn(),
  rolesCountResponse: Promise.resolve({ count: 0 }) as Promise<{ count: number }>,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === "membership_requests") {
        return {
          select: mocks.membershipSelect.mockImplementation(() => ({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn(() => mocks.membershipResponse),
          })),
        };
      }
      if (table === "profile_roles") {
        return {
          select: vi.fn().mockImplementation(() => ({
            eq: vi.fn(() => mocks.rolesCountResponse),
          })),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("@/components/RequestCard", () => ({
  RequestCard: ({ request }: { request: { profile: { nombre: string; apellido: string } } }) => (
    <div data-testid="request-card">
      {request.profile.nombre} {request.profile.apellido}
    </div>
  ),
}));

import AdminMembresiasPage from "../membresias/page";

beforeEach(() => {
  vi.clearAllMocks();
});

const pendingRequests = [
  {
    id: "req-1",
    mensaje: "Quiero ayudar",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    profiles: {
      nombre: "Sofía",
      apellido: "Vega",
      apodo: null,
      nombre_visible: "nombre_apellido" as const,
      avatar_url: null,
    },
  },
  {
    id: "req-2",
    mensaje: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: {
      nombre: "Julián",
      apellido: "Ríos",
      apodo: null,
      nombre_visible: "nombre_apellido" as const,
      avatar_url: null,
    },
  },
];

function setMembershipData(data: typeof pendingRequests, count: number) {
  mocks.membershipResponse = Promise.resolve({ data, count });
}

function setEmptyMembership() {
  mocks.membershipResponse = Promise.resolve({ data: [], count: 0 });
}

describe("AdminMembresiasPage", () => {
  it("renders page header", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage());
    expect(screen.getByText("Panel de admin")).toBeInTheDocument();
  });

  it("renders solicitudes pendientes section title", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage());
    expect(screen.getByText("Solicitudes pendientes")).toBeInTheDocument();
    expect(screen.getByText("Turistas esperando ser Serranos")).toBeInTheDocument();
  });

  it("renders segmented tabs with Membresías active and Roles inactive", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage());
    expect(screen.getByText(/Membresías/)).toBeInTheDocument();
    expect(screen.getByText(/Roles/)).toBeInTheDocument();
  });

  it("renders counter badge with pending count", async () => {
    setMembershipData(pendingRequests, 2);
    render(await AdminMembresiasPage());
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders RequestCards for each pending request", async () => {
    setMembershipData(pendingRequests, 2);
    render(await AdminMembresiasPage());
    expect(screen.getByText("Sofía Vega")).toBeInTheDocument();
    expect(screen.getByText("Julián Ríos")).toBeInTheDocument();
  });

  it("renders empty state when no pending requests", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage());
    expect(screen.getByText("No hay solicitudes pendientes")).toBeInTheDocument();
  });

  it("handles null data from supabase gracefully", async () => {
    mocks.membershipResponse = Promise.resolve({ data: null as unknown as unknown[], count: 0 });
    render(await AdminMembresiasPage());
    expect(screen.getByText("No hay solicitudes pendientes")).toBeInTheDocument();
  });

  it("filters out requests with null profiles instead of crashing", async () => {
    const withNullProfile = [
      {
        id: "req-1",
        mensaje: "Quiero ayudar",
        created_at: new Date().toISOString(),
        profiles: {
          nombre: "Sofía",
          apellido: "Vega",
          apodo: null,
          nombre_visible: "nombre_apellido" as const,
          avatar_url: null,
        },
      },
      {
        id: "req-2",
        mensaje: null,
        created_at: new Date().toISOString(),
        profiles: null,
      },
    ];
    mocks.membershipResponse = Promise.resolve({ data: withNullProfile, count: 2 });
    render(await AdminMembresiasPage());
    expect(screen.getByText("Sofía Vega")).toBeInTheDocument();
    expect(screen.getAllByTestId("request-card")).toHaveLength(1);
  });

  it("does not render non-admin UI elements", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage());
    expect(screen.queryByText("Proyectos")).not.toBeInTheDocument();
    expect(screen.queryByText("Aportes")).not.toBeInTheDocument();
  });
});
