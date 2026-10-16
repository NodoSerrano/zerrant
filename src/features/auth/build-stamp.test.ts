import { describe, expect, it } from "vitest";
import { formatBuildStamp } from "./build-stamp";

describe("formatBuildStamp", () => {
  it("joins channel, branch and short sha", () => {
    expect(formatBuildStamp({ channel: "test", ref: "develop", sha: "0988fc8" })).toBe(
      "test · develop · 0988fc8",
    );
  });

  it("shortens a full sha", () => {
    expect(
      formatBuildStamp({
        channel: "prod",
        ref: "main",
        sha: "694ef9b0a1b2c3d4e5f678901234567890abcd",
      }),
    ).toBe("prod · main · 694ef9b");
  });

  it("drops a detached HEAD ref", () => {
    expect(formatBuildStamp({ channel: "test", ref: "HEAD", sha: "abc1234" })).toBe(
      "test · abc1234",
    );
  });

  it("returns null when nothing was stamped", () => {
    expect(formatBuildStamp({ channel: "  ", ref: "", sha: null })).toBeNull();
  });
});
