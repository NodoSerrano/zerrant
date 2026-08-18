import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemberCard } from "./MemberCard";
import type { SerranoMember } from "./types";

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

const member: SerranoMember = {
  id: "p1",
  name: "Nóbel Dam",
  nombre: "Nóbel",
  apellido: "Dam",
  apodo: null,
  avatarUrl: null,
  tier: "standard",
  disponibilidad: "disponible",
  roles: ["Infra", "Charlas"],
  skills: ["Solidity"],
};

describe("MemberCard", () => {
  it("is a link to /plantel/{id}", () => {
    render(<MemberCard member={member} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/plantel/p1");
  });

  it("applies the Pencil container classes", () => {
    render(<MemberCard member={member} />);
    const link = screen.getByRole("link");
    expect(link.className).toContain("rounded-[24px]");
    expect(link.className).toContain("bg-surface");
    expect(link.className).toContain("border-border");
    expect(link.className).toContain("p-4");
    expect(link.className).toContain("gap-[14px]");
  });

  it("renders the visible name with Pencil classes", () => {
    render(<MemberCard member={member} />);
    const name = screen.getByText("Nóbel Dam");
    expect(name.className).toContain("font-display");
    expect(name.className).toContain("text-[17px]");
    expect(name.className).toContain("text-text-primary");
  });

  it("renders the TierBadge", () => {
    render(<MemberCard member={member} />);
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });

  it("renders availability dot and label for disponible", () => {
    render(<MemberCard member={member} />);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("uses a green dot for disponible", () => {
    render(<MemberCard member={member} />);
    const dot = document.querySelector(".size-1\\.5.rounded-full");
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain("bg-brand-green");
  });

  it("renders one RoleChip per role", () => {
    render(<MemberCard member={member} />);
    expect(screen.getByText("Infra")).toBeInTheDocument();
    expect(screen.getByText("Charlas")).toBeInTheDocument();
  });

  it("renders a chevron-right icon", () => {
    render(<MemberCard member={member} />);
    const chevron = document.querySelectorAll("svg");
    expect(chevron.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Ocupado with a muted dot", () => {
    render(<MemberCard member={{ ...member, disponibilidad: "ocupado" }} />);
    expect(screen.getByText("Ocupado")).toBeInTheDocument();
    const dot = document.querySelector(".size-1\\.5.rounded-full");
    expect(dot!.className).toContain("bg-text-muted");
  });

  it("omits availability when null", () => {
    render(<MemberCard member={{ ...member, disponibilidad: null }} />);
    expect(screen.queryByText("Disponible")).not.toBeInTheDocument();
  });
});
