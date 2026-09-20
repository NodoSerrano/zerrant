import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockResendSignupEmail = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/actions", () => ({
  resendSignupEmail: mockResendSignupEmail,
}));

import CheckEmailPage from "@/app/auth/check-email/page";

describe("CheckEmailPage", () => {
  it("renders MailCheck icon inside 100x100 circle with brand-blue styling", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    const svg = document.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.parentElement?.className).toContain("size-[100px]");
    expect(svg!.parentElement?.className).toContain("rounded-full");
    expect(svg!.parentElement?.className).toContain("bg-brand-blue/10");
  });

  it("renders title 'Revisá tu email'", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    expect(screen.getByText("Revisá tu email")).toBeInTheDocument();
  });

  it("renders signup subtitle with email when flow=signup", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    expect(
      screen.getByText(
        /Te enviamos un enlace a test@test\.com\. Abrilo para confirmar tu cuenta y entrar\./,
      ),
    ).toBeInTheDocument();
  });

  it("renders recovery subtitle with email when flow=recovery", async () => {
    const searchParams = Promise.resolve({ email: "user@mail.com", flow: "recovery" as const });
    render(await CheckEmailPage({ searchParams }));

    expect(
      screen.getByText(
        /Te enviamos un enlace para restablecer tu contraseña a user@mail\.com\. Revisá tu bandeja de entrada y seguí las instrucciones\./,
      ),
    ).toBeInTheDocument();
  });

  it("wires Reenviar email to resendSignupEmail with the email from searchParams", async () => {
    mockResendSignupEmail.mockResolvedValue({ success: true });
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    const button = screen.getByRole("button", { name: "Reenviar email" });
    expect(button).toBeEnabled();
    const form = button.closest("form");
    expect(form).toBeTruthy();
    const hidden = form!.querySelector('input[name="email"]') as HTMLInputElement;
    expect(hidden.value).toBe("test@test.com");
    fireEvent.submit(form!);
    expect(await screen.findByText(/Listo\. Te reenviamos el enlace/)).toBeInTheDocument();
  });

  it("surfaces resend rate-limit errors from the action", async () => {
    mockResendSignupEmail.mockResolvedValue({ error: "email rate limit exceeded" });
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    fireEvent.submit(screen.getByRole("button", { name: "Reenviar email" }).closest("form")!);
    expect(await screen.findByText("email rate limit exceeded")).toBeInTheDocument();
  });

  it("does not render resend on recovery flow", async () => {
    const searchParams = Promise.resolve({ email: "user@mail.com", flow: "recovery" as const });
    render(await CheckEmailPage({ searchParams }));

    expect(screen.queryByRole("button", { name: "Reenviar email" })).not.toBeInTheDocument();
  });

  it("renders back link to /auth/login", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    const backLink = screen.getByText("Volver al inicio de sesión");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/auth/login");
  });

  it("renders fallback copy when email is missing", async () => {
    const searchParams = Promise.resolve({ flow: "signup" } as { email?: string; flow?: string });
    render(await CheckEmailPage({ searchParams }));

    expect(screen.getByText("Revisá tu email")).toBeInTheDocument();
    expect(screen.getByText(/Te enviamos un enlace a tu correo/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reenviar email" })).not.toBeInTheDocument();
  });
});
