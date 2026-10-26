import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSaveOnboardingStep1 = vi.hoisted(() => vi.fn());
const mockUploadAvatar = vi.hoisted(() => vi.fn());

vi.mock("@/features/profile/actions", () => ({
  saveOnboardingStep1: mockSaveOnboardingStep1,
  uploadAvatar: mockUploadAvatar,
}));

import { Step1Form } from "@/app/(onboarding)/onboarding/step1/Step1Form";

afterEach(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Step1Form", () => {
  it("renders the Pencil chrome copy", () => {
    render(<Step1Form />);

    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Creá tu perfil")).toBeInTheDocument();
    expect(screen.getByText("Así el resto de la comunidad te conoce.")).toBeInTheDocument();
  });

  it("explains why the photo matters, keeping it optional", () => {
    render(<Step1Form />);

    expect(
      screen.getByText("Necesitamos una foto clara para poder reconocerte."),
    ).toBeInTheDocument();
    for (const input of document.querySelectorAll('input[type="file"]')) {
      expect(input).not.toBeRequired();
    }
  });

  it("has no back control (onboarding cannot be skipped)", () => {
    render(<Step1Form />);

    // Step 1's only controls are the photo and the submit: any "back"
    // chevron (link or button) would show up here.
    expect(screen.getAllByRole("button").map((el) => el.textContent)).toEqual([
      "Subir foto",
      "Sacar foto",
      "Guardar perfil",
    ]);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("does not let the form be submitted while the photo is uploading", async () => {
    mockUploadAvatar.mockReturnValue(new Promise(() => {}));
    render(<Step1Form />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [new File([new Uint8Array([0xff, 0xd8, 0xff])], "foto.jpg", { type: "image/jpeg" })],
      configurable: true,
    });
    fireEvent.change(input);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Subiendo foto..." })).toBeDisabled(),
    );
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

  it("birth date field is native date with min/max bounds (mobile-friendly)", () => {
    render(<Step1Form />);

    const birth = screen.getByLabelText("Fecha de nacimiento");
    expect(birth).toHaveAttribute("type", "date");
    expect(birth).toHaveAttribute("name", "fecha_nacimiento");
    expect(birth).toHaveAttribute("min", "1900-01-01");
    expect(birth).toHaveAttribute("max");
    const max = birth.getAttribute("max");
    expect(max).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(max! <= new Date().toISOString().slice(0, 10)).toBe(true);
    expect(birth).toHaveAttribute("autoComplete", "bday");
  });

  it("marks nombre, apellido and fecha de nacimiento as required — apodo is not", () => {
    render(<Step1Form />);

    expect(screen.getByLabelText("Nombre")).toBeRequired();
    expect(screen.getByLabelText("Apellido")).toBeRequired();
    expect(screen.getByLabelText("Fecha de nacimiento")).toBeRequired();
    expect(screen.getByLabelText("Apodo (opcional)")).not.toBeRequired();
    expect(screen.getByLabelText("Bio")).not.toBeRequired();
    expect(screen.getByLabelText("Telegram / contacto")).not.toBeRequired();
    expect(screen.getByLabelText("Sitio o portfolio (opcional)")).not.toBeRequired();
    expect(screen.getAllByText("*")).toHaveLength(3);
  });

  it("does not ask for nombre_visible (that lives in editar perfil)", () => {
    render(<Step1Form />);

    expect(document.querySelector('[name="nombre_visible"]')).toBeNull();
  });

  it("renders the photo control wired to the upload pipeline", () => {
    render(<Step1Form />);

    expect(screen.getByRole("button", { name: "Subir foto" })).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toHaveAttribute("name", "avatar");
  });

  it("shows the stored photo when the profile already has one", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    render(<Step1Form avatarUrl="https://sb.test/storage/v1/object/public/avatars/u/a.jpg" />);

    expect(screen.getByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir foto" })).toBeInTheDocument();
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

  it("names the next step on the submit button", () => {
    render(<Step1Form />);

    expect(screen.getByRole("button", { name: "Guardar perfil" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("names the membership next step when the pipeline is showing", () => {
    render(
      <Step1Form
        progress={{
          current: 3,
          steps: [
            { key: "registro", label: "Registro", status: "done" },
            { key: "verificacion", label: "Verificación", status: "done" },
            { key: "perfil", label: "Perfil", status: "current" },
            { key: "solicitud", label: "Solicitud", status: "pending" },
            { key: "horario", label: "Horario", status: "pending" },
            { key: "entrevista", label: "Entrevista", status: "pending" },
            { key: "resolucion", label: "Resolución", status: "pending" },
            { key: "miembro", label: "Miembro", status: "pending" },
          ],
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Continuar a la solicitud" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(screen.queryByRole("button", { name: "Finalizar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar y continuar" })).not.toBeInTheDocument();
  });
});

describe("Step1Form on mobile (ZER-176)", () => {
  it("uses 16px text in the bio so iOS Safari does not zoom in on focus", () => {
    render(<Step1Form />);
    const bio = document.querySelector("textarea#bio") as HTMLTextAreaElement;
    expect(bio).toHaveClass("text-base");
    expect(bio.className).not.toContain("text-[15px]");
  });
});
