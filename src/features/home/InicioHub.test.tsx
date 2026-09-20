import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InicioHub } from "./InicioHub";
import type { UpcomingBirthday } from "./birthdays";

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

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const birthday = (overrides: Partial<UpcomingBirthday> = {}): UpcomingBirthday => ({
  profileId: "p1",
  displayName: "Ana García",
  avatarUrl: null,
  fechaNacimiento: "1990-03-15",
  nextOccurrence: "2026-03-15",
  daysUntil: 5,
  ageTurning: 36,
  ...overrides,
});

describe("InicioHub", () => {
  it("renders Inicio title and both section headings", () => {
    render(<InicioHub events={[]} birthdays={[]} />);
    expect(screen.getByRole("heading", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Próximos eventos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Próximos cumpleaños" })).toBeInTheDocument();
  });

  it("shows honest empty copy when both sections are empty (no fake rows)", () => {
    render(<InicioHub events={[]} birthdays={[]} />);
    expect(screen.getByText("No hay eventos próximos")).toBeInTheDocument();
    expect(screen.getByText("No hay cumpleaños próximos")).toBeInTheDocument();
    expect(screen.queryByText("Asamblea")).not.toBeInTheDocument();
  });

  it("lists upcoming events from real rows", () => {
    render(
      <InicioHub
        events={[
          {
            id: "e1",
            title: "Asamblea",
            timeLabel: "18:00 – 20:00",
            place: "Salón",
            href: "/agenda/e1",
          },
        ]}
        birthdays={[]}
      />,
    );
    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(screen.getByText("Salón")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Asamblea/i })).toHaveAttribute("href", "/agenda/e1");
    expect(screen.queryByText("No hay eventos próximos")).not.toBeInTheDocument();
  });

  it("lists upcoming birthdays with plantel link", () => {
    render(<InicioHub events={[]} birthdays={[birthday()]} />);
    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText(/En 5 días · cumple 36/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ana García/i })).toHaveAttribute(
      "href",
      "/plantel/p1",
    );
    expect(screen.queryByText("No hay cumpleaños próximos")).not.toBeInTheDocument();
  });

  it("marks today birthdays with Hoy copy", () => {
    render(<InicioHub events={[]} birthdays={[birthday({ daysUntil: 0, ageTurning: 36 })]} />);
    expect(screen.getByText(/Hoy · cumple 36/)).toBeInTheDocument();
  });
});
