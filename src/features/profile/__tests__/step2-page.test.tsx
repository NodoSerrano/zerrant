import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mocks.redirect(url),
}));

import OnboardingStep2 from "@/app/(onboarding)/onboarding/step2/page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OnboardingStep2 page", () => {
  it("redirects old links to step1", async () => {
    await expect(OnboardingStep2()).rejects.toThrow("NEXT_REDIRECT:/onboarding/step1");
    expect(mocks.redirect).toHaveBeenCalledWith("/onboarding/step1");
  });
});
