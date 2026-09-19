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
  it("renders the four built destinations with uppercase labels", () => {
    render(<TabBar />);
    for (const label of ["PLANTEL", "NODO", "AGENDA", "PERFIL"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("does not render the non-functional INICIO tab while / only redirects to profile", () => {
    render(<TabBar />);
    expect(screen.queryByText("INICIO")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /INICIO/i })).not.toBeInTheDocument();
  });

  it("renders lucide icons (no emoji)", () => {
    render(<TabBar />);
    const plantel = screen.getByRole("link", { name: /PLANTEL/i });
    expect(plantel.querySelector("svg")).toBeInTheDocument();
    expect(plantel).not.toHaveTextContent("👥");
  });

  it("renders all four destinations as real links with href", () => {
    render(<TabBar />);
    expect(screen.getByRole("link", { name: /PLANTEL/i })).toHaveAttribute("href", "/plantel");
    expect(screen.getByRole("link", { name: /NODO/i })).toHaveAttribute("href", "/nodo/tasks");
    expect(screen.getByRole("link", { name: /AGENDA/i })).toHaveAttribute("href", "/agenda");
    expect(screen.getByRole("link", { name: /PERFIL/i })).toHaveAttribute("href", "/profile");
  });

  it("does not render any tab as a button", () => {
    render(<TabBar />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("active tab has bg-primary pill and text-on-primary", () => {
    render(<TabBar active="plantel" />);
    const active = screen.getByRole("link", { name: /PLANTEL/i });
    expect(active).toHaveClass("bg-primary");
    expect(active).toHaveClass("text-on-primary");
    expect(active).toHaveClass("rounded-[26px]");
  });

  it("active pill is vertically inset by the Pencil pill padding (p-1 / 4px)", () => {
    render(<TabBar active="plantel" />);
    const nav = screen.getByRole("navigation");
    const pill = nav.firstElementChild as HTMLElement;
    const active = screen.getByRole("link", { name: /PLANTEL/i });

    // Pencil TabBar pill frame YCyBk: padding 4 on all sides.
    expect(pill).toHaveClass("p-1");
    // Tabs fill the padded area so the colored shape breathes inside the 62px bar.
    expect(active).toHaveClass("h-full");
    expect(active).toHaveClass("self-stretch");
  });

  it("inactive tabs have text-text-muted and no bg-primary", () => {
    render(<TabBar active="plantel" />);
    const inactive = screen.getByRole("link", { name: /NODO/i });
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
