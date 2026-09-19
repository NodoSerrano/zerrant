import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOnboardingGateProfile: vi.fn(),
}));

vi.mock("@/features/profile/onboarding-gate-server", () => ({
  getOnboardingGateProfile: mocks.getOnboardingGateProfile,
}));

vi.mock("@/features/profile/actions", () => ({
  saveOnboardingStep2: vi.fn(),
}));

import OnboardingStep2 from "@/app/(onboarding)/onboarding/step2/page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OnboardingStep2 page", () => {
  it("prefills bio, contact and site from the profile", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: {
        nombre: "Juan",
        apellido: "Pérez",
        fecha_nacimiento: "1990-01-15",
        onboarding_completado_en: null,
        bio: "Hago luces",
        contacto_telegram: "@juan",
        sitio_url: "https://juan.dev",
      },
      error: null,
      userId: "test-user-id",
    });

    render(await OnboardingStep2());

    expect(screen.getByLabelText("Bio")).toHaveValue("Hago luces");
    expect(screen.getByLabelText("Telegram / contacto")).toHaveValue("@juan");
    expect(screen.getByLabelText("Sitio o portfolio (opcional)")).toHaveValue("https://juan.dev");
  });

  it("renders an empty form for a brand new step2 profile", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: {
        nombre: "Juan",
        apellido: "Pérez",
        fecha_nacimiento: "1990-01-15",
        onboarding_completado_en: null,
        bio: null,
        contacto_telegram: null,
        sitio_url: null,
      },
      error: null,
      userId: "test-user-id",
    });

    render(await OnboardingStep2());

    expect(screen.getByLabelText("Bio")).toHaveValue("");
    expect(screen.getByLabelText("Telegram / contacto")).toHaveValue("");
    expect(screen.getByLabelText("Sitio o portfolio (opcional)")).toHaveValue("");
  });

  it("still renders an empty form when the profile row is genuinely missing (PGRST116)", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: null,
      error: { code: "PGRST116", message: "The result contains 0 rows" },
      userId: "test-user-id",
    });

    render(await OnboardingStep2());

    expect(screen.getByLabelText("Bio")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Finalizar" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a clear error with retry when the profile read fails, not a silent empty form", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: null,
      error: { code: "57014", message: "canceling statement due to statement timeout" },
      userId: "test-user-id",
    });

    render(await OnboardingStep2());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No pudimos cargar tu perfil. Probá de nuevo.",
    );
    expect(screen.getByRole("link", { name: "Reintentar" })).toHaveAttribute(
      "href",
      "/onboarding/step2",
    );
    expect(screen.getByRole("link", { name: "Volver al paso 1" })).toHaveAttribute(
      "href",
      "/onboarding/step1",
    );
    expect(screen.queryByLabelText("Bio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finalizar" })).not.toBeInTheDocument();
  });

  it("links the back chevron to step1", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: {
        nombre: "Juan",
        apellido: "Pérez",
        fecha_nacimiento: "1990-01-15",
        onboarding_completado_en: null,
      },
      error: null,
      userId: "test-user-id",
    });

    render(await OnboardingStep2());

    expect(screen.getByRole("link", { name: "Volver al paso 1" })).toHaveAttribute(
      "href",
      "/onboarding/step1",
    );
  });
});
