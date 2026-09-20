import { describe, expect, it } from "vitest";
import {
  OFFLINE_FALLBACK_PATH,
  SHELL_PRECACHE_PATHS,
  isPrivateMemberDirectoryPath,
  isShellNavigationFallbackRequest,
  shouldBypassRuntimeCache,
} from "./offlineShellPolicy";

describe("offlineShellPolicy", () => {
  it("exposes the Serwist offline fallback path used for navigation failures", () => {
    expect(OFFLINE_FALLBACK_PATH).toBe("/~offline");
    expect(SHELL_PRECACHE_PATHS).toContain(OFFLINE_FALLBACK_PATH);
  });

  it("treats plantel member directory routes as private (no offline social graph)", () => {
    expect(isPrivateMemberDirectoryPath("/plantel")).toBe(true);
    expect(isPrivateMemberDirectoryPath("/plantel/abc")).toBe(true);
    expect(isPrivateMemberDirectoryPath("/plantel/abc/edit")).toBe(true);
  });

  it("does not treat shell, auth, or public static paths as private member directories", () => {
    expect(isPrivateMemberDirectoryPath("/")).toBe(false);
    expect(isPrivateMemberDirectoryPath("/~offline")).toBe(false);
    expect(isPrivateMemberDirectoryPath("/auth/login")).toBe(false);
    expect(isPrivateMemberDirectoryPath("/icons/icon-192.png")).toBe(false);
    expect(isPrivateMemberDirectoryPath("/nodo/tasks")).toBe(false);
    expect(isPrivateMemberDirectoryPath("/profile")).toBe(false);
  });

  it("bypasses runtime cache for private directories and cross-origin data hosts", () => {
    expect(
      shouldBypassRuntimeCache({
        pathname: "/plantel",
        sameOrigin: true,
      }),
    ).toBe(true);

    expect(
      shouldBypassRuntimeCache({
        pathname: "/~offline",
        sameOrigin: true,
      }),
    ).toBe(false);

    expect(
      shouldBypassRuntimeCache({
        pathname: "/rest/v1/profiles",
        sameOrigin: false,
        hostname: "abcdefgh.supabase.co",
      }),
    ).toBe(true);

    expect(
      shouldBypassRuntimeCache({
        pathname: "/_next/static/chunks/main.js",
        sameOrigin: true,
      }),
    ).toBe(false);
  });

  it("matches document navigations for the offline shell fallback", () => {
    expect(
      isShellNavigationFallbackRequest({
        destination: "document",
        mode: "navigate",
      }),
    ).toBe(true);

    expect(
      isShellNavigationFallbackRequest({
        destination: "script",
        mode: "no-cors",
      }),
    ).toBe(false);
  });
});
