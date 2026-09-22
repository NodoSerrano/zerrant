import { afterEach, describe, expect, it, vi } from "vitest";
import { isGoogleAuthEnabled } from "./google-auth-enabled";

describe("isGoogleAuthEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when NEXT_PUBLIC_GOOGLE_AUTH_ENABLED is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", undefined);
    expect(isGoogleAuthEnabled()).toBe(false);
  });

  it("is false when NEXT_PUBLIC_GOOGLE_AUTH_ENABLED is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "");
    expect(isGoogleAuthEnabled()).toBe(false);
  });

  it("is false when NEXT_PUBLIC_GOOGLE_AUTH_ENABLED is not exactly true", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "false");
    expect(isGoogleAuthEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "1");
    expect(isGoogleAuthEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "TRUE");
    expect(isGoogleAuthEnabled()).toBe(false);
  });

  it("is true only when NEXT_PUBLIC_GOOGLE_AUTH_ENABLED is true", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "true");
    expect(isGoogleAuthEnabled()).toBe(true);
  });
});
