import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectDetail } from "./ProjectDetail";
import type { ProjectDetailViewModel } from "./types";

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

vi.mock("@/components/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid={`avatar-${name}`}>{name}</div>,
}));

const baseProject: ProjectDetailViewModel = {
  id: "proj-1",
  nombre: "Sitio web de Nodo",
  descripcion:
    "Landing y backoffice de la comunidad, hecho entre varios serranos. Buscamos gente de front, diseño y contenido.",
  estado: "en_curso",
  ingreso: "aprobacion",
  members: [
    {
      profileId: "u1",
      name: "Nóbel Dam",
      avatarUrl: null,
      rol: "admin",
      isCreator: true,
    },
    {
      profileId: "u2",
      name: "Lucía Morales",
      avatarUrl: null,
      rol: "miembro",
      isCreator: false,
    },
  ],
  affordance: { kind: "join", label: "Solicitar ingreso" },
  showRequestsQueue: false,
};

describe("ProjectDetail", () => {
  it("renders nombre, descripcion, estado, ingreso and approved members", () => {
    render(<ProjectDetail project={baseProject} />);

    expect(screen.getByRole("heading", { name: "Sitio web de Nodo" })).toBeInTheDocument();
    expect(screen.getByText(/Landing y backoffice/)).toBeInTheDocument();
    expect(screen.getByText("En curso")).toBeInTheDocument();
    expect(screen.getByText("Por aprobación")).toBeInTheDocument();
    expect(screen.getAllByText("Nóbel Dam").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lucía Morales").length).toBeGreaterThan(0);
    expect(screen.getByText("Miembros")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("marks admins and never lists pendiente rows (fixture is approved-only)", () => {
    render(<ProjectDetail project={baseProject} />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Creó el proyecto")).toBeInTheDocument();
    expect(screen.getByText("Miembro")).toBeInTheDocument();
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
  });

  it("renders the Unirse affordance for non-members on abierto projects", () => {
    render(
      <ProjectDetail
        project={{
          ...baseProject,
          ingreso: "abierto",
          affordance: { kind: "join", label: "Unirse" },
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Unirse" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar ingreso" })).not.toBeInTheDocument();
  });

  it("renders Solicitar ingreso for non-members on aprobacion projects", () => {
    render(<ProjectDetail project={baseProject} />);
    expect(screen.getByRole("button", { name: "Solicitar ingreso" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unirse" })).not.toBeInTheDocument();
  });

  it("shows a pending indicator and no join CTA when the viewer is pendiente", () => {
    render(
      <ProjectDetail
        project={{
          ...baseProject,
          affordance: { kind: "pending", label: "Solicitud pendiente" },
        }}
      />,
    );
    expect(screen.getByText("Solicitud pendiente")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unirse" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar ingreso" })).not.toBeInTheDocument();
  });

  it("hides the join affordance for approved members", () => {
    render(
      <ProjectDetail
        project={{
          ...baseProject,
          affordance: { kind: "none" },
        }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Unirse" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar ingreso" })).not.toBeInTheDocument();
    expect(screen.queryByText("Solicitud pendiente")).not.toBeInTheDocument();
  });

  it("offers the join-request queue only to project admins", () => {
    const { rerender } = render(
      <ProjectDetail project={{ ...baseProject, showRequestsQueue: true }} />,
    );
    const queue = screen.getByRole("link", { name: "Solicitudes de ingreso" });
    expect(queue).toHaveAttribute("href", "/nodo/projects/proj-1/requests");

    rerender(<ProjectDetail project={{ ...baseProject, showRequestsQueue: false }} />);
    expect(screen.queryByRole("link", { name: "Solicitudes de ingreso" })).not.toBeInTheDocument();
  });

  it("keeps the topbar title centered without a dead ellipsis icon", () => {
    const { container } = render(<ProjectDetail project={baseProject} />);
    expect(screen.getByText("Proyecto")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-ellipsis")).toBeNull();
    const header = screen.getByText("Proyecto").parentElement!;
    expect(header.children).toHaveLength(3);
    expect(header.children[2]).toHaveAttribute("aria-hidden", "true");
  });

  it("links back to the projects hub", () => {
    render(<ProjectDetail project={baseProject} />);
    expect(screen.getByRole("link", { name: "Volver a proyectos" })).toHaveAttribute(
      "href",
      "/nodo/projects",
    );
  });
});
