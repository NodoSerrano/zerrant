import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCard } from "./EventCard";

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
    render(
      <EventCard href="/agenda/evt-1" title="Ping pong" timeLabel="10:00" place={null} />,
    );

    const link = screen.getByRole("link", { name: /Ping pong/i });
    expect(link).toHaveAttribute("href", "/agenda/evt-1");
  });

  it("omits place when null", () => {
    render(<EventCard title="Solo título" timeLabel="09:00" place={null} />);
    expect(screen.queryByText("Salón principal")).not.toBeInTheDocument();
  });
});
