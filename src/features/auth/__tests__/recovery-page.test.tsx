import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockSendPasswordReset = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/actions", () => ({
  sendPasswordReset: mockSendPasswordReset,
}));

import RecoveryPage from "@/app/auth/recovery/page";

describe("RecoveryPage", () => {
  it("renders the icon and Pencil heading", () => {
    render(<RecoveryPage />);
    expect(screen.getByText("¿Olvidaste tu contraseña?")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("renders the descriptive subtitle", () => {
    render(<RecoveryPage />);
    expect(
      screen.getByText("Ingresá tu email y te enviamos un enlace para restablecerla."),
    ).toBeInTheDocument();
  });

  it("renders an email input as the first field", () => {
    render(<RecoveryPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    const inputs = document.querySelectorAll("input");
    expect(inputs[0].getAttribute("name")).toBe("email");
  });

  it("renders the submit PrimaryButton", () => {
    render(<RecoveryPage />);
    expect(screen.getByRole("button", { name: "Enviar enlace" })).toBeInTheDocument();
  });

  it("renders a back-to-login link", () => {
    render(<RecoveryPage />);
    const back = screen.getByText("Volver al inicio de sesión");
    expect(back.closest("a")).toHaveAttribute("href", "/auth/login");
  });

  it("shows error message after failed submission", async () => {
    mockSendPasswordReset.mockReturnValue({ error: "Email no encontrado" });
    render(<RecoveryPage />);
    fireEvent.submit(document.querySelector("form")!);
    expect(await screen.findByText("Email no encontrado")).toBeInTheDocument();
  });
});
