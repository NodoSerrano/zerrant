import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SerranoMenu } from "./SerranoMenu";

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

vi.mock("@/lib/useTheme", () => ({
  useTheme: () => ({ dark: false, toggle: vi.fn() }),
}));

vi.mock("@/features/auth/actions", () => ({
  signOut: vi.fn(),
}));

describe("SerranoMenu Mis aportes row", () => {
  it("links to /profile/aportes with a numeric count and no disabled /40 classes", () => {
    render(<SerranoMenu aportesCount={4} />);

    const link = screen.getByRole("link", { name: /Mis aportes/i });
    expect(link).toHaveAttribute("href", "/profile/aportes");
    expect(link.className).not.toMatch(/\/40/);
    expect(link.innerHTML).not.toMatch(/\/40/);

    expect(link).toHaveTextContent("4");
    expect(link).not.toHaveTextContent("—");
  });

  it("shows real 0 when the viewer has no aportes", () => {
    render(<SerranoMenu aportesCount={0} />);

    const link = screen.getByRole("link", { name: /Mis aportes/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("0");
    expect(link).not.toHaveTextContent("—");
  });
});

describe("SerranoMenu Mis proyectos row", () => {
  it("links to /profile/proyectos with a numeric count and no disabled /40 classes", () => {
    render(<SerranoMenu proyectosCount={3} />);

    const link = screen.getByRole("link", { name: /Mis proyectos/i });
    expect(link).toHaveAttribute("href", "/profile/proyectos");
    expect(link.className).not.toMatch(/\/40/);
    expect(link.innerHTML).not.toMatch(/\/40/);

    expect(link).toHaveTextContent("3");
    expect(link).not.toHaveTextContent("—");
  });

  it("shows real 0 when the viewer has no approved projects", () => {
    render(<SerranoMenu proyectosCount={0} />);

    const link = screen.getByRole("link", { name: /Mis proyectos/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("0");
    expect(link).not.toHaveTextContent("—");
  });
});

describe("SerranoMenu theme toggle (ZER-103)", () => {
  it("uses surface token for the switch knob, not bg-white", () => {
    const { container } = render(<SerranoMenu />);
    const toggle = screen.getByRole("button", { name: /modo oscuro|modo claro/i });
    expect(toggle.innerHTML).not.toMatch(/\bbg-white\b/);
    expect(toggle.innerHTML).toMatch(/\bbg-surface\b/);
  });
});
