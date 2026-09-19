import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/StatusBar", () => ({
  StatusBar: () => <div data-testid="status-bar" />,
}));

vi.mock("@/components/TabBarClient", () => ({
  TabBarClient: () => <nav data-testid="tab-bar" aria-label="TabBar" />,
}));

// TabBarPin is a client component; keep real implementation so portal contract is tested.

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

  it("pins TabBar to the viewport bottom and reserves its height so lists do not sit under it", () => {
    const { container } = render(
      <AppLayout>
        <div>hub content</div>
      </AppLayout>,
    );

    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toMatch(/min-h-(full|dvh|screen)/);

    const pin = screen.getByTestId("tab-bar-pin");
    expect(pin.className).toMatch(/fixed/);
    expect(pin.className).toMatch(/bottom-0/);
    expect(pin).toContainElement(screen.getByTestId("tab-bar"));

    // Pencil TabBar outer frame: pt 21 + pill 62 + pb 21 = 104px.
    const spacer = container.querySelector('[data-testid="tab-bar-spacer"]');
    expect(spacer).toBeInTheDocument();
    expect(spacer?.className).toContain("h-[104px]");
  });

  it("portals the TabBar pin to document.body so fixed anchors to the viewport (ZER-70)", () => {
    // A transformed ancestor would make position:fixed behave like absolute
    // against that box — the failure mode on /nodo/tasks where the bar sat
    // at the top while body-level fixed (Next dev badge) still worked.
    const trap = document.createElement("div");
    trap.style.transform = "translateX(0)";
    document.body.appendChild(trap);

    const { unmount } = render(
      <AppLayout>
        <div>hub content</div>
      </AppLayout>,
      { container: trap },
    );

    const pin = screen.getByTestId("tab-bar-pin");
    expect(pin.parentElement).toBe(document.body);
    expect(trap.contains(pin)).toBe(false);
    expect(pin.className).toMatch(/fixed/);
    expect(pin.className).toMatch(/bottom-0/);

    unmount();
    trap.remove();
  });
});
