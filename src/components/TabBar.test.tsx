import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TabBar, type Tab } from "./TabBar";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    onClick,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TabBar", () => {
  it("renders all 5 tabs with uppercase labels", () => {
    render(<TabBar />);
    for (const label of ["INICIO", "PLANTEL", "NODO", "AGENDA", "PERFIL"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders lucide icons (no emoji)", () => {
    render(<TabBar />);
    const plantel = screen.getByRole("link", { name: /PLANTEL/i });
    expect(plantel.querySelector("svg")).toBeInTheDocument();
    expect(plantel).not.toHaveTextContent("👥");
  });

  it("renders PLANTEL as a link to /plantel", () => {
    render(<TabBar />);
    const plantel = screen.getByRole("link", { name: /PLANTEL/i });
    expect(plantel).toHaveAttribute("href", "/plantel");
  });

  it("renders the other built routes as links", () => {
    render(<TabBar />);
    expect(screen.getByRole("link", { name: /INICIO/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /NODO/i })).toHaveAttribute("href", "/nodo/tasks");
    expect(screen.getByRole("link", { name: /PERFIL/i })).toHaveAttribute("href", "/profile");
  });

  it("keeps AGENDA as a button (no route yet)", () => {
    render(<TabBar />);
    expect(screen.getByRole("button", { name: /AGENDA/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /AGENDA/i })).not.toBeInTheDocument();
  });

  it("active tab has bg-primary pill and text-on-primary", () => {
    render(<TabBar active="plantel" />);
    const active = screen.getByRole("link", { name: /PLANTEL/i });
    expect(active).toHaveClass("bg-primary");
    expect(active).toHaveClass("text-on-primary");
    expect(active).toHaveClass("rounded-[26px]");
  });

  it("inactive tabs have text-text-muted and no bg-primary", () => {
    render(<TabBar active="plantel" />);
    const inactive = screen.getByRole("link", { name: /INICIO/i });
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

  it("outer nav has Pencil padding", () => {
    render(<TabBar />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("pt-[21px]");
    expect(nav).toHaveClass("pr-[12px]");
    expect(nav).toHaveClass("pb-[21px]");
    expect(nav).toHaveClass("pl-[21px]");
  });

  it("calls onTabChange for the non-link agenda tab", () => {
    const onTabChange = vi.fn();
    render(<TabBar onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole("button", { name: /AGENDA/i }));
    expect(onTabChange).toHaveBeenCalledWith("agenda" as Tab);
  });
});
