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

vi.mock("@/features/projects/ProjectJoinButton", () => ({
  ProjectJoinButton: ({ projectId, label }: { projectId: string; label: string }) => (
    <button type="submit" data-project-id={projectId}>
      {label}
    </button>
  ),
}));

vi.mock("@/features/projects/PromoteMemberButton", () => ({
  PromoteMemberButton: ({ projectId, profileId }: { projectId: string; profileId: string }) => (
    <button type="submit" data-testid={`promote-${profileId}`} data-project-id={projectId}>
      Designar admin
    </button>
  ),
}));

vi.mock("@/features/projects/DemoteMemberButton", () => ({
  DemoteMemberButton: ({ profileId }: { profileId: string }) => (
    <button type="button" data-testid={`demote-${profileId}`}>
      Quitar admin
    </button>
  ),
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
  affordance: { kind: "join", label: "Solicitar unirme" },
  showRequestsQueue: false,
  canPromoteMembers: false,
  canEdit: false,
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
          affordance: { kind: "join", label: "Unirme" },
        }}
      />,
    );
    const join = screen.getByRole("button", { name: "Unirme" });
    expect(join).toBeInTheDocument();
    expect(join).not.toBeDisabled();
    expect(join).toHaveAttribute("data-project-id", "proj-1");
    expect(screen.queryByRole("button", { name: "Solicitar unirme" })).not.toBeInTheDocument();
  });

  it("renders Solicitar unirme for non-members on aprobacion projects", () => {
    render(<ProjectDetail project={baseProject} />);
    expect(screen.getByRole("button", { name: "Solicitar unirme" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unirme" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "Unirme" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar unirme" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "Unirme" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar unirme" })).not.toBeInTheDocument();
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

  it("offers promote only to project admins, and only on aprobado miembros who are not already admins", () => {
    const { rerender } = render(
      <ProjectDetail project={{ ...baseProject, canPromoteMembers: true }} />,
    );
    expect(screen.getByTestId("promote-u2")).toBeInTheDocument();
    expect(screen.queryByTestId("promote-u1")).not.toBeInTheDocument();

    rerender(<ProjectDetail project={{ ...baseProject, canPromoteMembers: false }} />);
    expect(screen.queryByTestId("promote-u2")).not.toBeInTheDocument();
  });

  // ZER-84 had no way back from admin; ZER-199 adds "Quitar admin" (covered below).
  it("shows Admin badge for promoted members instead of the promote control", () => {
    render(
      <ProjectDetail
        project={{
          ...baseProject,
          canPromoteMembers: true,
          members: [
            baseProject.members[0],
            { ...baseProject.members[1], rol: "admin", isCreator: false },
          ],
        }}
      />,
    );
    expect(screen.getAllByText("Admin")).toHaveLength(2);
    expect(screen.queryByTestId("promote-u2")).not.toBeInTheDocument();
  });

  it("keeps the topbar title centered without a dead ellipsis icon", () => {
    const { container } = render(<ProjectDetail project={baseProject} />);
    expect(screen.getByText("Proyecto")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-ellipsis")).toBeNull();
    const header = screen.getByText("Proyecto").parentElement!;
    expect(header.children).toHaveLength(3);
    expect(header.children[2]).toHaveAttribute("aria-hidden", "true");
  });

  it("offers edit only to a project admin", () => {
    const { rerender } = render(<ProjectDetail project={{ ...baseProject, canEdit: true }} />);
    expect(screen.getByRole("link", { name: "Editar proyecto" })).toHaveAttribute(
      "href",
      "/nodo/projects/proj-1/edit",
    );

    rerender(<ProjectDetail project={{ ...baseProject, canEdit: false }} />);
    expect(screen.queryByRole("link", { name: "Editar proyecto" })).not.toBeInTheDocument();
  });

  it("links back to the projects hub", () => {
    render(<ProjectDetail project={baseProject} />);
    expect(screen.getByRole("link", { name: "Volver a proyectos" })).toHaveAttribute(
      "href",
      "/nodo/projects",
    );
  });

  describe("quitar admin (ZER-199)", () => {
    const twoAdmins: ProjectDetailViewModel = {
      ...baseProject,
      canPromoteMembers: true,
      members: [baseProject.members[0], { ...baseProject.members[1], rol: "admin" }],
    };

    it("lets a project admin remove the admin role while another admin remains", () => {
      render(<ProjectDetail project={twoAdmins} />);

      expect(screen.getByTestId("demote-u1")).toBeInTheDocument();
      expect(screen.getByTestId("demote-u2")).toBeInTheDocument();
    });

    it("does not offer it on the only admin", () => {
      render(<ProjectDetail project={{ ...baseProject, canPromoteMembers: true }} />);

      expect(screen.queryByTestId("demote-u1")).not.toBeInTheDocument();
    });

    it("does not offer it to plain members", () => {
      render(<ProjectDetail project={{ ...twoAdmins, canPromoteMembers: false }} />);

      expect(screen.queryByRole("button", { name: "Quitar admin" })).not.toBeInTheDocument();
    });
  });
});
