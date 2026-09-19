import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/StatusBar", () => ({
  StatusBar: () => <div data-testid="status-bar" />,
}));

vi.mock("@/components/TabBarClient", () => ({
  TabBarClient: () => <nav data-testid="tab-bar" aria-label="TabBar" />,
}));

import ModalLayout from "./layout";

describe("Modal shell layout (task create/detail/edit)", () => {
  it("does not render TabBar on focused task screens", () => {
    render(
      <ModalLayout>
        <div>task modal content</div>
      </ModalLayout>,
    );

    expect(screen.queryByTestId("tab-bar")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "TabBar" })).not.toBeInTheDocument();
    expect(screen.getByTestId("status-bar")).toBeInTheDocument();
    expect(screen.getByText("task modal content")).toBeInTheDocument();
  });
});
