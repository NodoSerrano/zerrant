import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/TabBarClient", () => ({
  TabBarClient: () => <nav data-testid="tab-bar" aria-label="TabBar" />,
}));

import ModalLayout from "./layout";

describe("Modal shell layout (focused screens without TabBar)", () => {
  it("does not render TabBar or the tab-bar spacer on focused screens", () => {
    render(
      <ModalLayout>
        <div>task modal content</div>
      </ModalLayout>,
    );

    expect(screen.queryByTestId("tab-bar")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "TabBar" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-bar-spacer")).not.toBeInTheDocument();
    expect(screen.getByText("task modal content")).toBeInTheDocument();
  });

  it("does not render the fake phone status bar (device chrome, not product UI)", () => {
    render(
      <ModalLayout>
        <div>task modal content</div>
      </ModalLayout>,
    );

    expect(screen.queryByText("9:41")).not.toBeInTheDocument();
  });

  it("uses Pencil focused wrapper padding [6,20,24,20] (ZqSLW / KG95R / vPUkG)", () => {
    const { container } = render(
      <ModalLayout>
        <div>task modal content</div>
      </ModalLayout>,
    );

    const content = container.querySelector(".max-w-lg");
    expect(content?.className).toContain("pt-1.5");
    expect(content?.className).toContain("px-5");
    expect(content?.className).toContain("pb-6");
    expect(content?.className).not.toContain("p-5");
  });
});
