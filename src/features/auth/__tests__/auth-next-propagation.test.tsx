import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const params = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => params.value,
}));

vi.mock("@/features/auth/actions", () => ({
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  signInWithGoogle: vi.fn(),
  resendSignupEmail: vi.fn(),
}));

import LoginPage from "@/app/auth/login/page";
import SignupPage from "@/app/auth/signup/page";
import CheckEmailPage from "@/app/auth/check-email/page";

function hiddenNextValues(): string[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>("input[name='next']")).map(
    (i) => i.value,
  );
}

describe("auth pages carry next (ZER-136)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "true");
    params.value = new URLSearchParams();
  });

  it("login puts a safe next in every form and in the signup link", () => {
    params.value = new URLSearchParams("next=/unirme");
    render(<LoginPage />);

    expect(hiddenNextValues()).toEqual(["/unirme", "/unirme"]);
    expect(screen.getByRole("link", { name: "Creá tu cuenta" })).toHaveAttribute(
      "href",
      "/auth/signup?next=%2Funirme",
    );
  });

  it("login drops an unsafe next", () => {
    params.value = new URLSearchParams("next=//evil.com");
    render(<LoginPage />);

    expect(hiddenNextValues()).toEqual([]);
    expect(screen.getByRole("link", { name: "Creá tu cuenta" })).toHaveAttribute(
      "href",
      "/auth/signup",
    );
  });

  it("signup puts a safe next in every form and in the login link", () => {
    params.value = new URLSearchParams("next=/unirme");
    render(<SignupPage />);

    expect(hiddenNextValues()).toEqual(["/unirme", "/unirme"]);
    expect(screen.getByRole("link", { name: "Iniciá sesión" })).toHaveAttribute(
      "href",
      "/auth/login?next=%2Funirme",
    );
  });

  it("check-email passes a safe next to resend and to the login link", async () => {
    render(
      await CheckEmailPage({
        searchParams: Promise.resolve({ email: "a@b.co", flow: "signup", next: "/unirme" }),
      }),
    );

    expect(hiddenNextValues()).toEqual(["/unirme"]);
    expect(screen.getByRole("link", { name: "Volver al inicio de sesión" })).toHaveAttribute(
      "href",
      "/auth/login?next=%2Funirme",
    );
  });

  it("check-email drops an unsafe next", async () => {
    render(
      await CheckEmailPage({
        searchParams: Promise.resolve({ email: "a@b.co", flow: "signup", next: "@evil.com" }),
      }),
    );

    expect(hiddenNextValues()).toEqual([]);
    expect(screen.getByRole("link", { name: "Volver al inicio de sesión" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });
});
