import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  membershipResponse: Promise.resolve({ data: [] as unknown[], count: 0 }) as Promise<{
    data: unknown[];
    count: number;
  }>,
  membershipSelect: vi.fn(),
  membershipOrder: vi.fn(),
  notesResponse: Promise.resolve({ data: [] as unknown[], error: null }) as Promise<{
    data: unknown[];
    error: null;
  }>,
  notesSelect: vi.fn(),
  rolesCountResponse: Promise.resolve({ count: 0 }) as Promise<{ count: number }>,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
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
      if (table === "interview_notes") {
        const chain = {
          in: vi.fn(),
          order: vi.fn(() => mocks.notesResponse),
        };
        chain.in.mockReturnValue(chain);
        return {
          select: mocks.notesSelect.mockImplementation(() => chain),
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
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
  mocks.notesResponse = Promise.resolve({ data: [], error: null });
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

describe("AdminMembresiasPage — interview notes (ZER-145)", () => {
  const root = path.resolve(__dirname, "../../../../..");

  it("renders the note body, author and date from a separate query", async () => {
    setMembershipData([pendingRequests[0]], 1);
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mocks.notesResponse = Promise.resolve({
      data: [
        {
          id: "note-own",
          request_id: "req-1",
          author_id: "admin-1",
          body: "Encaja en el nodo",
          created_at: "2026-03-01T15:04:00.000Z",
          profiles: {
            nombre: "Ada",
            apellido: "Lovelace",
            apodo: null,
            nombre_visible: "nombre_apellido",
          },
        },
        {
          id: "note-other",
          request_id: "req-1",
          author_id: "admin-2",
          body: "Nota de otro admin",
          created_at: "2026-03-02T15:04:00.000Z",
          profiles: {
            nombre: "Grace",
            apellido: "Hopper",
            apodo: null,
            nombre_visible: "nombre_apellido",
          },
        },
      ],
      error: null,
    });

    render(await AdminMembresiasPage());

    const screening = mocks.membershipSelect.mock.calls[0][0] as string;
    expect(screening).not.toContain("interview_notes");
    expect(mocks.notesSelect).toHaveBeenCalled();
    const notesSelect = mocks.notesSelect.mock.calls[0][0] as string;
    expect(notesSelect).toContain("body");
    expect(notesSelect).toContain("author_id");
    expect(notesSelect).not.toContain("mensaje");

    expect(screen.getByText("Encaja en el nodo")).toBeInTheDocument();
    expect(screen.getByText("Nota de otro admin")).toBeInTheDocument();
    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();
    expect(screen.getByText(/Grace Hopper/)).toBeInTheDocument();
    expect(screen.getByText(/1 de mar de 2026/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Encaja en el nodo")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Nota de otro admin")).not.toBeInTheDocument();
  });

  it("keeps interview notes out of applicant, profile and plantel selects", () => {
    const files = [
      "src/app/(app)/profile/page.tsx",
      "src/features/membership/pipeline-server.ts",
      "src/app/(modal)/solicitar/estado/page.tsx",
      "src/app/(app)/plantel/page.tsx",
      "src/app/(app)/plantel/[id]/page.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(root, file), "utf8");
      expect(source, file).not.toContain("interview_notes");
    }
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
