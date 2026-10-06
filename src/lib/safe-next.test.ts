import { describe, expect, it } from "vitest";
import { safeInternalPath, withNext } from "./safe-next";

describe("safeInternalPath", () => {
  it.each([
    "/",
    "/unirme",
    "/solicitar",
    "/solicitar/estado",
    "/solicitar?x=1",
    "/onboarding/step1#top",
    "/profile/edit?tab=a&b=%2F",
  ])("keeps internal path %s", (value) => {
    expect(safeInternalPath(value)).toBe(value);
  });

  it.each([
    ["protocol-relative", "//evil.com"],
    ["protocol-relative with path", "//evil.com/unirme"],
    ["backslash host", "/\\evil.com"],
    ["backslash anywhere", "/a\\b"],
    ["userinfo trick", "@evil.com"],
    ["absolute https", "https://evil.com"],
    ["absolute http", "http://localhost:3000/unirme"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,x"],
    ["embedded scheme", "/redirect?to=https://evil.com"],
    ["tab inside", "/\t/evil.com"],
    ["newline inside", "/un\nirme"],
    ["no leading slash", "unirme"],
    ["empty", ""],
    ["leading space", " /unirme"],
    ["encoded double slash", "/%2F%2Fevil.com"],
    ["encoded backslash", "/%5Cevil.com"],
  ])("rejects %s", (_label, value) => {
    expect(safeInternalPath(value)).toBe("/");
  });

  it.each([null, undefined, 42, {}, ["/unirme"]])("rejects non-string %p", (value) => {
    expect(safeInternalPath(value)).toBe("/");
  });

  it("uses the given fallback when rejecting", () => {
    expect(safeInternalPath("//evil.com", "/profile")).toBe("/profile");
  });

  it("result always resolves to the same origin", () => {
    const base = "https://nodo.example";
    for (const value of ["//evil.com", "/unirme", "@evil.com", "/\\evil.com"]) {
      expect(new URL(safeInternalPath(value), base).origin).toBe(base);
    }
  });
});

describe("withNext", () => {
  it("appends a safe next as an encoded query param", () => {
    expect(withNext("/auth/signup", "/unirme")).toBe("/auth/signup?next=%2Funirme");
  });

  it("uses & when the path already has a query", () => {
    expect(withNext("/auth/login?error=x", "/unirme")).toBe("/auth/login?error=x&next=%2Funirme");
  });

  it.each(["/", "//evil.com", null, undefined])("leaves the path alone for %p", (next) => {
    expect(withNext("/auth/login", next)).toBe("/auth/login");
  });
});
