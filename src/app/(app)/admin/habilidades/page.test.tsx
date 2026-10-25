import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  skillsSelect: vi.fn(),
  skillsEq: vi.fn(),
  skillsOrder: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: mocks.skillsSelect.mockImplementation(() => ({
        eq: mocks.skillsEq.mockImplementation(() => ({ order: mocks.skillsOrder })),
      })),
    })),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/admin/SkillReviewRow", () => ({
  SkillReviewRow: ({ skillId, nombre, proposedBy }: Record<string, string>) => (
    <li data-testid="review-row" data-skill-id={skillId}>
      {nombre} · {proposedBy}
    </li>
  ),
}));

import AdminHabilidadesPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminHabilidadesPage (ZER-163)", () => {
  it("lists pending proposals oldest first, with who proposed them", async () => {
    mocks.skillsOrder.mockResolvedValue({
      data: [
        {
          id: "k1",
          nombre: "Cerámica",
          created_at: "2026-10-20T15:00:00.000Z",
          profiles: { nombre: "Lucía", apellido: "Gómez", apodo: "Lu", nombre_visible: "apodo" },
        },
        { id: "k2", nombre: "Telar", created_at: "2026-10-20T16:00:00.000Z", profiles: null },
      ],
      error: null,
    });

    render(await AdminHabilidadesPage());

    expect(mocks.skillsEq).toHaveBeenCalledWith("estado", "pendiente");
    expect(mocks.skillsOrder).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(screen.getByRole("heading", { name: "Habilidades propuestas" })).toBeInTheDocument();
    expect(screen.getAllByTestId("review-row").map((row) => row.textContent)).toEqual([
      "Cerámica · Lu",
      "Telar · Alguien que ya no está",
    ]);
  });

  it("links back to the other admin tabs", async () => {
    mocks.skillsOrder.mockResolvedValue({ data: [], error: null });

    render(await AdminHabilidadesPage());

    expect(screen.getByRole("link", { name: /Membresías/ })).toHaveAttribute(
      "href",
      "/admin/membresias",
    );
    expect(screen.getByRole("link", { name: /Roles/ })).toHaveAttribute("href", "/admin/roles");
  });

  it("explains an empty queue", async () => {
    mocks.skillsOrder.mockResolvedValue({ data: [], error: null });

    render(await AdminHabilidadesPage());

    expect(screen.getByText("No hay habilidades esperando revisión")).toBeInTheDocument();
  });

  it("says when the queue cannot be read", async () => {
    mocks.skillsOrder.mockResolvedValue({ data: null, error: { message: "boom" } });

    render(await AdminHabilidadesPage());

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar las propuestas");
  });
});
