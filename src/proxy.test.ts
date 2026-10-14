import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockProfileSingle = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mockProfileSingle })),
      })),
    })),
  })),
}));

const mockNextCookiesSet = vi.fn();
const mockNext = vi.hoisted(() =>
  vi.fn((_init?: { request?: { headers?: Headers } }) => ({
    status: 200,
    cookies: { set: mockNextCookiesSet },
  })),
);

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();

  function MockNextResponse(body?: BodyInit | null, init?: ResponseInit) {
    return new actual.NextResponse(body, init);
  }

  MockNextResponse.next = mockNext;
  MockNextResponse.redirect = vi.fn((url: URL) => ({
    status: 307,
    headers: new Headers({ location: url.toString() }),
  }));
  MockNextResponse.json = actual.NextResponse.json.bind(actual.NextResponse);
  MockNextResponse.rewrite = actual.NextResponse.rewrite.bind(actual.NextResponse);

  return {
    ...actual,
    NextResponse: MockNextResponse,
  };
});

import proxy from "./proxy";

beforeEach(() => {
  vi.clearAllMocks();
  mockNext.mockImplementation(() => ({
    status: 200,
    cookies: { set: mockNextCookiesSet },
  }));
  mockProfileSingle.mockResolvedValue({
    data: { onboarding_completado_en: null },
    error: null,
  });
});

function makeRequest(
  path: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
): NextRequest {
  return new NextRequest(new URL(`https://example.com${path}`), init);
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

  it("passes through protected GET with authenticated user without querying profiles", async () => {
    authAs();
    const request = makeRequest("/profile");

    const result = await proxy(request);

    expect(result.status).toBe(200);
    expect(result.cookies).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated user from /nodo/tasks to login", async () => {
    noAuth();

    const result = await proxy(makeRequest("/nodo/tasks"));

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe(
      "https://example.com/auth/login?next=%2Fnodo%2Ftasks",
    );
  });

  it("does not protect routes that merely share a prefix", async () => {
    noAuth();

    const result = await proxy(makeRequest("/nodocosas"));

    expect(result.status).toBe(200);
  });

  it("does not query the profile when there is no session", async () => {
    noAuth();

    await proxy(makeRequest("/auth/login"));

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("does not query the profile on auth routes", async () => {
    authAs();

    await proxy(makeRequest("/auth/login"));

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("does not query profiles on protected GET (gate is RSC)", async () => {
    authAs();

    await proxy(makeRequest("/nodo/tasks"));
    await proxy(makeRequest("/onboarding/step1"));

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("forwards x-pathname on the request for RSC gate", async () => {
    authAs();

    await proxy(makeRequest("/nodo/tasks"));

    expect(mockNext).toHaveBeenCalled();
    const args = mockNext.mock.calls.at(-1)?.[0] as { request?: { headers?: Headers } } | undefined;
    expect(args?.request?.headers?.get("x-pathname")).toBe("/nodo/tasks");
  });

  it("explains a stale onboarding POST instead of redirecting with 307", async () => {
    authAs();
    mockProfileSingle.mockResolvedValue({
      data: { onboarding_completado_en: "2026-07-25T00:00:00Z" },
      error: null,
    });

    const result = await proxy(makeRequest("/onboarding/step2", { method: "POST" }));

    expect(result.status).not.toBe(307);
    expect(result.headers.get("location")).toBeNull();
    expect(result.headers.get("content-type") ?? "").toMatch(/text\/html/);
    const body = await result.text();
    expect(body).toMatch(/ya completaste el onboarding/i);
    expect(body).toMatch(/href="\/"/);
    expect(mockFrom).toHaveBeenCalled();
  });

  it("lets unfinished onboarding POST through without 409", async () => {
    authAs();
    mockProfileSingle.mockResolvedValue({
      data: { onboarding_completado_en: null },
      error: null,
    });

    const result = await proxy(makeRequest("/onboarding/step2", { method: "POST" }));

    expect(result.status).toBe(200);
  });

  it("passes through unrestricted route /auth/callback regardless of auth state", async () => {
    noAuth();
    const request = makeRequest("/auth/callback");

    const result = await proxy(request);

    expect(result.status).toBe(200);
    expect(result.cookies).toBeDefined();
  });

  it("redirects authenticated user from /auth/check-email to /", async () => {
    authAs();
    const request = makeRequest("/auth/check-email?email=a%40b.com&flow=signup");

    const result = await proxy(request);

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/");
  });

  it("passes through /auth/check-email without authenticated user", async () => {
    noAuth();
    const request = makeRequest("/auth/check-email?email=a%40b.com&flow=signup");

    const result = await proxy(request);

    expect(result.status).toBe(200);
  });

  describe("membership deep link (ZER-136)", () => {
    it.each([true, false])(
      "marks the membership flow cookie on /unirme (session: %s)",
      async (session) => {
        if (session) authAs();
        else noAuth();
        await proxy(makeRequest("/unirme"));

        expect(mockNextCookiesSet).toHaveBeenCalledWith(
          "ns_flujo",
          "membresia",
          expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 604800 }),
        );
      },
    );

    it.each([true, false])(
      "sets the flow cookie exactly once per /unirme request (session: %s)",
      async (session) => {
        if (session) authAs();
        else noAuth();
        await proxy(makeRequest("/unirme"));

        const flowSets = mockNextCookiesSet.mock.calls.filter(([name]) => name === "ns_flujo");
        expect(flowSets).toHaveLength(1);
      },
    );

    it("does not set the flow cookie elsewhere", async () => {
      authAs();
      await proxy(makeRequest("/solicitar"));

      expect(mockNextCookiesSet).not.toHaveBeenCalledWith(
        "ns_flujo",
        expect.anything(),
        expect.anything(),
      );
    });

    it("sends an authenticated user on an auth page to a safe next", async () => {
      authAs();
      const res = await proxy(makeRequest("/auth/signup?next=%2Funirme"));

      expect(res.headers.get("location")).toBe("https://example.com/unirme");
    });

    it("ignores an unsafe next on an auth page", async () => {
      authAs();
      const res = await proxy(makeRequest("/auth/login?next=%2F%2Fevil.com"));

      expect(res.headers.get("location")).toBe("https://example.com/");
    });

    it("never bounces back to the auth page itself", async () => {
      authAs();
      const res = await proxy(makeRequest("/auth/login?next=%2Fauth%2Flogin"));

      expect(res.headers.get("location")).toBe("https://example.com/");
    });

    it("protects /solicitar and carries it as next", async () => {
      noAuth();
      const res = await proxy(makeRequest("/solicitar"));

      expect(res.headers.get("location")).toBe("https://example.com/auth/login?next=%2Fsolicitar");
    });

    it("leaves /unirme public (the route resolves no-session itself)", async () => {
      noAuth();
      const res = await proxy(makeRequest("/unirme"));

      expect(res.status).toBe(200);
    });
  });
});
