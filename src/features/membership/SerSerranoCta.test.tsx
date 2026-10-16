import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SerSerranoCta } from "./SerSerranoCta";
import { SER_SERRANO_CTA_HREF } from "./ser-serrano-cta";

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

describe("SerSerranoCta (ZER-171)", () => {
  it("renders Spanish copy and links into the membership pipeline", () => {
    render(<SerSerranoCta />);

    expect(screen.getByText("Todavía sos Turista")).toBeInTheDocument();
    expect(screen.getByText(/Sumate como Serrano para aparecer en el plantel/)).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: /Solicitar ser Serrano/i });
    expect(cta).toHaveAttribute("href", SER_SERRANO_CTA_HREF);
    expect(cta).toHaveAttribute("href", "/solicitar");
  });

  it("uses brand gradient + on-primary text (no free hex green)", () => {
    const { container } = render(<SerSerranoCta />);
    const root = container.querySelector('[data-testid="ser-serrano-cta"]');
    expect(root).toBeTruthy();
    expect(root?.className).toMatch(/bg-gradient-brand/);
    expect(root?.className).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
