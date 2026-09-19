import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/TabBarClient", () => ({
  TabBarClient: () => <nav data-testid="tab-bar" aria-label="TabBar" />,
}));

import OnboardingShellLayout from "./layout";

describe("Onboarding shell layout", () => {
  it("does not render TabBar or the tab-bar spacer", () => {
    render(
      <OnboardingShellLayout>
        <div>onboarding content</div>
      </OnboardingShellLayout>,
    );

    expect(screen.queryByTestId("tab-bar")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "TabBar" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-bar-spacer")).not.toBeInTheDocument();
    expect(screen.getByText("onboarding content")).toBeInTheDocument();
  });

  it("keeps the hub shell padding contract (20px sides/top after ZER-73)", () => {
    const { container } = render(
      <OnboardingShellLayout>
        <div>onboarding content</div>
      </OnboardingShellLayout>,
    );

    const content = container.querySelector(".max-w-lg");
    expect(content?.className).toContain("pt-5");
    expect(content?.className).toContain("px-5");
    expect(content?.className).toContain("pb-5");
  });
});
