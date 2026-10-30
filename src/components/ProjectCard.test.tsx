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

vi.mock("@/features/projects/ProjectJoinButton", () => ({
  ProjectJoinButton: ({ projectId, label }: { projectId: string; label: string }) => (
    <button type="submit" data-project-id={projectId}>
      {label}
    </button>
  ),
}));

const BASE = {
  projectId: "p1",
  href: "/nodo/projects/p1",
  name: "Sitio web de Nodo",
  estado: "en_curso",
};

describe("ProjectCard", () => {
  it("renders name, description and estado badge", () => {
    render(
      <ProjectCard
        {...BASE}
        description="Landing y backoffice de la comunidad."
        affordance={{ kind: "none" }}
      />,
    );
    expect(screen.getByText("Sitio web de Nodo")).toBeInTheDocument();
    expect(screen.getByText("Landing y backoffice de la comunidad.")).toBeInTheDocument();
    expect(screen.getByText("En curso")).toBeInTheDocument();
  });

  it("shows Archivado, not Terminado, on an archived project (ZER-201)", () => {
    render(<ProjectCard {...BASE} archived affordance={{ kind: "none" }} />);
    expect(screen.getByText("Archivado · Pausado")).toBeInTheDocument();
    expect(screen.queryByText("En curso")).not.toBeInTheDocument();
    expect(screen.queryByText("Terminado")).not.toBeInTheDocument();
  });

  it("links the title to the project detail", () => {
    render(<ProjectCard {...BASE} affordance={{ kind: "none" }} />);
    expect(screen.getByRole("link", { name: "Sitio web de Nodo" })).toHaveAttribute(
      "href",
      "/nodo/projects/p1",
    );
  });

  it("shows member overflow when count exceeds visible avatars", () => {
    render(
      <ProjectCard
        {...BASE}
        estado="pausado"
        affordance={{ kind: "none" }}
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

  describe("ZER-154: actions instead of technical labels", () => {
    it("never shows the entry rule as a label (it lives in the detail)", () => {
      render(<ProjectCard {...BASE} affordance={{ kind: "join", label: "Solicitar unirme" }} />);
      expect(screen.queryByText("Por aprobación")).not.toBeInTheDocument();
      expect(screen.queryByText("Abierto")).not.toBeInTheDocument();
    });

    it.each(["Unirme", "Solicitar unirme"] as const)(
      "offers %s as a button outside the detail link",
      (label) => {
        render(<ProjectCard {...BASE} affordance={{ kind: "join", label }} />);
        const button = screen.getByRole("button", { name: label });
        expect(button).toHaveAttribute("data-project-id", "p1");
        // A button inside a link is invalid HTML and unreachable by keyboard.
        expect(button.closest("a")).toBeNull();
      },
    );

    it("tells a pending applicant their request is in, without a button", () => {
      render(
        <ProjectCard {...BASE} affordance={{ kind: "pending", label: "Solicitud pendiente" }} />,
      );
      expect(screen.getByText("Solicitud pendiente")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows a cerrado project as Cerrado, without a button (ZER-151)", () => {
      render(<ProjectCard {...BASE} affordance={{ kind: "closed", label: "Cerrado" }} />);
      expect(screen.getByText("Cerrado")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByText("Participás")).not.toBeInTheDocument();
    });

    it("tells a member they already take part, without a button", () => {
      render(<ProjectCard {...BASE} affordance={{ kind: "none" }} />);
      expect(screen.getByText("Participás")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("keeps the description short (two lines)", () => {
      render(
        <ProjectCard {...BASE} description="Una descripción larga" affordance={{ kind: "none" }} />,
      );
      expect(screen.getByText("Una descripción larga")).toHaveClass("line-clamp-2");
    });

    it("hides the avatar row when nobody has joined yet", () => {
      render(
        <ProjectCard
          {...BASE}
          affordance={{ kind: "join", label: "Unirme" }}
          members={[]}
          memberCount={0}
        />,
      );
      expect(screen.queryByTestId(/^avatar-/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });

    it("stays readable without an image", () => {
      render(<ProjectCard {...BASE} affordance={{ kind: "none" }} />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Sitio web de Nodo" })).toBeInTheDocument();
    });
  });
});
