import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceOnboardingGate: vi.fn(),
}));

vi.mock("@/features/profile/onboarding-gate-server", () => ({
  enforceOnboardingGate: mocks.enforceOnboardingGate,
}));

import ModalTemplate from "./template";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.enforceOnboardingGate.mockResolvedValue(undefined);
});

describe("Modal template onboarding gate", () => {
  it("enforces the onboarding gate before rendering children", async () => {
    const result = await ModalTemplate({ children: "task modal" });

    expect(mocks.enforceOnboardingGate).toHaveBeenCalledTimes(1);
    expect(result).toBe("task modal");
  });
});
