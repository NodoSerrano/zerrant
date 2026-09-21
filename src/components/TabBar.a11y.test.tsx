import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TabBar } from "./TabBar";

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

describe("TabBar a11y (ZER-104)", () => {
  it("marks tab icons decorative so link names stay the visible labels", () => {
    render(<TabBar />);
    const inicio = screen.getByRole("link", { name: /^INICIO$/i });
    const svg = inicio.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps all five destinations as real named links for keyboard users", () => {
    render(<TabBar active="inicio" />);
    for (const [label, href] of [
      ["INICIO", "/"],
      ["PLANTEL", "/plantel"],
      ["NODO", "/nodo/tasks"],
      ["AGENDA", "/agenda"],
      ["PERFIL", "/profile"],
    ] as const) {
      const link = screen.getByRole("link", { name: new RegExp(`^${label}$`, "i") });
      expect(link).toHaveAttribute("href", href);
    }
  });
});
