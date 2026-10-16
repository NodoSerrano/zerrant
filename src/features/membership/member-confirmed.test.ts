import { describe, expect, it } from "vitest";
import { MEMBER_CONFIRMED_NOTICE_MS, memberConfirmedSince } from "./member-confirmed";

describe("memberConfirmedSince", () => {
  it("is seven days before the given instant", () => {
    const now = new Date("2026-10-14T12:00:00.000Z");
    expect(memberConfirmedSince(now)).toBe(
      new Date(now.getTime() - MEMBER_CONFIRMED_NOTICE_MS).toISOString(),
    );
    expect(Date.parse(memberConfirmedSince(now))).toBe(Date.parse("2026-10-07T12:00:00.000Z"));
  });
});
