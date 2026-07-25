import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profileSingle: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: mocks.select.mockImplementation(() => ({
        eq: vi.fn(() => ({ single: mocks.profileSingle })),
      })),
    })),
  }),
}));

vi.mock("@/features/profile/actions", () => ({
  saveOnboardingStep1: vi.fn(),
  uploadAvatar: vi.fn(),
}));

import OnboardingStep1 from "@/app/(app)/onboarding/step1/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
});

describe("OnboardingStep1 page", () => {
  it("prefills the form with what the profile already has", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: {
        nombre: "Juan",
        apellido: "Pérez",
        apodo: "juancito",
        fecha_nacimiento: "1990-01-15",
        avatar_url: "https://sb.test/avatars/u/a.jpg",
      },
      error: null,
    });

    render(await OnboardingStep1());

    expect(screen.getByLabelText("Nombre")).toHaveValue("Juan");
    expect(screen.getByLabelText("Apellido")).toHaveValue("Pérez");
    expect(screen.getByLabelText("Apodo (opcional)")).toHaveValue("juancito");
    expect(screen.getByLabelText("Fecha de nacimiento")).toHaveValue("1990-01-15");
    expect(screen.getByRole("img", { name: "Foto de perfil" })).toBeInTheDocument();
  });

  it("only reads the profile of the authenticated user", async () => {
    mocks.profileSingle.mockResolvedValue({ data: null, error: null });

    render(await OnboardingStep1());

    expect(mocks.select).toHaveBeenCalledWith(
      "nombre, apellido, apodo, fecha_nacimiento, avatar_url",
    );
  });

  it("renders an empty form for a brand new profile", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: {
        nombre: null,
        apellido: null,
        apodo: null,
        fecha_nacimiento: null,
        avatar_url: null,
      },
      error: null,
    });

    render(await OnboardingStep1());

    expect(screen.getByLabelText("Nombre")).toHaveValue("");
    expect(screen.getByText("Agregar foto")).toBeInTheDocument();
  });

  it("still renders the form when there is no session (the proxy owns the redirect)", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    render(await OnboardingStep1());

    expect(mocks.profileSingle).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Guardar y continuar" })).toBeInTheDocument();
  });
});
