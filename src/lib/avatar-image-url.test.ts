import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseAvatarRemotePatterns, isServableAvatarImageUrl } from "./avatar-image-url";

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
