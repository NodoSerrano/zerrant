import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  membershipResponse: Promise.resolve({ data: [] as unknown[], count: 0 }) as Promise<{
    data: unknown[];
    count: number;
  }>,
  membershipSelect: vi.fn(),
  membershipOrder: vi.fn(),
  rolesCountResponse: Promise.resolve({ count: 0 }) as Promise<{ count: number }>,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === "membership_requests") {
        return {
          select: mocks.membershipSelect.mockImplementation(() => ({
            in: vi.fn().mockReturnThis(),
            order: mocks.membershipOrder.mockImplementation(() => ({
              order: mocks.membershipOrder.mockImplementation(() => mocks.membershipResponse),
            })),
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
      if (table === "interview_bookings") {
        return {
          select: vi.fn(() => Promise.resolve({ data: [] })),
        };
      }
      if (table === "interview_slot_availability") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gt: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [] })),
              })),
            })),
          })),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("@/components/RequestCard", () => ({
  RequestCard: ({
    request,
  }: {
    request: { estado: string; profile: { nombre: string; apellido: string } };
  }) => (
    <div data-testid="request-card" data-estado={request.estado}>
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
    estado: "pendiente_coordinacion" as const,
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
    estado: "reprogramacion" as const,
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

  it("selects estado and passes it to each card", async () => {
    setMembershipData(pendingRequests, 2);
    render(await AdminMembresiasPage());
    const [select] = mocks.membershipSelect.mock.calls[0];
    expect(select).toMatch(/\bestado\b/);
    expect(screen.getAllByTestId("request-card").map((c) => c.dataset.estado)).toEqual([
      "pendiente_coordinacion",
      "reprogramacion",
    ]);
  });

  it("orders by created_at desc with an id tiebreaker so cards never jump after a transition", async () => {
    render(await AdminMembresiasPage());
    expect(mocks.membershipOrder).toHaveBeenNthCalledWith(1, "created_at", { ascending: false });
    expect(mocks.membershipOrder).toHaveBeenNthCalledWith(2, "id", { ascending: true });
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
        estado: "pendiente_coordinacion" as const,
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

describe("AdminMembresiasPage — screening select (ZER-108)", () => {
  it("requests screening columns for pending membership rows", async () => {
    mocks.membershipResponse = Promise.resolve({ data: [], count: 0 });
    await AdminMembresiasPage();
    expect(mocks.membershipSelect).toHaveBeenCalled();
    const arg = mocks.membershipSelect.mock.calls[0][0] as string;
    expect(arg).toContain("contacto_whatsapp");
    expect(arg).toContain("frecuencia_uso");
    expect(arg).toContain("reunion_disponibilidad");
    expect(arg).toContain("aporte_actitud");
  });
});
