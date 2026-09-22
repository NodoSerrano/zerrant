import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCard } from "./EventCard";

vi.mock("next/image", () => ({
  default: (props: {
    alt: string;
    src: string;
    width?: number;
    height?: number;
    sizes?: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={props.alt}
      src={props.src}
      width={props.width}
      height={props.height}
      sizes={props.sizes}
      className={props.className}
    />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    target,
    rel,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    target?: string;
    rel?: string;
  }) => (
    <a href={href} className={className} target={target} rel={rel}>
      {children}
    </a>
  ),
}));

describe("EventCard", () => {
  it("renders title, time range and optional place", () => {
    render(
      <EventCard
        href="/agenda/evt-1"
        title="Asamblea de domingo"
        timeLabel="18:00 – 20:00"
        place="Salón principal"
      />,
    );

    expect(screen.getByText("Asamblea de domingo")).toBeInTheDocument();
    expect(screen.getByText("18:00 – 20:00")).toBeInTheDocument();
    expect(screen.getByText("Salón principal")).toBeInTheDocument();
  });

  it("links to the event detail when href is set", () => {
    render(<EventCard href="/agenda/evt-1" title="Ping pong" timeLabel="10:00" place={null} />);

    const link = screen.getByRole("link", { name: /Ping pong/i });
    expect(link).toHaveAttribute("href", "/agenda/evt-1");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens absolute http(s) hrefs in a new tab", () => {
    render(
      <EventCard
        href="https://luma.com/iajzrmdr"
        title="La fija de los jueves: pysap"
        timeLabel="18:00 – 19:00"
        place="San Martín 864, Tandil"
      />,
    );

    const link = screen.getByRole("link", { name: /La fija de los jueves/i });
    expect(link).toHaveAttribute("href", "https://luma.com/iajzrmdr");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("omits place when null", () => {
    render(<EventCard title="Solo título" timeLabel="09:00" place={null} />);
    expect(screen.queryByText("Salón principal")).not.toBeInTheDocument();
  });

  it("shows cover image when coverUrl is servable", () => {
    const { container } = render(
      <EventCard
        href="/agenda/evt-1"
        title="Asamblea de domingo"
        timeLabel="18:00 – 20:00"
        place="Salón principal"
        coverUrl="https://images.lumacdn.com/uploads/cover.png"
      />,
    );

    // Empty alt keeps the cover decorative inside the named link (same pattern as Avatar).
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("src", "https://images.lumacdn.com/uploads/cover.png");
    expect(img).toHaveAttribute("width", "40");
    expect(img).toHaveAttribute("height", "40");
    expect(img).toHaveAttribute("sizes", "40px");
  });

  it("keeps calendar icon when coverUrl is missing or not servable", () => {
    const { container, rerender } = render(
      <EventCard title="Sin cover" timeLabel="09:00" place={null} coverUrl={null} />,
    );
    expect(container.querySelector("svg.lucide-calendar")).toBeTruthy();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(
      <EventCard
        title="Cover rara"
        timeLabel="09:00"
        place={null}
        coverUrl="https://evil.example/x.png"
      />,
    );
    expect(container.querySelector("svg.lucide-calendar")).toBeTruthy();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
