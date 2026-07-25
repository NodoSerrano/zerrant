import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockSaveOnboardingStep1 = vi.hoisted(() => vi.fn());
const mockUploadAvatar = vi.hoisted(() => vi.fn());

vi.mock("@/features/profile/actions", () => ({
  saveOnboardingStep1: mockSaveOnboardingStep1,
  uploadAvatar: mockUploadAvatar,
}));

import { Step1Form } from "@/app/(app)/onboarding/step1/Step1Form";

describe("Step1Form", () => {
  it("renders the Pencil chrome copy", () => {
    render(<Step1Form />);

    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Creá tu perfil")).toBeInTheDocument();
    expect(screen.getByText("Así el resto de la comunidad te conoce.")).toBeInTheDocument();
  });

  it("has no back control (onboarding cannot be skipped)", () => {
    render(<Step1Form />);

    expect(document.querySelector("a")).toBeNull();
  });

  it("renders the identity fields with the Pencil labels and placeholders", () => {
    render(<Step1Form />);

    expect(screen.getByLabelText("Nombre")).toHaveAttribute("placeholder", "Tu nombre");
    expect(screen.getByLabelText("Apellido")).toHaveAttribute("placeholder", "Tu apellido");
    expect(screen.getByLabelText("Apodo (opcional)")).toHaveAttribute(
      "placeholder",
      "Cómo te dicen en Nodo",
    );
    expect(screen.getByLabelText("Fecha de nacimiento")).toHaveAttribute("type", "date");
  });

  it("marks nombre, apellido and fecha de nacimiento as required — apodo is not", () => {
    render(<Step1Form />);

    expect(screen.getByLabelText("Nombre")).toBeRequired();
    expect(screen.getByLabelText("Apellido")).toBeRequired();
    expect(screen.getByLabelText("Fecha de nacimiento")).toBeRequired();
    expect(screen.getByLabelText("Apodo (opcional)")).not.toBeRequired();
    expect(screen.getAllByText("*")).toHaveLength(3);
  });

  it("does not ask for nombre_visible (that lives in editar perfil)", () => {
    render(<Step1Form />);

    expect(document.querySelector('[name="nombre_visible"]')).toBeNull();
  });

  it("renders the photo control wired to the upload pipeline", () => {
    render(<Step1Form />);

    expect(screen.getByText("Agregar foto")).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toHaveAttribute("name", "avatar");
  });

  it("shows the stored photo when the profile already has one", () => {
    render(<Step1Form avatarUrl="https://sb.test/avatars/u/a.jpg" />);

    expect(screen.getByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
    expect(screen.getByText("Cambiar foto")).toBeInTheDocument();
  });

  it("prefills the fields with the saved profile data", () => {
    render(
      <Step1Form
        defaults={{
          nombre: "Juan",
          apellido: "Pérez",
          apodo: "juancito",
          fecha_nacimiento: "1990-01-15",
        }}
      />,
    );

    expect(screen.getByLabelText("Nombre")).toHaveValue("Juan");
    expect(screen.getByLabelText("Apellido")).toHaveValue("Pérez");
    expect(screen.getByLabelText("Apodo (opcional)")).toHaveValue("juancito");
    expect(screen.getByLabelText("Fecha de nacimiento")).toHaveValue("1990-01-15");
  });

  it("submits with the Pencil CTA copy", () => {
    render(<Step1Form />);

    expect(screen.getByRole("button", { name: "Guardar y continuar" })).toHaveAttribute(
      "type",
      "submit",
    );
  });
});
