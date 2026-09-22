import { describe, expect, it } from "vitest";
import { getEventCoverRemotePatterns, isServableEventCoverImageUrl } from "./event-cover-image-url";

describe("getEventCoverRemotePatterns", () => {
  it("allows Luma CDN hosts used by cover_url / social_image_url", () => {
    const hosts = getEventCoverRemotePatterns().map((p) => p.hostname);
    expect(hosts).toContain("images.lumacdn.com");
  });
});

describe("isServableEventCoverImageUrl", () => {
  it("accepts https Luma cover URLs", () => {
    expect(
      isServableEventCoverImageUrl(
        "https://images.lumacdn.com/uploads/2y/d35c3eeb-58c7-4333-8ab5-5d2920735994.png",
      ),
    ).toBe(true);
  });

  it("rejects empty, relative junk, and unknown hosts", () => {
    expect(isServableEventCoverImageUrl(null)).toBe(false);
    expect(isServableEventCoverImageUrl("")).toBe(false);
    expect(isServableEventCoverImageUrl("/local.png")).toBe(false);
    expect(isServableEventCoverImageUrl("https://evil.example/x.png")).toBe(false);
  });
});
