import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  single: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mocks.single })) })),
    })),
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import SerSerranoPage from "./page";

function asTourist() {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
  mocks.single.mockResolvedValue({ data: { tier: "tourist" }, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SerSerranoPage (ZER-191)", () => {
  it("explains what being Serrano gives, the contribution and the process", async () => {
    asTourist();
    render(await SerSerranoPage());

    expect(screen.getByRole("heading", { level: 1, name: "Ser Serrano" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Qué ganás" })).toBeInTheDocument();
    expect(screen.getByText("Aparecer en el plantel")).toBeInTheDocument();
    expect(screen.getByText("Crear eventos")).toBeInTheDocument();
    expect(screen.getByText("Participar de los proyectos")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Aporte de referencia" })).toBeInTheDocument();
    expect(screen.getByText(/Mantener Nodo abierto tiene costos importantes/)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Cómo sigue" })).toBeInTheDocument();
    for (const step of ["Solicitud", "Horario", "Entrevista", "Resolución", "Miembro"]) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });

  it("offers to apply only after all the information", async () => {
    asTourist();
    render(await SerSerranoPage());

    const apply = screen.getByRole("link", { name: "Solicitar ser Serrano" });
    expect(apply).toHaveAttribute("href", "/solicitar");
    for (const heading of screen.getAllByRole("heading", { level: 2 })) {
      expect(heading.compareDocumentPosition(apply)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
  });

  it("sends members back to Inicio", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    mocks.single.mockResolvedValue({ data: { tier: "standard" }, error: null });

    await expect(SerSerranoPage()).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("asks to log in first, coming back here afterwards", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(SerSerranoPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login?next=%2Fser-serrano");
  });
});
