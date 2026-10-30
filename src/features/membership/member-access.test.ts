import { describe, expect, it } from "vitest";
import { hasMemberAccess } from "./member-access";

describe("hasMemberAccess (ZER-206)", () => {
  it("lets members in", () => {
    expect(hasMemberAccess({ profile: { tier: "member" }, userId: "u1" })).toBe(true);
  });

  it("keeps tourists out", () => {
    expect(hasMemberAccess({ profile: { tier: "tourist" }, userId: "u1" })).toBe(false);
  });

  it("treats a platform admin as a member even with the tourist tier", () => {
    expect(
      hasMemberAccess({ profile: { tier: "tourist", is_platform_admin: true }, userId: "u1" }),
    ).toBe(true);
  });

  it("soft-allows a signed-in user whose profile could not be read", () => {
    expect(hasMemberAccess({ profile: null, userId: "u1" })).toBe(true);
  });

  it("gives no access when signed out", () => {
    expect(hasMemberAccess({ profile: null, userId: null })).toBe(false);
  });
});
