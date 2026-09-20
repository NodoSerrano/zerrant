import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ auth: authMock }),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(pathWithQuery: string): NextRequest {
  return new NextRequest(new URL(`https://example.com${pathWithQuery}`));
}

describe("GET /auth/callback", () => {
  it("exchanges ?code= and redirects to next on success", async () => {
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null });

    const result = await GET(makeRequest("/auth/callback?code=abc&next=%2Fonboarding%2Fstep1"));

    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/onboarding/step1");
  });

  it("verifies ?token_hash=&type= via verifyOtp and redirects home on success", async () => {
    authMock.verifyOtp.mockResolvedValue({ error: null });

    const result = await GET(makeRequest("/auth/callback?token_hash=tok123&type=signup&next=%2F"));

    expect(authMock.verifyOtp).toHaveBeenCalledWith({
      token_hash: "tok123",
      type: "signup",
    });
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/");
  });

  it("redirects to login with otp_expired when GoTrue reports an expired link", async () => {
    const result = await GET(
      makeRequest(
        "/auth/callback?error=access_denied&error_code=otp_expired&error_description=Expired",
      ),
    );

    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(authMock.verifyOtp).not.toHaveBeenCalled();
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("https://example.com/auth/login?error=otp_expired");
  });

  it("redirects to login with auth_callback_failed when code exchange fails", async () => {
    authMock.exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid" },
    });

    const result = await GET(makeRequest("/auth/callback?code=bad"));

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe(
      "https://example.com/auth/login?error=auth_callback_failed",
    );
  });

  it("redirects to login with auth_callback_failed when neither code nor token_hash is present", async () => {
    const result = await GET(makeRequest("/auth/callback"));

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe(
      "https://example.com/auth/login?error=auth_callback_failed",
    );
  });
});
