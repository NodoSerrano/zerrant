import { describe, expect, it } from "vitest";
import {
  SER_SERRANO_APPLY_HREF,
  SER_SERRANO_CTA_HREF,
  shouldShowSerSerranoCta,
} from "./ser-serrano-cta";

describe("shouldShowSerSerranoCta (ZER-171)", () => {
  it("shows for tourist without active membership request", () => {
    expect(shouldShowSerSerranoCta({ tier: "tourist", hasActiveMembershipRequest: false })).toBe(
      true,
    );
  });

  it("hides for tourist with active membership request", () => {
    expect(shouldShowSerSerranoCta({ tier: "tourist", hasActiveMembershipRequest: true })).toBe(
      false,
    );
  });

  it("hides for member tiers even without a request", () => {
    for (const tier of ["member", "core", "alumni", "serrano"] as const) {
      expect(shouldShowSerSerranoCta({ tier, hasActiveMembershipRequest: false })).toBe(false);
      expect(shouldShowSerSerranoCta({ tier, hasActiveMembershipRequest: true })).toBe(false);
    }
  });

  it("hides when tier is missing or unknown", () => {
    expect(shouldShowSerSerranoCta({ tier: null, hasActiveMembershipRequest: false })).toBe(false);
    expect(shouldShowSerSerranoCta({ tier: undefined, hasActiveMembershipRequest: false })).toBe(
      false,
    );
    expect(shouldShowSerSerranoCta({ tier: "", hasActiveMembershipRequest: false })).toBe(false);
  });

  it("sends the banner to the benefits page, and only that page to the form (ZER-191)", () => {
    expect(SER_SERRANO_CTA_HREF).toBe("/ser-serrano");
    expect(SER_SERRANO_APPLY_HREF).toBe("/solicitar");
  });
});
