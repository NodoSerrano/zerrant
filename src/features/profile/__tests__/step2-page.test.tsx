import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockSaveOnboardingStep2 = vi.hoisted(() => vi.fn());

vi.mock("@/features/profile/actions", () => ({
  saveOnboardingStep2: mockSaveOnboardingStep2,
}));

import OnboardingStep2 from "@/app/(app)/onboarding/step2/page";

describe("OnboardingStep2 page", () => {
  it("renders the Pencil chrome copy", () => {
    render(<OnboardingStep2 />);

    expect(screen.getByText("Paso 2 de 2")).toBeInTheDocument();
    expect(screen.getByText("Contá un poco más")).toBeInTheDocument();
    expect(screen.getByText("Sumá tu bio y cómo te contactan.")).toBeInTheDocument();
  });

  it("renders the form fields with Pencil labels", () => {
    render(<OnboardingStep2 />);

    expect(screen.getByLabelText("Bio")).toBeInTheDocument();
    expect(screen.getByLabelText("Telegram / contacto")).toBeInTheDocument();
    expect(screen.getByLabelText("Sitio o portfolio (opcional)")).toBeInTheDocument();
  });

  it("shows the Finalizar CTA matching Pencil", () => {
    render(<OnboardingStep2 />);

    expect(screen.getByRole("button", { name: "Finalizar" })).toHaveAttribute("type", "submit");
  });

  it("renders a textarea for the bio field", () => {
    render(<OnboardingStep2 />);

    const bio = screen.getByLabelText("Bio");
    expect(bio.tagName).toBe("TEXTAREA");
  });

  it("displays the server action error when the save fails", async () => {
    mockSaveOnboardingStep2.mockReturnValue({ error: "No pudimos guardar tus datos." });

    render(<OnboardingStep2 />);

    const form = screen.getByRole("button", { name: "Finalizar" }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("No pudimos guardar tus datos.");
    });
  });

  it("renders the chevron-left icon in the step header", () => {
    render(<OnboardingStep2 />);

    expect(screen.getByText("Paso 2 de 2")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });
});
