import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskCard } from "./TaskCard";

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

describe("TaskCard", () => {
  const defaultProps = {
    title: "Arreglar la cerca del huerto",
    category: "Reparación",
    timeAgo: "hace 2 días",
    estado: "abierta" as const,
    urgencia: "alta" as const,
    actionLabel: "Tomar",
  };

  it("renders title", () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText("Arreglar la cerca del huerto")).toBeInTheDocument();
  });

  it("renders meta text with category and timeAgo", () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText("Reparación · hace 2 días")).toBeInTheDocument();
  });

  it("renders actionLabel button text", () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText("Tomar")).toBeInTheDocument();
  });

  it("renders estado label for abierta", () => {
    render(<TaskCard {...defaultProps} estado="abierta" />);
    expect(screen.getByText("Abierta")).toBeInTheDocument();
  });

  it("renders estado label for tomada", () => {
    render(<TaskCard {...defaultProps} estado="tomada" />);
    expect(screen.getByText("Tomada")).toBeInTheDocument();
  });

  it("renders estado label for hecha", () => {
    render(<TaskCard {...defaultProps} estado="hecha" />);
    expect(screen.getByText("Hecha")).toBeInTheDocument();
  });

  it("estado abierta has correct chip colors", () => {
    render(<TaskCard {...defaultProps} estado="abierta" />);
    const chip = screen.getByText("Abierta");
    expect(chip).toHaveClass("bg-blue-raw/20");
    expect(chip).toHaveClass("text-brand-blue");
  });

  it("estado tomada has correct chip colors", () => {
    render(<TaskCard {...defaultProps} estado="tomada" />);
    const chip = screen.getByText("Tomada");
    expect(chip).toHaveClass("bg-coral/20");
    expect(chip).toHaveClass("text-coral");
  });

  it("estado hecha has correct chip colors", () => {
    render(<TaskCard {...defaultProps} estado="hecha" />);
    const chip = screen.getByText("Hecha");
    expect(chip).toHaveClass("bg-mint-raw/20");
    expect(chip).toHaveClass("text-brand-mint");
  });

  it("renders urgencia alta with correct colors and label", () => {
    render(<TaskCard {...defaultProps} urgencia="alta" />);
    expect(screen.getByText("Urgencia alta")).toBeInTheDocument();
    expect(screen.getByText("Urgencia alta")).toHaveClass("text-warm-orange");
  });

  it("renders urgencia media with correct colors and label", () => {
    render(<TaskCard {...defaultProps} urgencia="media" />);
    expect(screen.getByText("Urgencia media")).toBeInTheDocument();
    expect(screen.getByText("Urgencia media")).toHaveClass("text-warm-yellow");
  });

  it("renders urgencia baja with correct colors and label", () => {
    render(<TaskCard {...defaultProps} urgencia="baja" />);
    expect(screen.getByText("Urgencia baja")).toBeInTheDocument();
    expect(screen.getByText("Urgencia baja")).toHaveClass("text-text-muted");
  });

  it("renders Wrench icon for Reparación category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Reparación" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("class")).toContain("lucide-wrench");
  });

  it("renders SprayCan icon for Limpieza category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Limpieza" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("class")).toContain("lucide-spray-can");
  });

  it("renders ShoppingCart icon for Compra category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Compra" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("class")).toContain("lucide-shopping-cart");
  });

  it("renders Settings icon for Mantenimiento category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Mantenimiento" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("class")).toContain("lucide-settings");
  });

  it("renders MoreHorizontal icon for Otro category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Otro" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("class")).toContain("lucide-ellipsis");
  });

  it("falls back to MoreHorizontal icon for unknown category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Fantasía" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("class")).toContain("lucide-ellipsis");
  });

  it("calls onAction when action button is clicked", () => {
    const onAction = vi.fn();
    render(<TaskCard {...defaultProps} onAction={onAction} />);
    fireEvent.click(screen.getByText("Tomar"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not throw when onAction is omitted", () => {
    expect(() => render(<TaskCard {...defaultProps} onAction={undefined} />)).not.toThrow();
    expect(screen.getByText("Tomar")).toBeInTheDocument();
  });

  it("merges custom className without clobbering base classes", () => {
    const { container } = render(<TaskCard {...defaultProps} className="my-custom" />);
    const card = container.firstElementChild as HTMLElement;
    expect(card).toHaveClass("my-custom");
    expect(card).toHaveClass("rounded-[20px]");
  });

  it("card root has Pencil design classes", () => {
    const { container } = render(<TaskCard {...defaultProps} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card).toHaveClass("rounded-[20px]");
    expect(card).toHaveClass("bg-surface");
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("border-border");
    expect(card).toHaveClass("p-4");
    expect(card).toHaveClass("gap-3");
  });

  it("renders Flame icon for urgency", () => {
    const { container } = render(<TaskCard {...defaultProps} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it("sets title attribute on truncated title span", () => {
    render(<TaskCard {...defaultProps} title="Arreglar la cerca del huerto" />);
    const titleEl = screen.getByText("Arreglar la cerca del huerto");
    expect(titleEl).toHaveAttribute("title", "Arreglar la cerca del huerto");
  });

  it("renders category icon with aria-hidden", () => {
    const { container } = render(<TaskCard {...defaultProps} />);
    const icons = container.querySelectorAll("svg");
    icons.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("renders empty title without crashing", () => {
    expect(() => render(<TaskCard {...defaultProps} title="" />)).not.toThrow();
    expect(screen.getByText("Reparación · hace 2 días")).toBeInTheDocument();
  });

  it("renders empty actionLabel without crashing", () => {
    expect(() => render(<TaskCard {...defaultProps} actionLabel="" />)).not.toThrow();
    expect(screen.getByText("Abierta")).toBeInTheDocument();
  });

  it("renders empty timeAgo without crashing", () => {
    expect(() => render(<TaskCard {...defaultProps} timeAgo="" />)).not.toThrow();
    expect(screen.getByText("Reparación ·")).toBeInTheDocument();
  });

  it("renders empty category without crashing", () => {
    expect(() => render(<TaskCard {...defaultProps} category="" />)).not.toThrow();
    expect(screen.getByText(/hace 2 días/)).toBeInTheDocument();
  });

  // Props come typed, but the source data is a Postgres enum that can grow
  // via migration. If the component indexes without a fallback, the new value
  // crashes it and takes down the screen that renders it.
  it("falls back to the 'Abierta' badge for an estado it does not know", () => {
    const unknownEstado = "archivada" as unknown as typeof defaultProps.estado;
    render(<TaskCard {...defaultProps} estado={unknownEstado} />);

    const badge = screen.getByText("Abierta");
    expect(badge.className).toContain("bg-blue-raw/20");
    expect(badge.className).toContain("text-brand-blue");
  });

  // Pencil didn't design a chip for "cancelada". The DS's neutral pair
  // (`surface-inset` / `text-muted`) is what the system already uses for
  // inactive things, so the state is derived rather than invented.
  it("renders a neutral 'Cancelada' badge", () => {
    render(<TaskCard {...defaultProps} estado="cancelada" />);

    const badge = screen.getByText("Cancelada");
    expect(badge.className).toContain("bg-surface-inset");
    expect(badge.className).toContain("text-text-muted");
  });

  // The `actionLabel` is set by whoever consumes the card and doesn't always
  // distinguish by state: a cancelled task can arrive with "Tomar". It is
  // still shown —the card is a link to the detail, the label triggers
  // nothing— but dimmed, so it no longer offers an action that is gone.
  it("greys out the action label on a cancelled task", () => {
    render(<TaskCard {...defaultProps} estado="cancelada" actionLabel="Tomar" />);

    const action = screen.getByText("Tomar");
    expect(action.className).toContain("text-text-muted");
    expect(action.className).not.toContain("text-brand-green");
  });

  // The dimming must come from "can this be taken?", not from a list of
  // terminal states: otherwise the next enum value repeats the bug.
  it("greys out the action label on any estado that is not actionable", () => {
    const unknownEstado = "pausada" as unknown as typeof defaultProps.estado;
    render(<TaskCard {...defaultProps} estado={unknownEstado} actionLabel="Tomar" />);

    expect(screen.getByText("Tomar").className).toContain("text-text-muted");
  });

  it("keeps the action label green on a task that is still actionable", () => {
    render(<TaskCard {...defaultProps} estado="abierta" actionLabel="Tomar" />);

    expect(screen.getByText("Tomar").className).toContain("text-brand-green");
  });

  it("falls back to 'Urgencia media' for an urgencia it does not know", () => {
    const unknownUrgencia = "critica" as unknown as typeof defaultProps.urgencia;
    render(<TaskCard {...defaultProps} urgencia={unknownUrgencia} />);

    expect(screen.getByText("Urgencia media").className).toContain("text-warm-yellow");
  });
});

describe("TaskCard href mode", () => {
  const hrefProps = {
    title: "Arreglar la cerca del huerto",
    category: "Reparación",
    timeAgo: "hace 2 días",
    estado: "abierta" as const,
    urgencia: "alta" as const,
    actionLabel: "Tomar",
    href: "/nodo/tasks/abc-123",
  };

  it("renders card as <a> when href is set", () => {
    const { container } = render(<TaskCard {...hrefProps} />);
    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/nodo/tasks/abc-123");
  });

  it("does not render <button> for action when href is set", () => {
    render(<TaskCard {...hrefProps} />);
    expect(screen.getByText("Tomar")).toBeInTheDocument();
    expect(screen.getByText("Tomar").tagName).toBe("SPAN");
  });

  it("renders as <div> when href is not set (backward compat)", () => {
    const { container } = render(<TaskCard {...hrefProps} href={undefined} />);
    expect(container.querySelector("a")).not.toBeInTheDocument();
    expect(container.firstElementChild?.tagName).toBe("DIV");
  });

  it("action button is <button> when href is not set", () => {
    render(<TaskCard {...hrefProps} href={undefined} />);
    expect(screen.getByText("Tomar").tagName).toBe("BUTTON");
  });

  it("merges className on Link wrapper", () => {
    const { container } = render(<TaskCard {...hrefProps} className="my-custom" />);
    const link = container.querySelector("a");
    expect(link).toHaveClass("my-custom");
    expect(link).toHaveClass("rounded-[20px]");
    expect(link).toHaveClass("bg-surface");
  });

  it("preserves card styling classes on link wrapper", () => {
    const { container } = render(<TaskCard {...hrefProps} />);
    const link = container.querySelector("a")!;
    expect(link).toHaveClass("rounded-[20px]");
    expect(link).toHaveClass("bg-surface");
    expect(link).toHaveClass("border");
    expect(link).toHaveClass("p-4");
    expect(link).toHaveClass("gap-3");
    expect(link).toHaveClass("flex");
    expect(link).toHaveClass("flex-col");
  });
});
