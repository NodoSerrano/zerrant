import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  projectMaybeSingle: vi.fn(),
  memberMaybeSingle: vi.fn(),
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
      if (table === "projects") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mocks.projectMaybeSingle,
            })),
          })),
        };
      }
      if (table === "project_members") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: mocks.memberMaybeSingle,
              })),
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

import EditProjectPage from "./page";

const project = {
  id: "proj-1",
  nombre: "Huerta comun",
  descripcion: "Lote 3 del predio",
  estado: "idea",
  ingreso: "aprobacion",
};

async function renderEdit({
  userId = "admin-1" as string | null,
  row = project as typeof project | null,
  membership = { estado: "aprobado", rol: "admin" } as { estado: string; rol: string } | null,
} = {}) {
  mocks.getUser.mockResolvedValue({ data: { user: userId ? { id: userId } : null } });
  mocks.projectMaybeSingle.mockResolvedValue({ data: row, error: null });
  mocks.memberMaybeSingle.mockResolvedValue({ data: membership, error: null });
  const element = await EditProjectPage({ params: Promise.resolve({ id: "proj-1" }) });
  return render(element);
}

beforeEach(() => {
  vi.clearAllMocks();
  actionState.useActionState.mockReturnValue([null, actionState.formAction, false]);
});

describe("EditProjectPage", () => {
  it("redirects a plain member away before showing the form", async () => {
    await expect(
      renderEdit({ membership: { estado: "aprobado", rol: "miembro" } }),
    ).rejects.toThrow("NEXT_REDIRECT:/nodo/projects/proj-1");
  });

  it("shows current metadata and archive for a project admin", async () => {
    await renderEdit();

    expect(screen.getByLabelText("Nombre")).toHaveValue("Huerta comun");
    expect(screen.getByLabelText("Descripción")).toHaveValue("Lote 3 del predio");
    expect(screen.getByRole("radio", { name: "Idea" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Por aprobación" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Archivar proyecto" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archivar proyecto" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: "Sí, archivar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
    expect(screen.getByText(/miembros y las solicitudes/i)).toBeInTheDocument();
    expect(screen.getByText(/Terminado no bloquea/i)).toBeInTheDocument();
  });
});
