import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
  notFound: () => notFound(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <a href={href} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid={`avatar-${name}`}>{name}</div>,
}));

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [null, vi.fn(), false],
}));

vi.mock("@/features/projects/actions", () => ({
  approveProjectJoin: vi.fn(),
  rejectProjectJoin: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import ProjectJoinRequestsPage from "./page";

function mockClient({
  user = { id: "admin-1" } as { id: string } | null,
  project = { id: "proj-1", nombre: "Sitio web de Nodo" } as unknown,
  viewerMembership = { estado: "aprobado", rol: "admin" } as unknown,
  pending = [] as unknown[],
} = {}) {
  let membersCall = 0;
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: project, error: null }),
        };
      }
      if (table === "project_members") {
        membersCall += 1;
        if (membersCall === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: viewerMembership, error: null }),
          };
        }
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: pending, error: null }),
        };
        return chain;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
  vi.mocked(createClient).mockResolvedValue(client as never);
  return client;
}

const pendingRows = [
  {
    profile_id: "u2",
    estado: "pendiente",
    created_at: "2026-09-20T12:00:00Z",
    profiles: {
      id: "u2",
      nombre: "Martín",
      apellido: "Paz",
      apodo: null,
      nombre_visible: "Martín Paz",
      avatar_url: null,
    },
  },
];

describe("ProjectJoinRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated viewers to login", async () => {
    mockClient({ user: null });
    await expect(
      ProjectJoinRequestsPage({ params: Promise.resolve({ id: "proj-1" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("redirects non-admins back to the project detail", async () => {
    mockClient({ viewerMembership: { estado: "aprobado", rol: "miembro" } });
    await expect(
      ProjectJoinRequestsPage({ params: Promise.resolve({ id: "proj-1" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/nodo/projects/proj-1");
  });

  it("calls notFound when the project is missing", async () => {
    mockClient({ project: null });
    await expect(
      ProjectJoinRequestsPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders pending requests with approve and reject affordances", async () => {
    mockClient({ pending: pendingRows });
    const ui = await ProjectJoinRequestsPage({ params: Promise.resolve({ id: "proj-1" }) });
    render(ui);

    expect(screen.getByRole("heading", { name: "Sitio web de Nodo" })).toBeInTheDocument();
    expect(screen.getAllByText("Martín Paz").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
  });

  it("renders empty state when there are no pending requests", async () => {
    mockClient({ pending: [] });
    const ui = await ProjectJoinRequestsPage({ params: Promise.resolve({ id: "proj-1" }) });
    render(ui);
    expect(screen.getByText("No hay solicitudes pendientes")).toBeInTheDocument();
  });
});
