import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSupabaseAvatarRemotePatterns,
  isServableAvatarImageUrl,
  shouldAllowLocalIPForAvatars,
} from "./avatar-image-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSupabaseAvatarRemotePatterns", () => {
  it("returns empty when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(getSupabaseAvatarRemotePatterns()).toEqual([]);
  });

  it("returns the public avatars pattern for the configured Supabase host", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(getSupabaseAvatarRemotePatterns()).toEqual([
      {
        protocol: "https",
        hostname: "abc.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/avatars/**",
      },
    ]);
  });

  it("preserves the local Supabase port in the pattern", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    expect(getSupabaseAvatarRemotePatterns()).toEqual([
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/avatars/**",
      },
    ]);
  });
});

describe("shouldAllowLocalIPForAvatars", () => {
  it("is false when Supabase URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(shouldAllowLocalIPForAvatars()).toBe(false);
  });

  it("is false for public Supabase hosts", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(shouldAllowLocalIPForAvatars()).toBe(false);
  });

  it("is true for loopback Supabase (local stack)", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    expect(shouldAllowLocalIPForAvatars()).toBe(true);
  });

  it("is true for localhost Supabase", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
    expect(shouldAllowLocalIPForAvatars()).toBe(true);
  });
});

describe("isServableAvatarImageUrl", () => {
  it("rejects absolute URLs when Supabase URL is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(
      isServableAvatarImageUrl("https://abc.supabase.co/storage/v1/object/public/avatars/u/a.jpg"),
    ).toBe(false);
  });

  it("rejects hosts outside remotePatterns", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(
      isServableAvatarImageUrl(
        "https://other.supabase.co/storage/v1/object/public/avatars/u/a.jpg",
      ),
    ).toBe(false);
  });

  it("accepts URLs that match the configured Supabase avatars pattern", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(
      isServableAvatarImageUrl("https://abc.supabase.co/storage/v1/object/public/avatars/u/a.jpg"),
    ).toBe(true);
  });

  it("rejects matching host with a non-avatars pathname", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(
      isServableAvatarImageUrl("https://abc.supabase.co/storage/v1/object/public/other/u/a.jpg"),
    ).toBe(false);
  });

  it("allows same-origin relative paths", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(isServableAvatarImageUrl("/avatars/local.jpg")).toBe(true);
  });
});
