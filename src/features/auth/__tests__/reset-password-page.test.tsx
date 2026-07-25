import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockResetPassword = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/actions", () => ({
  resetPassword: mockResetPassword,
}));

import ResetPasswordPage from "@/app/auth/reset-password/page";

describe("ResetPasswordPage", () => {
  it("renders the icon and Pencil heading", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("heading", { name: "Nueva contraseña" })).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("renders the descriptive subtitle", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Elegí una contraseña nueva para tu cuenta.")).toBeInTheDocument();
  });

  it("renders a new-password field and a confirm-password field", () => {
    render(<ResetPasswordPage />);
    const passwordInputs = document.querySelectorAll("input[type='password']");
    expect(passwordInputs).toHaveLength(2);
    expect(passwordInputs[0].getAttribute("name")).toBe("password");
    expect(passwordInputs[1].getAttribute("name")).toBe("confirmPassword");
  });

  it("renders the submit PrimaryButton", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("button", { name: "Guardar contraseña" })).toBeInTheDocument();
  });

  it("renders the top back-nav chevron linking to login (no footer link, per Pencil)", () => {
    render(<ResetPasswordPage />);
    const back = screen.getByRole("link", { name: "Volver" });
    expect(back).toHaveAttribute("href", "/auth/login");
    expect(screen.queryByText("Volver al inicio de sesión")).not.toBeInTheDocument();
  });

  it("shows error message after failed submission", async () => {
    mockResetPassword.mockReturnValue({ error: "Las contraseñas no coinciden" });
    render(<ResetPasswordPage />);
    fireEvent.submit(document.querySelector("form")!);
    expect(await screen.findByText("Las contraseñas no coinciden")).toBeInTheDocument();
  });
});
