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
    render(<SerranoMenu />);
    const toggle = screen.getByRole("button", { name: /modo oscuro|modo claro/i });
    expect(toggle.innerHTML).not.toMatch(/\bbg-white\b/);
    expect(toggle.innerHTML).toMatch(/\bbg-surface\b/);
  });
});

describe("SerranoMenu Panel de admin row (ZER-111)", () => {
  it("links platform admins to /admin/membresias with full opacity", () => {
    render(<SerranoMenu isPlatformAdmin />);

    const link = screen.getByRole("link", { name: /Panel de admin/i });
    expect(link).toHaveAttribute("href", "/admin/membresias");
    expect(link.className).not.toMatch(/\/40/);
    expect(link.innerHTML).not.toMatch(/\/40/);
    expect(link.querySelector("svg.lucide-chevron-right")).toBeTruthy();
  });

  it("hides the admin entry when the viewer is not a platform admin", () => {
    const { container } = render(<SerranoMenu />);

    expect(screen.queryByRole("link", { name: /Panel de admin/i })).toBeNull();
    expect(container.textContent).not.toMatch(/Panel de admin/i);
  });

  it("hides the admin entry when isPlatformAdmin is explicitly false", () => {
    const { container } = render(<SerranoMenu isPlatformAdmin={false} />);

    expect(screen.queryByRole("link", { name: /Panel de admin/i })).toBeNull();
    expect(container.textContent).not.toMatch(/Panel de admin/i);
  });
});
