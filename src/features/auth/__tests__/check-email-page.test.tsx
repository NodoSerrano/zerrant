import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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

  it("renders SecondaryButton 'Reenviar email'", async () => {
    const searchParams = Promise.resolve({ email: "test@test.com", flow: "signup" as const });
    render(await CheckEmailPage({ searchParams }));

    expect(screen.getByRole("button", { name: "Reenviar email" })).toBeInTheDocument();
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
  });
});
