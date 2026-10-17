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
  eventsResponse: Promise.resolve({ data: [] as unknown[], error: null }) as Promise<{
    data: unknown[];
    error: { message: string } | null;
  }>,
  eventsIn: vi.fn(),
  historyResponse: Promise.resolve({ data: [] as unknown[] }) as Promise<{ data: unknown[] }>,
  historyIn: vi.fn(),
  historyOrder: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "membership_requests") {
        return {
          select: mocks.membershipSelect.mockImplementation((columns: string) => {
            // The history view selects final requests without the screening columns.
            if (!columns.includes("contacto_whatsapp")) {
              const chain = {
                in: mocks.historyIn,
                order: mocks.historyOrder,
                limit: vi.fn(() => mocks.historyResponse),
              };
              mocks.historyIn.mockReturnValue(chain);
              mocks.historyOrder.mockReturnValue(chain);
              return chain;
            }
            return {
              in: vi.fn().mockReturnThis(),
              order: mocks.membershipOrder.mockImplementation(() => ({
                order: mocks.membershipOrder.mockImplementation(() => mocks.membershipResponse),
              })),
            };
          }),
        };
      }
      if (table === "membership_request_events") {
        const chain = {
          in: mocks.eventsIn,
          order: vi.fn(() => mocks.eventsResponse),
        };
        mocks.eventsIn.mockReturnValue(chain);
        return { select: vi.fn(() => chain) };
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
    request: {
      estado: string;
      profile: { nombre: string; apellido: string };
      lastChange?: { actorName: string; motivo: string | null } | null;
    };
  }) => (
    <div data-testid="request-card" data-estado={request.estado}>
      {request.profile.nombre} {request.profile.apellido}
      {request.lastChange
        ? ` · último cambio de ${request.lastChange.actorName}${request.lastChange.motivo ? `: ${request.lastChange.motivo}` : ""}`
        : null}
    </div>
  ),
}));

import AdminMembresiasPage from "../membresias/page";

const EN_CURSO = { searchParams: Promise.resolve({}) };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
  mocks.notesResponse = Promise.resolve({ data: [], error: null });
  mocks.eventsResponse = Promise.resolve({ data: [], error: null });
  mocks.historyResponse = Promise.resolve({ data: [] });
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
    render(await AdminMembresiasPage(EN_CURSO));
    expect(screen.getByText("Panel de admin")).toBeInTheDocument();
  });

  it("renders solicitudes pendientes section title", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage(EN_CURSO));
    expect(screen.getByText("Solicitudes pendientes")).toBeInTheDocument();
    expect(screen.getByText("Turistas esperando ser Serranos")).toBeInTheDocument();
  });

  it("renders segmented tabs with Membresías active and Roles inactive", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage(EN_CURSO));
    expect(screen.getByText(/Membresías/)).toBeInTheDocument();
    expect(screen.getByText(/Roles/)).toBeInTheDocument();
  });

  it("selects estado and passes it to each card", async () => {
    setMembershipData(pendingRequests, 2);
    render(await AdminMembresiasPage(EN_CURSO));
    const [select] = mocks.membershipSelect.mock.calls[0];
    expect(select).toMatch(/\bestado\b/);
    expect(screen.getAllByTestId("request-card").map((c) => c.dataset.estado)).toEqual([
      "pendiente_coordinacion",
      "reprogramacion",
    ]);
  });

  it("orders by created_at desc with an id tiebreaker so cards never jump after a transition", async () => {
    render(await AdminMembresiasPage(EN_CURSO));
    expect(mocks.membershipOrder).toHaveBeenNthCalledWith(1, "created_at", { ascending: false });
    expect(mocks.membershipOrder).toHaveBeenNthCalledWith(2, "id", { ascending: true });
  });

  it("renders counter badge with pending count", async () => {
    setMembershipData(pendingRequests, 2);
    render(await AdminMembresiasPage(EN_CURSO));
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders RequestCards for each pending request", async () => {
    setMembershipData(pendingRequests, 2);
    render(await AdminMembresiasPage(EN_CURSO));
    expect(screen.getByText("Sofía Vega")).toBeInTheDocument();
    expect(screen.getByText("Julián Ríos")).toBeInTheDocument();
  });

  it("renders empty state when no pending requests", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage(EN_CURSO));
    expect(screen.getByText("No hay solicitudes pendientes")).toBeInTheDocument();
  });

  it("handles null data from supabase gracefully", async () => {
    mocks.membershipResponse = Promise.resolve({ data: null as unknown as unknown[], count: 0 });
    render(await AdminMembresiasPage(EN_CURSO));
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
    render(await AdminMembresiasPage(EN_CURSO));
    expect(screen.getByText("Sofía Vega")).toBeInTheDocument();
    expect(screen.getAllByTestId("request-card")).toHaveLength(1);
  });

  it("does not render non-admin UI elements", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage(EN_CURSO));
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

    render(await AdminMembresiasPage(EN_CURSO));

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

  it("keeps the internal change log out of applicant-facing code (ZER-169 AC2)", () => {
    const files = [
      "src/app/(app)/profile/page.tsx",
      "src/app/(app)/profile/PendingMembershipCard.tsx",
      "src/features/membership/pipeline-server.ts",
      "src/app/(modal)/solicitar/estado/page.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(path.join(root, file), "utf8");
      expect(source, file).not.toContain("membership_request_events");
      expect(source, file).not.toContain("request-history");
    }
  });
});

describe("AdminMembresiasPage — screening select (ZER-108)", () => {
  it("requests screening columns for pending membership rows", async () => {
    mocks.membershipResponse = Promise.resolve({ data: [], count: 0 });
    await AdminMembresiasPage(EN_CURSO);
    expect(mocks.membershipSelect).toHaveBeenCalled();
    const arg = mocks.membershipSelect.mock.calls[0][0] as string;
    expect(arg).toContain("contacto_whatsapp");
    expect(arg).toContain("frecuencia_uso");
    expect(arg).toContain("reunion_disponibilidad");
    expect(arg).toContain("aporte_actitud");
  });
});

const ADMIN_ACTOR = {
  nombre: "Ana",
  apellido: "Admin",
  apodo: null,
  nombre_visible: "nombre_apellido" as const,
};

function event(overrides: Record<string, unknown>) {
  return {
    id: "ev",
    request_id: "req-1",
    from_estado: null,
    to_estado: "pendiente_coordinacion",
    actor_id: "admin-1",
    motivo: null,
    created_at: "2026-10-01T15:00:00.000Z",
    profiles: ADMIN_ACTOR,
    ...overrides,
  };
}

describe("AdminMembresiasPage — coordination between admins (ZER-169)", () => {
  it("passes each request's last change, with actor and motivo, to its card", async () => {
    setMembershipData(pendingRequests, 2);
    mocks.eventsResponse = Promise.resolve({
      data: [
        event({ id: "ev-1", request_id: "req-2" }),
        event({
          id: "ev-2",
          request_id: "req-2",
          from_estado: "entrevista_coordinada",
          to_estado: "reprogramacion",
          motivo: "Se enfermó",
          created_at: "2026-10-03T15:00:00.000Z",
        }),
      ],
      error: null,
    });

    render(await AdminMembresiasPage(EN_CURSO));

    expect(mocks.eventsIn).toHaveBeenCalledWith("request_id", ["req-1", "req-2"]);
    expect(
      screen.getByText(/Julián Ríos · último cambio de Ana Admin: Se enfermó/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sofía Vega · último cambio/)).not.toBeInTheDocument();
  });

  it("says so when the change log cannot be loaded, without hiding the queue", async () => {
    setMembershipData(pendingRequests, 2);
    mocks.eventsResponse = Promise.resolve({ data: [], error: { message: "boom" } });

    render(await AdminMembresiasPage(EN_CURSO));

    expect(screen.getByText("No pudimos cargar quién hizo el último cambio")).toBeInTheDocument();
    expect(screen.getAllByTestId("request-card")).toHaveLength(2);
  });
});

const closedRequest = {
  id: "req-9",
  estado: "cerrada",
  created_at: "2026-09-20T15:00:00.000Z",
  profiles: {
    id: "p-9",
    nombre: "Martín",
    apellido: "Pérez",
    apodo: null,
    nombre_visible: "nombre_apellido",
    avatar_url: null,
  },
};

describe("AdminMembresiasPage — history view (ZER-169)", () => {
  const historial = (estado?: string) =>
    AdminMembresiasPage({
      searchParams: Promise.resolve({ vista: "historial", ...(estado ? { estado } : {}) }),
    });

  it("links between the in-progress queue and the history", async () => {
    setEmptyMembership();
    render(await AdminMembresiasPage(EN_CURSO));

    expect(screen.getByRole("link", { name: /En curso/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Historial" })).toHaveAttribute(
      "href",
      "/admin/membresias?vista=historial",
    );
  });

  it("finds a closed request with its motivo, actor and date (AC1)", async () => {
    setEmptyMembership();
    mocks.historyResponse = Promise.resolve({ data: [closedRequest] });
    mocks.eventsResponse = Promise.resolve({
      data: [
        event({
          id: "ev-1",
          request_id: "req-9",
          actor_id: "p-9",
          created_at: "2026-09-20T15:00:00.000Z",
          profiles: { ...closedRequest.profiles },
        }),
        event({
          id: "ev-2",
          request_id: "req-9",
          from_estado: "pendiente_coordinacion",
          to_estado: "cerrada",
          motivo: "No respondió en 3 semanas",
          created_at: "2026-10-12T18:30:00.000Z",
        }),
      ],
      error: null,
    });

    render(await historial("cerrada"));

    expect(screen.getByRole("heading", { name: "Historial de solicitudes" })).toBeInTheDocument();
    expect(mocks.historyIn).toHaveBeenCalledWith("estado", ["cerrada"]);
    expect(mocks.historyOrder).toHaveBeenCalledWith("actualizado_en", { ascending: false });
    expect(screen.getByText("Martín Pérez")).toBeInTheDocument();
    expect(screen.getAllByText("Solicitud cerrada").length).toBeGreaterThan(0);
    expect(screen.getByText(/Cerrada por/)).toHaveTextContent(
      /Ana Admin · 12 de oct de 2026, 03:30/,
    );
    expect(screen.getByText("No respondió en 3 semanas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cerradas" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryAllByTestId("request-card")).toHaveLength(0);
    expect(screen.queryByText("Horarios de entrevista")).not.toBeInTheDocument();
  });

  it("shows every final estado by default", async () => {
    setEmptyMembership();
    render(await historial());

    expect(mocks.historyIn).toHaveBeenCalledWith("estado", ["aprobado", "cerrada"]);
    expect(screen.getByRole("link", { name: "Todas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("No hay solicitudes en el historial")).toBeInTheDocument();
  });
});
