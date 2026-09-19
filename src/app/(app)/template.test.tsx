import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceOnboardingGate: vi.fn(),
}));

vi.mock("@/features/profile/onboarding-gate-server", () => ({
  enforceOnboardingGate: mocks.enforceOnboardingGate,
}));

import AppTemplate from "./template";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.enforceOnboardingGate.mockResolvedValue(undefined);
});

describe("App template onboarding gate", () => {
  it("enforces the onboarding gate before rendering children", async () => {
    const result = await AppTemplate({ children: "hub" });

    expect(mocks.enforceOnboardingGate).toHaveBeenCalledTimes(1);
    expect(result).toBe("hub");
  });
});
