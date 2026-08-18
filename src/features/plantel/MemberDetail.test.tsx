import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemberDetail } from "./MemberDetail";
import type { SerranoMemberDetail } from "./types";

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

const member: SerranoMemberDetail = {
  id: "p1",
  name: "Nóbel Dam",
  avatarUrl: null,
  tier: "standard",
  disponibilidad: "disponible",
  roles: ["Infra", "Charlas"],
  skills: ["Solidity"],
  bio: "Construyo infraestructura para el nodo.",
  tarifaHora: 40,
  telegramHref: "https://t.me/nobeldam",
};

describe("MemberDetail", () => {
  it("renders the back link to /plantel with an aria-label", () => {
    render(<MemberDetail member={member} />);
    const back = screen.getByRole("link", { name: "Volver al plantel" });
    expect(back).toHaveAttribute("href", "/plantel");
  });

  it("renders the topbar title Perfil", () => {
    render(<MemberDetail member={member} />);
    expect(screen.getByText("Perfil")).toBeInTheDocument();
  });

  it("renders the member name with Pencil classes", () => {
    render(<MemberDetail member={member} />);
    const name = screen.getByText("Nóbel Dam");
    expect(name.className).toContain("font-display");
    expect(name.className).toContain("text-2xl");
    expect(name.className).toContain("font-bold");
    expect(name.className).toContain("text-text-primary");
  });

  it("renders TierBadge and availability label with a green dot for disponible", () => {
    render(<MemberDetail member={member} />);
    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    const dot = document.querySelector(".size-2.rounded-full");
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain("bg-brand-green");
  });

  it("omits availability when null", () => {
    render(<MemberDetail member={{ ...member, disponibilidad: null }} />);
    expect(screen.queryByText("Disponible")).not.toBeInTheDocument();
  });

  it("renders confirmed roles under Rol en el nodo", () => {
    render(<MemberDetail member={member} />);
    expect(screen.getByText("Rol en el nodo")).toBeInTheDocument();
    expect(screen.getByText("Infra")).toBeInTheDocument();
    expect(screen.getByText("Charlas")).toBeInTheDocument();
  });

  it("omits the roles section when there are none", () => {
    render(<MemberDetail member={{ ...member, roles: [] }} />);
    expect(screen.queryByText("Rol en el nodo")).not.toBeInTheDocument();
  });

  it("renders empty aportes and proyectos previews", () => {
    render(<MemberDetail member={member} />);
    expect(screen.getByText("Aportes")).toBeInTheDocument();
    expect(screen.getByText("Proyectos")).toBeInTheDocument();
    expect(screen.getByText("Todavía no hay aportes.")).toBeInTheDocument();
    expect(screen.getByText("Todavía no hay proyectos.")).toBeInTheDocument();
  });

  it("renders skill chips", () => {
    render(<MemberDetail member={member} />);
    expect(screen.getByText("Habilidades")).toBeInTheDocument();
    const chip = screen.getByText("Solidity");
    expect(chip.className).toContain("rounded-pill");
    expect(chip.className).toContain("bg-surface-inset");
  });

  it("omits the skills section when there are none", () => {
    render(<MemberDetail member={{ ...member, skills: [] }} />);
    expect(screen.queryByText("Habilidades")).not.toBeInTheDocument();
  });

  it("renders the rate card when tarifaHora is set", () => {
    render(<MemberDetail member={member} />);
    expect(screen.getByText("Disponible para proyectos")).toBeInTheDocument();
    expect(screen.getByText("USD 40 / hora")).toBeInTheDocument();
  });

  it("renders an integer rate without decimals", () => {
    render(<MemberDetail member={{ ...member, tarifaHora: 40.5 }} />);
    expect(screen.getByText("USD 40.5 / hora")).toBeInTheDocument();
  });

  it("omits the rate card when tarifaHora is null", () => {
    render(<MemberDetail member={{ ...member, tarifaHora: null }} />);
    expect(screen.queryByText("Disponible para proyectos")).not.toBeInTheDocument();
  });

  it("renders the bio section", () => {
    render(<MemberDetail member={member} />);
    expect(screen.getByText("Sobre mí")).toBeInTheDocument();
    expect(screen.getByText("Construyo infraestructura para el nodo.")).toBeInTheDocument();
  });

  it("omits the bio section when empty", () => {
    render(<MemberDetail member={{ ...member, bio: null }} />);
    expect(screen.queryByText("Sobre mí")).not.toBeInTheDocument();
  });

  it("renders the CTA as an anchor to the telegram href", () => {
    render(<MemberDetail member={member} />);
    const cta = screen.getByRole("link", { name: "Enviar mensaje" });
    expect(cta).toHaveAttribute("href", "https://t.me/nobeldam");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("omits the CTA when there is no telegram handle", () => {
    render(<MemberDetail member={{ ...member, telegramHref: null }} />);
    expect(screen.queryByRole("link", { name: "Enviar mensaje" })).not.toBeInTheDocument();
  });
});
