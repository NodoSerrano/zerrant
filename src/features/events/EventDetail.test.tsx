import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventDetail } from "./EventDetail";
import type { EventAttendee, EventCreator } from "./types";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    "aria-label": ariaLabel,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

const CREATOR: EventCreator = {
  profileId: "creator-1",
  name: "Lucía Gómez",
  avatarUrl: null,
};

const ATTENDEES: EventAttendee[] = [
  { profileId: "a1", name: "Valen Ruiz", avatarUrl: null, estado: "voy" },
  { profileId: "a2", name: "Quimey Soto", avatarUrl: null, estado: "quizas" },
  { profileId: "a3", name: "Nia Pérez", avatarUrl: null, estado: "no" },
  { profileId: "a4", name: "Vera Díaz", avatarUrl: null, estado: "voy" },
];

const BASE_PROPS = {
  titulo: "Asamblea de domingo",
  descripcion: "Reunión de coordinación del nodo.",
  lugar: "Salón principal",
  inicio: "2026-09-20T18:00:00-03:00",
  fin: "2026-09-20T20:00:00-03:00",
  creator: CREATOR,
  attendees: ATTENDEES,
};

describe("EventDetail", () => {
  it("renders titulo, descripcion, lugar, inicio and fin", () => {
    render(<EventDetail {...BASE_PROPS} />);

    expect(screen.getByRole("heading", { name: "Asamblea de domingo" })).toBeInTheDocument();
    expect(screen.getByText("Reunión de coordinación del nodo.")).toBeInTheDocument();
    expect(screen.getByText("Salón principal")).toBeInTheDocument();
    expect(screen.getByText("18:00 – 20:00")).toBeInTheDocument();
  });

  it("groups attendees under accented RSVP labels from unaccented estados", () => {
    render(<EventDetail {...BASE_PROPS} />);

    expect(screen.getByText("Voy")).toBeInTheDocument();
    expect(screen.getByText("Quizás")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.queryByText("quizas")).not.toBeInTheDocument();
    expect(screen.queryByText("quizás")).not.toBeInTheDocument();

    expect(screen.getByText("Valen Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Vera Díaz")).toBeInTheDocument();
    expect(screen.getByText("Quimey Soto")).toBeInTheDocument();
    expect(screen.getByText("Nia Pérez")).toBeInTheDocument();
  });

  it("identifies the event creator", () => {
    render(<EventDetail {...BASE_PROPS} />);
    expect(screen.getByText(/Creado por Lucía Gómez/)).toBeInTheDocument();
  });

  it("shows an empty attendee state instead of three empty headings", () => {
    render(<EventDetail {...BASE_PROPS} attendees={[]} />);

    expect(screen.getByText("Nadie confirmó todavía")).toBeInTheDocument();
    expect(screen.queryByText("Voy")).not.toBeInTheDocument();
    expect(screen.queryByText("Quizás")).not.toBeInTheDocument();
    expect(screen.queryByText("No")).not.toBeInTheDocument();
  });

  it("hides empty RSVP groups when others have people", () => {
    render(
      <EventDetail
        {...BASE_PROPS}
        attendees={[{ profileId: "a1", name: "Valen Ruiz", avatarUrl: null, estado: "voy" }]}
      />,
    );

    expect(screen.getByText("Voy")).toBeInTheDocument();
    expect(screen.getByText("Valen Ruiz")).toBeInTheDocument();
    expect(screen.queryByText("Quizás")).not.toBeInTheDocument();
    expect(screen.queryByText("No")).not.toBeInTheDocument();
  });

  it("composes attendees from Avatar initials and Chip labels", () => {
    render(<EventDetail {...BASE_PROPS} />);

    expect(screen.getByText("VR")).toBeInTheDocument();
    expect(screen.getByText("QS")).toBeInTheDocument();
    expect(screen.getByText("NP")).toBeInTheDocument();
    expect(screen.getByText("VD")).toBeInTheDocument();
  });

  it("links back to the agenda", () => {
    render(<EventDetail {...BASE_PROPS} />);
    const back = screen.getByRole("link", { name: "Volver a la agenda" });
    expect(back).toHaveAttribute("href", "/agenda");
  });

  it("leaves a mount seam for the story 6.9 RSVP control", () => {
    render(<EventDetail {...BASE_PROPS} />);
    expect(screen.getByTestId("rsvp-control-slot")).toBeInTheDocument();
  });
});
