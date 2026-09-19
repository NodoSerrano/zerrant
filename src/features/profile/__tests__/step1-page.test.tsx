import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOnboardingGateProfile: vi.fn(),
}));

vi.mock("@/features/profile/onboarding-gate-server", () => ({
  getOnboardingGateProfile: mocks.getOnboardingGateProfile,
}));

vi.mock("@/features/profile/actions", () => ({
  saveOnboardingStep1: vi.fn(),
  uploadAvatar: vi.fn(),
}));

import OnboardingStep1 from "@/app/(onboarding)/onboarding/step1/page";

afterEach(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OnboardingStep1 page", () => {
  it("prefills the form with what the profile already has", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test");
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: {
        nombre: "Juan",
        apellido: "Pérez",
        apodo: "juancito",
        fecha_nacimiento: "1990-01-15",
        avatar_url: "https://sb.test/storage/v1/object/public/avatars/u/a.jpg",
        onboarding_completado_en: null,
      },
      error: null,
      userId: "test-user-id",
    });

    render(await OnboardingStep1());

    expect(screen.getByLabelText("Nombre")).toHaveValue("Juan");
    expect(screen.getByLabelText("Apellido")).toHaveValue("Pérez");
    expect(screen.getByLabelText("Apodo (opcional)")).toHaveValue("juancito");
    expect(screen.getByLabelText("Fecha de nacimiento")).toHaveValue("1990-01-15");
    expect(screen.getByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
  });

  it("reads profile via the cached onboarding gate helper", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: null,
      error: null,
      userId: "test-user-id",
    });

    render(await OnboardingStep1());

    expect(mocks.getOnboardingGateProfile).toHaveBeenCalledTimes(1);
  });

  it("renders an empty form for a brand new profile", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: {
        nombre: null,
        apellido: null,
        apodo: null,
        fecha_nacimiento: null,
        avatar_url: null,
        onboarding_completado_en: null,
      },
      error: null,
      userId: "test-user-id",
    });

    render(await OnboardingStep1());

    expect(screen.getByLabelText("Nombre")).toHaveValue("");
    expect(screen.getByText("Agregar foto")).toBeInTheDocument();
  });

  it("still renders an empty form when the profile row is genuinely missing (PGRST116)", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: null,
      error: { code: "PGRST116", message: "The result contains 0 rows" },
      userId: "test-user-id",
    });

    render(await OnboardingStep1());

    expect(screen.getByLabelText("Nombre")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Guardar y continuar" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a clear error with retry when the profile read fails, not a silent empty form", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: null,
      error: { code: "57014", message: "canceling statement due to statement timeout" },
      userId: "test-user-id",
    });

    render(await OnboardingStep1());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No pudimos cargar tu perfil. Probá de nuevo.",
    );
    expect(screen.getByRole("link", { name: "Reintentar" })).toHaveAttribute(
      "href",
      "/onboarding/step1",
    );
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar y continuar" })).not.toBeInTheDocument();
  });

  it("still renders the form when there is no session (auth redirect is proxy-owned)", async () => {
    mocks.getOnboardingGateProfile.mockResolvedValue({
      profile: null,
      error: null,
      userId: null,
    });

    render(await OnboardingStep1());

    expect(screen.getByRole("button", { name: "Guardar y continuar" })).toBeInTheDocument();
  });
});
