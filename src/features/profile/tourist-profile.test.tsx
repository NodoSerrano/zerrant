import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
}));

vi.mock("@/components/TierBadge", () => ({
  TierBadge: () => <span data-testid="tier-badge">Tourist</span>,
}));

vi.mock("@/components/DarkModeToggle", () => ({
  DarkModeToggle: () => <button data-testid="dark-mode-toggle" type="button" />,
}));

vi.mock("@/components/SignOutButton", () => ({
  SignOutButton: () => <button data-testid="sign-out-button" type="submit" />,
}));

const mockSignOut = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/actions", () => ({
  signOut: mockSignOut,
}));

import { TouristProfile } from "./tourist-profile";

describe("TouristProfile", () => {
  const defaultProps = {
    name: "Juan Visitante",
    avatarUrl: null,
    email: "juan@gmail.com",
  };

  it("renders header title with pencil icon link to edit", () => {
    render(<TouristProfile {...defaultProps} />);
    expect(screen.getByText("Mi perfil")).toBeInTheDocument();
    const pencilLink = document.querySelector("a[href='/profile/edit']");
    expect(pencilLink).toBeInTheDocument();
  });

  it("renders identity card with name, tourist badge, and email", () => {
    render(<TouristProfile {...defaultProps} />);
    expect(screen.getAllByText("Juan Visitante")).toHaveLength(2);
    expect(screen.getByTestId("tier-badge")).toHaveTextContent("Tourist");
    expect(screen.getByText("juan@gmail.com")).toBeInTheDocument();
  });

  it("renders membership CTA banner with correct copy", () => {
    render(<TouristProfile {...defaultProps} />);
    expect(screen.getByText("Todavía sos Tourist")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sumate como Serrano para aparecer en el plantel, crear eventos y participar de los proyectos.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Solicitar ser Serrano")).toBeInTheDocument();
  });

  it("renders menu with edit, dark mode toggle, and logout", () => {
    render(<TouristProfile {...defaultProps} />);
    expect(screen.getByText("Editar perfil")).toBeInTheDocument();
    expect(screen.getByTestId("dark-mode-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("sign-out-button")).toBeInTheDocument();
  });

  it("links edit profile to /profile/edit from menu row", () => {
    render(<TouristProfile {...defaultProps} />);
    const editMenuLink = screen.getByText("Editar perfil").closest("a");
    expect(editMenuLink).toHaveAttribute("href", "/profile/edit");
  });

  it("renders avatar with display name", () => {
    render(<TouristProfile {...defaultProps} />);
    expect(screen.getByTestId("avatar")).toHaveTextContent("Juan Visitante");
  });

  it("renders fallback when email is empty string", () => {
    render(<TouristProfile {...defaultProps} email="" />);
    expect(screen.getByText("Sin correo")).toBeInTheDocument();
  });

  it("renders sign-out button inside a form", () => {
    render(<TouristProfile {...defaultProps} />);
    const form = document.querySelector("form");
    expect(form).toBeInTheDocument();
    expect(form).toContainElement(screen.getByTestId("sign-out-button"));
  });
});
