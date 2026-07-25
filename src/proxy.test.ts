import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockProfileSingle = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mockProfileSingle })),
      })),
    })),
  })),
}));

const mockNextCookiesSet = vi.fn();

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({
        status: 200,
        cookies: { set: mockNextCookiesSet },
      })),
      redirect: vi.fn((url: URL) => ({
        status: 307,
        headers: new Headers({ location: url.toString() }),
      })),
    },
  };
});

import proxy from "./proxy";

beforeEach(() => {
  vi.clearAllMocks();
  onboardingDone();
});

function onboardingDone() {
  mockProfileSingle.mockResolvedValue({
    data: {
      nombre: "Juan",
      apellido: "Pérez",
      fecha_nacimiento: "1990-01-15",
      onboarding_completado_en: "2026-07-25T00:00:00Z",
    },
    error: null,
  });
}

function onboardingPending(overrides: Record<string, string | null> = {}) {
  mockProfileSingle.mockResolvedValue({
    data: {
      nombre: null,
      apellido: null,
      fecha_nacimiento: null,
      onboarding_completado_en: null,
      ...overrides,
    },
    error: null,
  });
}

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(`https://example.com${path}`));
}

function authAs(userId = "test-user-id") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
}

function noAuth() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

describe("proxy", () => {
  it("redirects authenticated user from /auth/login to /", async () => {
    authAs();
    const request = makeRequest("/auth/login");

    const result = await proxy(request);

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/");
  });

  it("passes through /auth/login without authenticated user", async () => {
    noAuth();
    const request = makeRequest("/auth/login");

    const result = await proxy(request);

    expect(result.status).toBe(200);
    expect(result.cookies).toBeDefined();
  });

  it("redirects unauthenticated user from /profile to /auth/login?next=%2Fprofile", async () => {
    noAuth();
    const request = makeRequest("/profile");

    const result = await proxy(request);

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/auth/login?next=%2Fprofile");
  });

  it("redirects unauthenticated user from /onboarding/step1 to /auth/login?next=%2Fonboarding%2Fstep1", async () => {
    noAuth();
    const request = makeRequest("/onboarding/step1");

    const result = await proxy(request);

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe(
      "https://example.com/auth/login?next=%2Fonboarding%2Fstep1",
    );
  });

  it("redirects unauthenticated user from / to /auth/login?next=%2F", async () => {
    noAuth();
    const request = makeRequest("/");

    const result = await proxy(request);

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/auth/login?next=%2F");
  });

  it("passes through protected route with authenticated user", async () => {
    authAs();
    const request = makeRequest("/profile");

    const result = await proxy(request);

    expect(result.status).toBe(200);
    expect(result.cookies).toBeDefined();
  });

  it("redirects unauthenticated user from /nodo/tasks to login", async () => {
    noAuth();

    const result = await proxy(makeRequest("/nodo/tasks"));

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe(
      "https://example.com/auth/login?next=%2Fnodo%2Ftasks",
    );
  });

  it("sends an authenticated user with unfinished onboarding back to step 1", async () => {
    authAs();
    onboardingPending();

    const result = await proxy(makeRequest("/nodo/tasks"));

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/onboarding/step1");
  });

  it("does not bounce inside /onboarding while it is unfinished", async () => {
    authAs();
    onboardingPending();

    const result = await proxy(makeRequest("/onboarding/step2"));

    expect(result.status).toBe(200);
  });

  it("keeps the user in the onboarding until step 2 is submitted", async () => {
    authAs();
    // Paso 1 guardado, paso 2 todavía no: la marca sigue vacía.
    onboardingPending({ nombre: "Juan", apellido: "Pérez", fecha_nacimiento: "1990-01-15" });

    const result = await proxy(makeRequest("/nodo/tasks"));

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/onboarding/step2");
  });

  it("resumes at step 2 when only step 1 was saved", async () => {
    authAs();
    onboardingPending({ nombre: "Juan", apellido: "Pérez", fecha_nacimiento: "1990-01-15" });

    const result = await proxy(makeRequest("/onboarding/step2"));

    expect(result.status).toBe(200);
  });

  it("treats a missing profile row as unfinished onboarding", async () => {
    authAs();
    mockProfileSingle.mockResolvedValue({ data: null, error: { message: "no rows" } });

    const result = await proxy(makeRequest("/profile"));

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/onboarding/step1");
  });

  it("sends a user who already finished onboarding out of /onboarding", async () => {
    authAs();

    const result = await proxy(makeRequest("/onboarding/step1"));

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/");
  });

  it("does not query the profile when there is no session", async () => {
    noAuth();

    await proxy(makeRequest("/auth/login"));

    expect(mockProfileSingle).not.toHaveBeenCalled();
  });

  it("does not query the profile on auth routes", async () => {
    authAs();

    await proxy(makeRequest("/auth/login"));

    expect(mockProfileSingle).not.toHaveBeenCalled();
  });

  it("passes through unrestricted route /auth/callback regardless of auth state", async () => {
    noAuth();
    const request = makeRequest("/auth/callback");

    const result = await proxy(request);

    expect(result.status).toBe(200);
    expect(result.cookies).toBeDefined();
  });
});
