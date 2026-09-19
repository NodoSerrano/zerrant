import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
    expect(screen.getByText("hub content")).toBeInTheDocument();
  });

  it("does not render the fake phone status bar (device chrome, not product UI)", () => {
    render(
      <AppLayout>
        <div>hub content</div>
      </AppLayout>,
    );

    expect(screen.queryByText("9:41")).not.toBeInTheDocument();
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

  it("pins TabBar to the viewport bottom and reserves its height so lists do not sit under it", () => {
    const { container } = render(
      <AppLayout>
        <div>hub content</div>
      </AppLayout>,
    );

    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toMatch(/min-h-(full|dvh|screen)/);

    const pin = screen.getByTestId("tab-bar").parentElement as HTMLElement;
    expect(pin.className).toMatch(/fixed/);
    expect(pin.className).toMatch(/bottom-0/);

    // Pencil TabBar outer frame: pt 21 + pill 62 + pb 21 = 104px.
    const spacer = container.querySelector('[data-testid="tab-bar-spacer"]');
    expect(spacer).toBeInTheDocument();
    expect(spacer?.className).toContain("h-[104px]");
  });
});
