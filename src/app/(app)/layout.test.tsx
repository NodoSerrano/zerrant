import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/StatusBar", () => ({
  StatusBar: () => <div data-testid="status-bar" />,
}));

vi.mock("@/components/TabBarClient", () => ({
  TabBarClient: () => <nav data-testid="tab-bar" aria-label="TabBar" />,
}));

import AppLayout from "./layout";

describe("App shell layout (navigation destinations)", () => {
  it("renders TabBar for destinations that keep bottom navigation", () => {
    render(
      <AppLayout>
        <div>hub content</div>
      </AppLayout>,
    );

    expect(screen.getByTestId("tab-bar")).toBeInTheDocument();
    expect(screen.getByTestId("status-bar")).toBeInTheDocument();
    expect(screen.getByText("hub content")).toBeInTheDocument();
  });

  it("uses Pencil hub wrapper padding [8,20,20,20] (NgZiI / k8Odh / v9SljB)", () => {
    const { container } = render(
      <AppLayout>
        <div>hub content</div>
      </AppLayout>,
    );

    const content = container.querySelector(".max-w-lg");
    expect(content?.className).toContain("pt-2");
    expect(content?.className).toContain("px-5");
    expect(content?.className).toContain("pb-5");
    expect(content?.className).not.toContain("p-5");
  });
});
