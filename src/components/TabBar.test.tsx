import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TabBar", () => {
  it("renders four destinations with uppercase labels including INICIO and no NODO", () => {
    render(<TabBar />);
    for (const label of ["INICIO", "PLANTEL", "AGENDA", "PERFIL"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("NODO")).not.toBeInTheDocument();
  });

  it("renders lucide icons (no emoji)", () => {
    render(<TabBar />);
    const inicio = screen.getByRole("link", { name: /INICIO/i });
    expect(inicio.querySelector("svg")).toBeInTheDocument();
    expect(inicio).not.toHaveTextContent("🏠");
  });

  it("renders all four destinations as real links with href", () => {
    render(<TabBar />);
    expect(screen.getByRole("link", { name: /INICIO/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /PLANTEL/i })).toHaveAttribute("href", "/plantel");
    expect(screen.getByRole("link", { name: /AGENDA/i })).toHaveAttribute("href", "/agenda");
    expect(screen.getByRole("link", { name: /PERFIL/i })).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("link", { name: /NODO/i })).not.toBeInTheDocument();
  });

  it("does not render any tab as a button", () => {
    render(<TabBar />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("active tab has bg-primary pill and text-on-primary", () => {
    render(<TabBar active="inicio" />);
    const active = screen.getByRole("link", { name: /INICIO/i });
    expect(active).toHaveClass("bg-primary");
    expect(active).toHaveClass("text-on-primary");
    expect(active).toHaveClass("rounded-[26px]");
  });

  it("active pill is vertically inset by the Pencil pill padding (p-1 / 4px)", () => {
    render(<TabBar active="inicio" />);
    const nav = screen.getByRole("navigation");
    const pill = nav.firstElementChild as HTMLElement;
    const active = screen.getByRole("link", { name: /INICIO/i });

    expect(pill).toHaveClass("p-1");
    expect(active).toHaveClass("h-full");
    expect(active).toHaveClass("self-stretch");
  });

  it("inactive tabs have text-text-muted and no bg-primary", () => {
    render(<TabBar active="inicio" />);
    const inactive = screen.getByRole("link", { name: /PLANTEL/i });
    expect(inactive).toHaveClass("text-text-muted");
    expect(inactive).not.toHaveClass("bg-primary");
  });

  it("container has rounded-[36px] pill with shadow, border, and 62px height", () => {
    render(<TabBar />);
    const nav = screen.getByRole("navigation");
    const pill = nav.firstElementChild as HTMLElement;
    expect(pill).toHaveClass("rounded-[36px]");
    expect(pill).toHaveClass("bg-surface");
    expect(pill).toHaveClass("border-border");
    expect(pill).toHaveClass("h-[62px]");
    expect(pill).toHaveClass("p-1");
    expect(pill.className).toContain("shadow-[0_8px_24px_-6px_rgba(26,22,20,0.13)]");
  });

  it("outer nav keeps Pencil padding [21,12,21,21] (asymmetric horizontal is intentional)", () => {
    render(<TabBar />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("pt-[21px]");
    expect(nav).toHaveClass("pr-[12px]");
    expect(nav).toHaveClass("pb-[21px]");
    expect(nav).toHaveClass("pl-[21px]");
  });
});
