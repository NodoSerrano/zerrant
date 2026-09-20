import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectCard } from "./ProjectCard";

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

vi.mock("@/components/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid={`avatar-${name}`}>{name}</div>,
}));

describe("ProjectCard", () => {
  it("renders name, description and estado badge", () => {
    render(
      <ProjectCard
        name="Sitio web de Nodo"
        description="Landing y backoffice de la comunidad."
        estado="en_curso"
        ingreso="aprobacion"
      />,
    );
    expect(screen.getByText("Sitio web de Nodo")).toBeInTheDocument();
    expect(screen.getByText("Landing y backoffice de la comunidad.")).toBeInTheDocument();
    expect(screen.getByText("En curso")).toBeInTheDocument();
    expect(screen.getByText("Por aprobación")).toBeInTheDocument();
  });

  it("links to the project detail when href is set", () => {
    render(<ProjectCard href="/nodo/projects/p1" name="Taller" estado="idea" ingreso="abierto" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/nodo/projects/p1");
    expect(screen.getByText("Abierto")).toBeInTheDocument();
  });

  it("shows member overflow when count exceeds visible avatars", () => {
    render(
      <ProjectCard
        name="Fanzine"
        estado="pausado"
        ingreso="aprobacion"
        members={[
          { name: "Ana Diaz" },
          { name: "Luis Mora" },
          { name: "Tina Ruiz" },
          { name: "Extra One" },
        ]}
        memberCount={8}
      />,
    );
    expect(screen.getByText("+5")).toBeInTheDocument();
    expect(screen.getByText("Pausado")).toBeInTheDocument();
  });
});
