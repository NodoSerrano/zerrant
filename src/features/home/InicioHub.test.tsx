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

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [null, vi.fn(), false],
}));

vi.mock("@/features/projects/actions", () => ({
  dismissProjectJoinNotice: vi.fn(),
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
            dateLabel: "dom 20 sept",
            timeLabel: "18:00 – 20:00",
            place: "Salón",
            href: "/agenda/e1",
          },
        ]}
        birthdays={[]}
      />,
    );
    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("sept")).toBeInTheDocument();
    expect(screen.getByText(/Salón/)).toBeInTheDocument();
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

  it("renders event cover when coverUrl is provided", () => {
    const { container } = render(
      <InicioHub
        events={[
          {
            id: "e1",
            title: "Asamblea",
            timeLabel: "18:00 – 20:00",
            place: "Salón",
            href: "/agenda/e1",
            coverUrl: "https://images.lumacdn.com/uploads/cover.png",
          },
        ]}
        birthdays={[]}
      />,
    );
    const img = container.querySelector('img[src="https://images.lumacdn.com/uploads/cover.png"]');
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute("alt", "");
  });

  it("has no Tareas/Proyectos entry: they moved to the TabBar (ZER-206)", () => {
    render(<InicioHub events={[]} birthdays={[]} />);
    expect(screen.queryByRole("link", { name: /Tareas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Proyectos/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Tareas y proyectos")).not.toBeInTheDocument();
    expect(screen.queryByText(/Lo que antes vivía en Nodo/)).not.toBeInTheDocument();
  });

  it("shows Ser Serrano CTA when enabled (ZER-171)", () => {
    render(<InicioHub events={[]} birthdays={[]} showSerSerranoCta />);
    expect(screen.getByRole("link", { name: "Ver beneficios" })).toHaveAttribute(
      "href",
      "/ser-serrano",
    );
  });

  it("hides Ser Serrano CTA by default", () => {
    render(<InicioHub events={[]} birthdays={[]} />);
    expect(screen.queryByRole("link", { name: "Ver beneficios" })).not.toBeInTheDocument();
  });

  it("confirms membership in copy", () => {
    render(<InicioHub events={[]} birthdays={[]} memberConfirmed />);
    expect(screen.getByRole("heading", { name: "Ya sos miembro del Nodo" })).toBeInTheDocument();
  });

  it("renders dismissible project join notices (ZER-202)", () => {
    render(
      <InicioHub
        events={[]}
        birthdays={[]}
        joinNotices={[
          {
            projectId: "proj-1",
            projectName: "Huerta comun",
            kind: "aprobada",
            message: "Te sumaron a Huerta comun",
            href: "/nodo/projects/proj-1",
          },
          {
            projectId: "proj-2",
            projectName: "Taller",
            kind: "rechazada",
            message: "No entraste a Taller: Cupo lleno",
            href: "/nodo/projects/proj-2",
          },
        ]}
      />,
    );

    expect(screen.getByText("Te sumaron a Huerta comun")).toBeInTheDocument();
    expect(screen.getByText("No entraste a Taller: Cupo lleno")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Huerta comun/i })).toHaveAttribute(
      "href",
      "/nodo/projects/proj-1",
    );
    expect(screen.getAllByRole("button", { name: "Entendido" })).toHaveLength(2);
  });
});
