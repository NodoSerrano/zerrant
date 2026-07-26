import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskCard } from "./TaskCard";

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
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders SprayCan icon for Limpieza category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Limpieza" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders ShoppingCart icon for Compra category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Compra" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders Settings icon for Mantenimiento category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Mantenimiento" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders MoreHorizontal icon for Otro category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Otro" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("falls back to MoreHorizontal icon for unknown category", () => {
    const { container } = render(<TaskCard {...defaultProps} category="Fantasía" />);
    expect(container.querySelector("svg")).toBeTruthy();
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
});
