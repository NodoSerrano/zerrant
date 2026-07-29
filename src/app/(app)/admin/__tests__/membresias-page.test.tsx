import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  membershipResponse: Promise.resolve({ data: [] as unknown[], count: 0 }) as Promise<{ data: unknown[]; count: number }>,
  membershipSelect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: mocks.profilesSelect.mockImplementation(() => ({
            eq: mocks.profilesSelectEq.mockImplementation(() => ({
              single: mocks.profilesSelectSingle,
            })),
          })),
        };
      }
      if (table === "membership_requests") {
        return {
          select: mocks.membershipSelect.mockImplementation(() => ({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn(() => mocks.membershipResponse),
          })),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("@/components/RequestCard", () => ({
  RequestCard: ({ request }: { request: { profile: { nombre: string; apellido: string } } }) => (
    <div data-testid="request-card">{request.profile.nombre} {request.profile.apellido}</div>
  ),
}));

import AdminMembresiasPage from "../membresias/page";
import { redirect } from "next/navigation";

beforeEach(() => {
  vi.clearAllMocks();
});

const adminProfile = {
  id: "admin-1",
  is_platform_admin: true,
  nombre: "Admin",
  apellido: "User",
  tier: "standard",
};

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

function setupAdmin() {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
  mocks.profilesSelectSingle.mockResolvedValue({ data: adminProfile });
}

function setupNonAdmin() {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "regular-1" } } });
  mocks.profilesSelectSingle.mockResolvedValue({
    data: { ...adminProfile, id: "regular-1", is_platform_admin: false },
  });
}

function setMembershipData(data: typeof pendingRequests, count: number) {
  mocks.membershipResponse = Promise.resolve({ data, count });
}

function setEmptyMembership() {
  mocks.membershipResponse = Promise.resolve({ data: [], count: 0 });
}

describe("AdminMembresiasPage", () => {
  it("redirects unauthenticated users to /auth/login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    try {
      await AdminMembresiasPage();
    } catch {
      // redirect throws
    }

    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("redirects non-admin users to /nodo/tasks", async () => {
    setupNonAdmin();

    try {
      await AdminMembresiasPage();
    } catch {
      // redirect throws
    }

    expect(redirect).toHaveBeenCalledWith("/nodo/tasks");
  });

  it("renders page header for admin users", async () => {
    setupAdmin();
    setEmptyMembership();

    render(await AdminMembresiasPage());

    expect(screen.getByText("Panel de admin")).toBeInTheDocument();
  });

  it("renders solicitudes pendientes section title", async () => {
    setupAdmin();
    setEmptyMembership();

    render(await AdminMembresiasPage());

    expect(screen.getByText("Solicitudes pendientes")).toBeInTheDocument();
    expect(screen.getByText("Turistas esperando ser Serranos")).toBeInTheDocument();
  });

  it("renders segmented tabs with Membresías active and Roles inactive", async () => {
    setupAdmin();
    setEmptyMembership();

    render(await AdminMembresiasPage());

    expect(screen.getByText(/Membresías/)).toBeInTheDocument();
    expect(screen.getByText(/Roles/)).toBeInTheDocument();
  });

  it("renders counter badge with pending count", async () => {
    setupAdmin();
    setMembershipData(pendingRequests, 2);

    render(await AdminMembresiasPage());

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders RequestCards for each pending request", async () => {
    setupAdmin();
    setMembershipData(pendingRequests, 2);

    render(await AdminMembresiasPage());

    expect(screen.getByText("Sofía Vega")).toBeInTheDocument();
    expect(screen.getByText("Julián Ríos")).toBeInTheDocument();
  });

  it("renders empty state when no pending requests", async () => {
    setupAdmin();
    setEmptyMembership();

    render(await AdminMembresiasPage());

    expect(screen.getByText("No hay solicitudes pendientes")).toBeInTheDocument();
  });

  it("does not render Serrano-only menu items in admin page", async () => {
    setupAdmin();
    setEmptyMembership();

    render(await AdminMembresiasPage());

    expect(screen.queryByText("Proyectos")).not.toBeInTheDocument();
    expect(screen.queryByText("Aportes")).not.toBeInTheDocument();
  });
});
