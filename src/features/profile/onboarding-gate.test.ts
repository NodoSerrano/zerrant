import { describe, expect, it } from "vitest";
import {
  isOnboardingComplete,
  isStep1Complete,
  nextOnboardingPath,
  resolveOnboardingRedirect,
  type OnboardingGateProfile,
} from "./onboarding-gate";

function profile(overrides: Partial<OnboardingGateProfile> = {}): OnboardingGateProfile {
  return {
    nombre: null,
    apellido: null,
    fecha_nacimiento: null,
    onboarding_completado_en: null,
    ...overrides,
  };
}

describe("isOnboardingComplete", () => {
  it("is true when onboarding_completado_en is set", () => {
    expect(
      isOnboardingComplete(profile({ onboarding_completado_en: "2026-07-25T00:00:00Z" })),
    ).toBe(true);
  });

  it("is false for null, undefined, and empty profile", () => {
    expect(isOnboardingComplete(null)).toBe(false);
    expect(isOnboardingComplete(undefined)).toBe(false);
    expect(isOnboardingComplete(profile())).toBe(false);
  });
});

describe("isStep1Complete", () => {
  it("requires nombre, apellido, and fecha_nacimiento", () => {
    expect(
      isStep1Complete(
        profile({ nombre: "Juan", apellido: "Pérez", fecha_nacimiento: "1990-01-15" }),
      ),
    ).toBe(true);
  });

  it("is false when any required field is missing", () => {
    expect(isStep1Complete(profile({ nombre: "Juan", apellido: "Pérez" }))).toBe(false);
    expect(isStep1Complete(profile({ nombre: "Juan", fecha_nacimiento: "1990-01-15" }))).toBe(
      false,
    );
    expect(isStep1Complete(profile({ apellido: "Pérez", fecha_nacimiento: "1990-01-15" }))).toBe(
      false,
    );
    expect(isStep1Complete(null)).toBe(false);
    expect(isStep1Complete(undefined)).toBe(false);
  });
});

describe("nextOnboardingPath", () => {
  it("sends unfinished step1 users to step1", () => {
    expect(nextOnboardingPath(null)).toBe("/onboarding/step1");
    expect(nextOnboardingPath(profile({ nombre: "Juan" }))).toBe("/onboarding/step1");
  });

  it("sends step1-done users to step2", () => {
    expect(
      nextOnboardingPath(
        profile({ nombre: "Juan", apellido: "Pérez", fecha_nacimiento: "1990-01-15" }),
      ),
    ).toBe("/onboarding/step2");
  });
});

describe("resolveOnboardingRedirect", () => {
  it("sends unfinished users outside onboarding to the right step", () => {
    expect(resolveOnboardingRedirect(profile(), "/nodo/tasks")).toBe("/onboarding/step1");
    expect(
      resolveOnboardingRedirect(
        profile({ nombre: "Juan", apellido: "Pérez", fecha_nacimiento: "1990-01-15" }),
        "/profile",
      ),
    ).toBe("/onboarding/step2");
  });

  it("does not bounce inside the correct onboarding step", () => {
    expect(resolveOnboardingRedirect(profile(), "/onboarding/step1")).toBeNull();
    expect(
      resolveOnboardingRedirect(
        profile({ nombre: "Juan", apellido: "Pérez", fecha_nacimiento: "1990-01-15" }),
        "/onboarding/step2",
      ),
    ).toBeNull();
  });

  it("sends unfinished users on step2 without step1 back to step1", () => {
    expect(resolveOnboardingRedirect(profile(), "/onboarding/step2")).toBe("/onboarding/step1");
  });

  it("sends finished users out of /onboarding", () => {
    expect(
      resolveOnboardingRedirect(
        profile({
          nombre: "Juan",
          apellido: "Pérez",
          fecha_nacimiento: "1990-01-15",
          onboarding_completado_en: "2026-07-25T00:00:00Z",
        }),
        "/onboarding/step1",
      ),
    ).toBe("/");
  });

  it("lets finished users stay on protected app routes", () => {
    expect(
      resolveOnboardingRedirect(
        profile({
          nombre: "Juan",
          apellido: "Pérez",
          fecha_nacimiento: "1990-01-15",
          onboarding_completado_en: "2026-07-25T00:00:00Z",
        }),
        "/nodo/tasks",
      ),
    ).toBeNull();
  });
});
