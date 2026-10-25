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
  it("asks one short question and links to the benefits page, not the form (ZER-191)", () => {
    render(<SerSerranoCta />);

    expect(screen.getByText("¿Querés conocer los beneficios de ser Serrano?")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Ver beneficios" });
    expect(cta).toHaveAttribute("href", SER_SERRANO_CTA_HREF);
    expect(cta).toHaveAttribute("href", "/ser-serrano");
    expect(screen.queryByRole("link", { name: /Solicitar ser Serrano/i })).not.toBeInTheDocument();
  });

  it("uses brand gradient + on-primary text (no free hex green)", () => {
    const { container } = render(<SerSerranoCta />);
    const root = container.querySelector('[data-testid="ser-serrano-cta"]');
    expect(root).toBeTruthy();
    expect(root?.className).toMatch(/bg-gradient-brand/);
    expect(root?.className).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
