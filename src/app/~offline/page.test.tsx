import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OfflinePage from "./page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("/~offline shell fallback page", () => {
  it("renders the offline shell surface for Serwist navigation fallback", () => {
    render(<OfflinePage />);

    expect(screen.getByRole("heading", { name: "Sin conexión" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Reintentar/i })).toHaveAttribute("href", "/");
  });
});
