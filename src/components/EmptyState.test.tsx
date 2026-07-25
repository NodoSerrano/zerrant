import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { EmptyState } from "./EmptyState";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EmptyState", () => {
  it("renders the clipboard-list icon inside a 96×96 circle", () => {
    render(<EmptyState subtitle="No hay nada" />);

    const svg = document.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.parentElement?.className).toContain("size-24");
    expect(svg!.parentElement?.className).toContain("rounded-full");
    expect(svg!.parentElement?.className).toContain("bg-surface-inset");
    expect(svg!.classList.contains("text-text-muted")).toBe(true);
  });

  it("renders 'No hay tareas' heading", () => {
    render(<EmptyState subtitle="Nada acá" />);

    expect(screen.getByText("No hay tareas")).toBeInTheDocument();
  });

  it("renders the heading with font-display text-[20px] font-bold", () => {
    render(<EmptyState subtitle="Nada acá" />);

    const heading = screen.getByText("No hay tareas");
    expect(heading.className).toContain("font-display");
    expect(heading.className).toContain("text-[20px]");
    expect(heading.className).toContain("font-bold");
    expect(heading.className).toContain("text-text-primary");
  });

  it("renders the subtitle text", () => {
    render(<EmptyState subtitle="Cuando alguien publique una tarea, va a aparecer acá." />);

    expect(
      screen.getByText("Cuando alguien publique una tarea, va a aparecer acá."),
    ).toBeInTheDocument();
  });

  it("renders subtitle with font-body text-sm text-text-secondary leading-relaxed text-center", () => {
    render(<EmptyState subtitle="Subtítulo" />);

    const subtitle = screen.getByText("Subtítulo");
    expect(subtitle.className).toContain("font-body");
    expect(subtitle.className).toContain("text-sm");
    expect(subtitle.className).toContain("text-text-secondary");
    expect(subtitle.className).toContain("leading-relaxed");
    expect(subtitle.className).toContain("text-center");
  });

  it("renders the CTA button with default label and plus icon", () => {
    render(<EmptyState subtitle="No hay nada" />);

    const btn = screen.getByRole("button", { name: /Publicar tarea/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("rounded-pill");
    expect(btn.className).toContain("bg-linear-to-br");
    expect(btn.className).toContain("from-brand-green");
    expect(btn.className).toContain("to-brand-blue");
    expect(btn.className).toContain("text-on-primary");
    expect(btn.className).toContain("h-12");

    // plus icon inside button
    const svgs = btn.querySelectorAll("svg");
    expect(svgs.length).toBe(1);
    expect(svgs[0].classList.contains("text-on-primary")).toBe(true);
  });

  it("renders custom action label", () => {
    render(<EmptyState subtitle="Vacío" actionLabel="Crear algo" />);

    expect(screen.getByRole("button", { name: /Crear algo/i })).toBeInTheDocument();
  });

  it("calls onAction when CTA button is clicked", () => {
    const onAction = vi.fn();
    render(<EmptyState subtitle="Vacío" onAction={onAction} />);

    fireEvent.click(screen.getByRole("button", { name: /Publicar tarea/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not throw when onAction is not provided", () => {
    render(<EmptyState subtitle="Vacío" />);

    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: /Publicar tarea/i }));
    }).not.toThrow();
  });

  it("merges custom className on container", () => {
    render(<EmptyState subtitle="Vacío" className="my-custom" />);

    const container = screen.getByText("No hay tareas").parentElement?.parentElement;
    expect(container?.className).toContain("my-custom");
  });
});
