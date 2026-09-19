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
});
