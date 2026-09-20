import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesEq: vi.fn(),
  profilesSingle: vi.fn(),
  aportesSelect: vi.fn(),
  aportesEq: vi.fn(),
  aportesOrder: vi.fn(),
  redirect: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import MisAportesPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.profilesSingle.mockResolvedValue({ data: { tier: "standard" }, error: null });
  mocks.aportesOrder.mockResolvedValue({ data: [], error: null });

  mocks.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: mocks.profilesSelect.mockImplementation(() => ({
          eq: mocks.profilesEq.mockImplementation(() => ({ single: mocks.profilesSingle })),
        })),
      };
    }
    if (table === "aportes") {
      return {
        select: mocks.aportesSelect.mockImplementation(() => ({
          eq: mocks.aportesEq.mockImplementation(() => ({
            order: mocks.aportesOrder,
          })),
        })),
      };
    }
    return {};
  });
});

describe("MisAportesPage", () => {
  it("redirects unauthenticated users to login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(MisAportesPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("redirects tourists to /profile", async () => {
    mocks.profilesSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    await expect(MisAportesPage()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("queries only the viewer aportes ordered by fecha desc", async () => {
    mocks.aportesOrder.mockResolvedValue({
      data: [
        {
          id: "a2",
          tipo: "charla",
          descripcion: "Charla ZK",
          monto: null,
          fecha: "2026-07-24",
        },
        {
          id: "a1",
          tipo: "donacion",
          descripcion: "Donó un proyector",
          monto: null,
          fecha: "2026-07-12",
        },
      ],
      error: null,
    });

    const el = await MisAportesPage();
    render(el);

    expect(mocks.aportesSelect).toHaveBeenCalledWith("id, tipo, descripcion, monto, fecha");
    expect(mocks.aportesEq).toHaveBeenCalledWith("profile_id", "user-1");
    expect(mocks.aportesOrder).toHaveBeenCalledWith("fecha", { ascending: false });

    expect(screen.getByText("Charla ZK")).toBeInTheDocument();
    expect(screen.getByText("Donó un proyector")).toBeInTheDocument();
  });

  it("renders empty state without tasks copy or payment affordances", async () => {
    mocks.aportesOrder.mockResolvedValue({ data: [], error: null });

    const el = await MisAportesPage();
    render(el);

    expect(screen.queryByText("No hay tareas")).not.toBeInTheDocument();
    expect(screen.getByText(/No hay aportes/i)).toBeInTheDocument();
    expect(screen.queryByText(/pagar|checkout|cobrar|wallet/i)).not.toBeInTheDocument();
  });

  it("renders null-monto rows without an amount slot and keeps zero monto", async () => {
    mocks.aportesOrder.mockResolvedValue({
      data: [
        {
          id: "n1",
          tipo: "donacion",
          descripcion: "Sin monto",
          monto: null,
          fecha: "2026-07-10",
        },
        {
          id: "z1",
          tipo: "economico",
          descripcion: "Monto cero",
          monto: 0,
          fecha: "2026-07-09",
        },
      ],
      error: null,
    });

    const el = await MisAportesPage();
    render(el);

    expect(screen.getByText("Sin monto")).toBeInTheDocument();
    expect(screen.getByText("Monto cero")).toBeInTheDocument();
    expect(screen.getByText(/\$0/)).toBeInTheDocument();

    const nullRow = screen.getByText("Sin monto").closest('[data-testid="aporte-item"]');
    expect(nullRow?.textContent).not.toMatch(/\$/);
  });

  it("shows total count summary matching the list length", async () => {
    mocks.aportesOrder.mockResolvedValue({
      data: [
        {
          id: "a1",
          tipo: "yerba",
          descripcion: "Yerba mate",
          monto: null,
          fecha: "2026-07-01",
        },
      ],
      error: null,
    });

    const el = await MisAportesPage();
    render(el);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/aportes en total/i)).toBeInTheDocument();
  });
});
