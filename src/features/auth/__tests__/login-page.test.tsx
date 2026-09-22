import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.hoisted(() => vi.fn((_key?: string) => null as string | null));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

const mockSignInWithPassword = vi.hoisted(() => vi.fn());
const mockSignInWithGoogle = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/actions", () => ({
  signInWithPassword: mockSignInWithPassword,
  signInWithGoogle: mockSignInWithGoogle,
}));

import LoginPage from "@/app/auth/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(() => null);
    mockSignInWithPassword.mockReset();
    mockSignInWithGoogle.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders brand hero with Mountain icon, title, and subtitle", () => {
    render(<LoginPage />);
    expect(screen.getByText("Nodo Serrano")).toBeInTheDocument();
    expect(screen.getByText("El backoffice de la comunidad")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("renders email and password inputs in order", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    const pwInput = document.querySelector("input[type='password']");
    expect(pwInput).toBeInTheDocument();
    const formFields = document.querySelectorAll("input");
    expect(formFields[0].getAttribute("name")).toBe("email");
  });

  it("renders forgot password link", () => {
    render(<LoginPage />);
    const forgotLink = screen.getByText(/¿Olvidaste tu contraseña/);
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink.closest("a")).toHaveAttribute("href", "/auth/recovery");
  });

  it("renders PrimaryButton with text Ingresar", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeInTheDocument();
  });

  it("hides Google CTA and orphan divider while Google auth is disabled", () => {
    render(<LoginPage />);
    expect(screen.queryByRole("button", { name: /Continuar con Google/i })).not.toBeInTheDocument();
    expect(screen.queryByText("o")).not.toBeInTheDocument();
  });

  it("shows Google CTA and divider when Google auth is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "true");
    vi.resetModules();
    const { default: EnabledLoginPage } = await import("@/app/auth/login/page");
    render(<EnabledLoginPage />);
    expect(screen.getByRole("button", { name: /Continuar con Google/i })).toBeInTheDocument();
    expect(screen.getByText("o")).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("renders footer with ¿Primera vez? and Creá tu cuenta link", () => {
    render(<LoginPage />);
    expect(screen.getByText(/¿Primera vez\?/)).toBeInTheDocument();
    const cuentaLink = screen.getByText("Creá tu cuenta");
    expect(cuentaLink).toBeInTheDocument();
    expect(cuentaLink.closest("a")).toHaveAttribute("href", "/auth/signup");
  });

  it("shows error message after failed submission", async () => {
    mockSignInWithPassword.mockReturnValue({ error: "Credenciales inválidas" });
    render(<LoginPage />);
    const form = document.querySelector("form");
    fireEvent.submit(form!);
    expect(await screen.findByText("Credenciales inválidas")).toBeInTheDocument();
  });

  it("renders callback failure from searchParams.error", () => {
    mockGet.mockImplementation((key?: string) => (key === "error" ? "auth_callback_failed" : null));
    render(<LoginPage />);
    expect(screen.getByText(/No pudimos confirmar el enlace/i)).toBeInTheDocument();
  });

  it("renders otp_expired from searchParams.error", () => {
    mockGet.mockImplementation((key?: string) => (key === "error" ? "otp_expired" : null));
    render(<LoginPage />);
    expect(screen.getByText(/El enlace expiró o ya se usó/i)).toBeInTheDocument();
  });
});
