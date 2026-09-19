import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profileSingle: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  createClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  headersGet: vi.fn(),
  /** Vitest has no RSC cache scope — stub React.cache as a simple memo. */
  cache: <T extends (...args: never[]) => unknown>(fn: T): T => {
    let result: ReturnType<T> | undefined;
    let ran = false;
    return ((...args: Parameters<T>) => {
      if (!ran) {
        ran = true;
        result = fn(...args) as ReturnType<T>;
      }
      return result as ReturnType<T>;
    }) as T;
  },
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: mocks.cache };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: mocks.headersGet,
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: mocks.select.mockImplementation(() => ({
        eq: mocks.eq.mockImplementation(() => ({
          single: mocks.profileSingle,
        })),
      })),
    })),
  });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.headersGet.mockReturnValue("/nodo/tasks");
  mocks.profileSingle.mockResolvedValue({
    data: {
      nombre: "Juan",
      apellido: "Pérez",
      fecha_nacimiento: "1990-01-15",
      onboarding_completado_en: "2026-07-25T00:00:00Z",
      apodo: null,
      avatar_url: null,
    },
    error: null,
  });
});

describe("getOnboardingGateProfile", () => {
  it("dedupes two calls in the same request to a single profiles select", async () => {
    const { getOnboardingGateProfile } = await import("./onboarding-gate-server");

    const [a, b] = await Promise.all([getOnboardingGateProfile(), getOnboardingGateProfile()]);

    expect(a.profile?.nombre).toBe("Juan");
    expect(b.profile?.nombre).toBe("Juan");
    expect(mocks.profileSingle).toHaveBeenCalledTimes(1);
    expect(mocks.select).toHaveBeenCalledWith(
      "nombre, apellido, fecha_nacimiento, onboarding_completado_en, apodo, avatar_url",
    );
  });

  it("returns null profile without querying when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const { getOnboardingGateProfile } = await import("./onboarding-gate-server");

    const result = await getOnboardingGateProfile();

    expect(result).toEqual({ profile: null, error: null, userId: null });
    expect(mocks.profileSingle).not.toHaveBeenCalled();
  });

  it("treats PGRST116 as empty profile", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "no rows" },
    });
    const { getOnboardingGateProfile } = await import("./onboarding-gate-server");

    const result = await getOnboardingGateProfile();

    expect(result.profile).toBeNull();
    expect(result.error?.code).toBe("PGRST116");
    expect(result.userId).toBe("user-1");
  });
});

describe("enforceOnboardingGate", () => {
  it("soft-allows when the profile query fails with a non-NO_ROWS error", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "canceling statement due to statement timeout" },
    });
    const { enforceOnboardingGate } = await import("./onboarding-gate-server");

    await expect(enforceOnboardingGate("/nodo/tasks")).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects unfinished users outside onboarding to step1", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: {
        nombre: null,
        apellido: null,
        fecha_nacimiento: null,
        onboarding_completado_en: null,
        apodo: null,
        avatar_url: null,
      },
      error: null,
    });
    const { enforceOnboardingGate } = await import("./onboarding-gate-server");

    await expect(enforceOnboardingGate("/nodo/tasks")).rejects.toThrow(
      "REDIRECT:/onboarding/step1",
    );
  });

  it("redirects unfinished step1-done users to step2", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: {
        nombre: "Juan",
        apellido: "Pérez",
        fecha_nacimiento: "1990-01-15",
        onboarding_completado_en: null,
        apodo: null,
        avatar_url: null,
      },
      error: null,
    });
    const { enforceOnboardingGate } = await import("./onboarding-gate-server");

    await expect(enforceOnboardingGate("/profile")).rejects.toThrow("REDIRECT:/onboarding/step2");
  });

  it("does not bounce unfinished users already on step1", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: {
        nombre: null,
        apellido: null,
        fecha_nacimiento: null,
        onboarding_completado_en: null,
        apodo: null,
        avatar_url: null,
      },
      error: null,
    });
    const { enforceOnboardingGate } = await import("./onboarding-gate-server");

    await expect(enforceOnboardingGate("/onboarding/step1")).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("sends unfinished users on step2 without step1 back to step1", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: {
        nombre: null,
        apellido: null,
        fecha_nacimiento: null,
        onboarding_completado_en: null,
        apodo: null,
        avatar_url: null,
      },
      error: null,
    });
    const { enforceOnboardingGate } = await import("./onboarding-gate-server");

    await expect(enforceOnboardingGate("/onboarding/step2")).rejects.toThrow(
      "REDIRECT:/onboarding/step1",
    );
  });

  it("sends finished users out of /onboarding", async () => {
    const { enforceOnboardingGate } = await import("./onboarding-gate-server");

    await expect(enforceOnboardingGate("/onboarding/step1")).rejects.toThrow("REDIRECT:/");
  });

  it("lets finished users stay on protected routes", async () => {
    const { enforceOnboardingGate } = await import("./onboarding-gate-server");

    await expect(enforceOnboardingGate("/nodo/tasks")).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("reads pathname from x-pathname header when not passed", async () => {
    mocks.headersGet.mockReturnValue("/onboarding/step1");
    mocks.profileSingle.mockResolvedValue({
      data: {
        nombre: "Juan",
        apellido: "Pérez",
        fecha_nacimiento: "1990-01-15",
        onboarding_completado_en: "2026-07-25T00:00:00Z",
        apodo: null,
        avatar_url: null,
      },
      error: null,
    });
    const { enforceOnboardingGate } = await import("./onboarding-gate-server");

    await expect(enforceOnboardingGate()).rejects.toThrow("REDIRECT:/");
    expect(mocks.headersGet).toHaveBeenCalledWith("x-pathname");
  });

  it("treats missing profile row as unfinished onboarding", async () => {
    mocks.profileSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "no rows" },
    });
    const { enforceOnboardingGate } = await import("./onboarding-gate-server");

    await expect(enforceOnboardingGate("/profile")).rejects.toThrow("REDIRECT:/onboarding/step1");
  });
});
