import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TouristProfile } from "./tourist-profile";

vi.mock("@/components/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
}));

vi.mock("@/components/TierBadge", () => ({
  TierBadge: () => <span data-testid="tier-badge">Tourist</span>,
}));

vi.mock("@/features/auth/actions", () => ({
  signOut: vi.fn(),
}));

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
});

describe("TouristProfile", () => {
  const defaultProps = {
    name: "Juan Visitante",
    avatarUrl: null,
    email: "juan@gmail.com",
  };

  it("renders header title", () => {
    render(<TouristProfile {...defaultProps} />);
    expect(screen.getByText("Mi perfil")).toBeInTheDocument();
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
    expect(screen.getByText("Modo oscuro")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("links edit profile to /profile/edit", () => {
    render(<TouristProfile {...defaultProps} />);
    const editLink = screen.getByText("Editar perfil").closest("a");
    expect(editLink).toHaveAttribute("href", "/profile/edit");
  });

  it("renders avatar with display name", () => {
    render(<TouristProfile {...defaultProps} />);
    expect(screen.getByTestId("avatar")).toHaveTextContent("Juan Visitante");
  });
});
