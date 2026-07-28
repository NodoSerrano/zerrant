import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { EmptyState } from "./EmptyState";

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
    render(<EmptyState subtitle="No hay nada" actionLabel="Publicar tarea" onAction={() => {}} />);

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
    render(<EmptyState subtitle="Vacio" actionLabel="Crear algo" onAction={() => {}} />);

    expect(screen.getByRole("button", { name: /Crear algo/i })).toBeInTheDocument();
  });

  it("calls onAction when CTA button is clicked", () => {
    const onAction = vi.fn();
    render(<EmptyState subtitle="Vacio" actionLabel="Publicar tarea" onAction={onAction} />);

    fireEvent.click(screen.getByRole("button", { name: /Publicar tarea/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not render button when no onAction and no href", () => {
    render(<EmptyState subtitle="Vacio" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("merges custom className on container", () => {
    render(<EmptyState subtitle="Vacio" className="my-custom" onAction={() => {}} />);

    const container = screen.getByText("No hay tareas").parentElement?.parentElement;
    expect(container?.className).toContain("my-custom");
  });
});

describe("EmptyState href mode", () => {
  it("renders action as a link when href is set", () => {
    render(<EmptyState subtitle="test" href="/nodo/tasks/new" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/nodo/tasks/new");
    expect(link).toHaveClass("bg-linear-to-br");
    expect(link).toHaveClass("from-brand-green");
    expect(link).toHaveClass("to-brand-blue");
  });

  it("does not render button when href is set", () => {
    render(<EmptyState subtitle="test" href="/nodo/tasks/new" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses provided actionLabel in link", () => {
    render(<EmptyState subtitle="test" href="/nodo/tasks/new" actionLabel="Crear tarea" />);
    expect(screen.getByRole("link", { name: /Crear tarea/ })).toBeInTheDocument();
  });

  it("uses default label 'Publicar tarea' in link when no actionLabel", () => {
    render(<EmptyState subtitle="test" href="/nodo/tasks/new" />);
    expect(screen.getByRole("link", { name: /Publicar tarea/ })).toBeInTheDocument();
  });
});
