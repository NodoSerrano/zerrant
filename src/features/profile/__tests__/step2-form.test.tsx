import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSaveOnboardingStep2 = vi.hoisted(() => vi.fn());

vi.mock("@/features/profile/actions", () => ({
  saveOnboardingStep2: mockSaveOnboardingStep2,
}));

import { Step2Form } from "@/app/(onboarding)/onboarding/step2/Step2Form";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Step2Form", () => {
  it("renders the Pencil chrome copy", () => {
    render(<Step2Form />);

    expect(screen.getByText("Paso 2 de 2")).toBeInTheDocument();
    expect(screen.getByText("Contá un poco más")).toBeInTheDocument();
    expect(screen.getByText("Sumá tu bio y cómo te contactan.")).toBeInTheDocument();
  });

  it("renders the form fields with Pencil labels", () => {
    render(<Step2Form />);

    expect(screen.getByLabelText("Bio")).toBeInTheDocument();
    expect(screen.getByLabelText("Telegram / contacto")).toBeInTheDocument();
    expect(screen.getByLabelText("Sitio o portfolio (opcional)")).toBeInTheDocument();
  });

  it("shows the Finalizar CTA matching Pencil", () => {
    render(<Step2Form />);

    expect(screen.getByRole("button", { name: "Finalizar" })).toHaveAttribute("type", "submit");
  });

  it("renders a textarea for the bio field", () => {
    render(<Step2Form />);

    const bio = screen.getByLabelText("Bio");
    expect(bio.tagName).toBe("TEXTAREA");
  });

  it("prefills fields from saved profile data", () => {
    render(
      <Step2Form
        defaults={{
          bio: "Hago luces",
          contacto_telegram: "@juan",
          sitio_url: "https://juan.dev",
        }}
      />,
    );

    expect(screen.getByLabelText("Bio")).toHaveValue("Hago luces");
    expect(screen.getByLabelText("Telegram / contacto")).toHaveValue("@juan");
    expect(screen.getByLabelText("Sitio o portfolio (opcional)")).toHaveValue("https://juan.dev");
  });

  it("displays the server action error when the save fails", async () => {
    mockSaveOnboardingStep2.mockReturnValue({ error: "No pudimos guardar tus datos." });

    render(<Step2Form />);

    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("No pudimos guardar tus datos.");
    });
  });

  it("keeps typed values and shows an alert when transport fails", async () => {
    mockSaveOnboardingStep2.mockRejectedValue(new TypeError("Failed to fetch"));

    render(
      <Step2Form
        defaults={{
          bio: "Borrador",
          contacto_telegram: "@draft",
          sitio_url: "https://draft.dev",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No pudimos conectar. Revisá tu conexión e intentá de nuevo.",
      );
    });

    // Uncontrolled fields keep browser-typed values; defaults prove the form stayed mounted.
    expect(screen.getByLabelText("Bio")).toHaveValue("Borrador");
    expect(screen.getByLabelText("Telegram / contacto")).toHaveValue("@draft");
    expect(screen.getByRole("button", { name: "Finalizar" })).toBeEnabled();
  });

  it("links the chevron-left back control to step1", () => {
    render(<Step2Form />);

    expect(screen.getByRole("link", { name: "Volver al paso 1" })).toHaveAttribute(
      "href",
      "/onboarding/step1",
    );
  });
});
