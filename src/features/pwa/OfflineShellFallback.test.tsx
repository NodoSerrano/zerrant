import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OfflineShellFallback } from "./OfflineShellFallback";

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

describe("OfflineShellFallback", () => {
  it("renders designed offline copy without inventing a member directory", () => {
    render(<OfflineShellFallback />);

    expect(screen.getByRole("heading", { name: "Sin conexión" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Revisá tu internet\. Mientras tanto te mostramos lo último que guardamos en el dispositivo\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/plantel/i)).not.toBeInTheDocument();
  });

  it("offers a same-origin retry back to start_url", () => {
    render(<OfflineShellFallback />);

    const retry = screen.getByRole("link", { name: /Reintentar/i });
    expect(retry).toHaveAttribute("href", "/");
  });
});
