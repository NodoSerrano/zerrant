import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  eventMaybeSingle: vi.fn(),
  profileMaybeSingle: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "events") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mocks.eventMaybeSingle,
            })),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mocks.profileMaybeSingle,
            })),
          })),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mocks.redirect(url),
  notFound: () => mocks.notFound(),
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

const actionState = vi.hoisted(() => ({
  useActionState: vi.fn(),
  formAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => actionState.useActionState(...args),
  };
});

import EditEventPage from "./page";

const CREATOR = "creator-1";

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt-1",
    titulo: "Charla: ZK Proofs",
    descripcion: "Una intro práctica.",
    lugar: "Espacio Nodo",
    inicio: "2026-09-20T22:00:00.000Z",
    fin: "2026-09-21T00:00:00.000Z",
    creado_por: CREATOR,
    ...overrides,
  };
}

async function renderEdit({
  event = makeEvent(),
  viewerId = CREATOR,
  isPlatformAdmin = false,
}: {
  event?: Record<string, unknown> | null;
  viewerId?: string | null;
  isPlatformAdmin?: boolean;
} = {}) {
  mocks.getUser.mockResolvedValue({ data: { user: viewerId ? { id: viewerId } : null } });
  mocks.eventMaybeSingle.mockResolvedValue({ data: event, error: null });
  mocks.profileMaybeSingle.mockResolvedValue({
    data: viewerId ? { is_platform_admin: isPlatformAdmin } : null,
    error: null,
  });
  const element = await EditEventPage({ params: Promise.resolve({ id: "evt-1" }) });
  return render(element);
}

beforeEach(() => {
  vi.clearAllMocks();
  actionState.useActionState.mockReturnValue([null, actionState.formAction, false]);
});

describe("EditEventPage", () => {
  it("redirects unauthenticated users to login", async () => {
    await expect(renderEdit({ viewerId: null })).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("returns notFound when the event does not exist", async () => {
    await expect(renderEdit({ event: null })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sends a non-creator non-admin back to the detail screen", async () => {
    await expect(renderEdit({ viewerId: "other-serrano" })).rejects.toThrow(
      "NEXT_REDIRECT:/agenda/evt-1",
    );
  });

  it("lets the creator through with prefilled fields and delete affordance", async () => {
    const { container } = await renderEdit();

    expect(screen.getByRole("heading", { name: "Editar evento" })).toBeTruthy();
    expect(screen.getByLabelText("Título")).toHaveValue("Charla: ZK Proofs");
    expect(screen.getByLabelText("Descripción")).toHaveValue("Una intro práctica.");
    expect(screen.getByLabelText("Lugar")).toHaveValue("Espacio Nodo");
    expect(screen.getByLabelText("Fecha")).toHaveValue("2026-09-20");
    expect(screen.getByLabelText("Inicio")).toHaveValue("19:00");
    expect(screen.getByLabelText("Fin")).toHaveValue("21:00");
    expect(container.querySelector('input[name="eventId"]')).toHaveValue("evt-1");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Eliminar evento/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Volver al evento" })).toHaveAttribute(
      "href",
      "/agenda/evt-1",
    );
  });

  it("lets a platform admin edit someone else's event", async () => {
    await renderEdit({ viewerId: "admin-1", isPlatformAdmin: true });
    expect(screen.getByRole("heading", { name: "Editar evento" })).toBeTruthy();
    expect(screen.getByLabelText("Título")).toHaveValue("Charla: ZK Proofs");
  });
});
