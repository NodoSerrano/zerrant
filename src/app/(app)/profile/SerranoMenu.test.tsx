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

  it("leaves Mis proyectos disabled (owned by story 5.8)", () => {
    render(<SerranoMenu aportesCount={1} />);

    expect(screen.queryByRole("link", { name: /Mis proyectos/i })).not.toBeInTheDocument();
    expect(screen.getByText("Mis proyectos")).toBeInTheDocument();
  });
});
