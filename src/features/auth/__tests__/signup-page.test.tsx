import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockSignUpWithPassword = vi.hoisted(() => vi.fn());
const mockSignInWithGoogle = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/actions", () => ({
  signUpWithPassword: mockSignUpWithPassword,
  signInWithGoogle: mockSignInWithGoogle,
}));

import SignupPage from "@/app/auth/signup/page";

describe("SignupPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders brand hero with Mountain icon, title, and subtitle", () => {
    render(<SignupPage />);
    expect(screen.getByText("Nodo Serrano")).toBeInTheDocument();
    expect(screen.getByText("El backoffice de la comunidad")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("renders PrimaryButton with text Crear cuenta", () => {
    render(<SignupPage />);
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeInTheDocument();
  });

  it("hides Google CTA and orphan divider while Google auth is disabled", () => {
    render(<SignupPage />);
    expect(screen.queryByRole("button", { name: /Continuar con Google/i })).not.toBeInTheDocument();
    expect(screen.queryByText("o")).not.toBeInTheDocument();
  });

  it("shows Google CTA and divider when Google auth is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "true");
    vi.resetModules();
    const { default: EnabledSignupPage } = await import("@/app/auth/signup/page");
    render(<EnabledSignupPage />);
    expect(screen.getByRole("button", { name: /Continuar con Google/i })).toBeInTheDocument();
    expect(screen.getByText("o")).toBeInTheDocument();
  });

  it("renders footer with ¿Ya tenés cuenta? and Iniciá sesión link", () => {
    render(<SignupPage />);
    expect(screen.getByText(/¿Ya tenés cuenta\?/)).toBeInTheDocument();
    const sesionLink = screen.getByText("Iniciá sesión");
    expect(sesionLink).toBeInTheDocument();
    expect(sesionLink.closest("a")).toHaveAttribute("href", "/auth/login");
  });
});
