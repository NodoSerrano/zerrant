import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TabBarPin } from "./TabBarPin";

describe("TabBarPin", () => {
  it("renders a fixed bottom pin that hosts children", () => {
    render(
      <TabBarPin>
        <nav data-testid="tab-bar" aria-label="TabBar" />
      </TabBarPin>,
    );

    const pin = screen.getByTestId("tab-bar-pin");
    expect(pin.className).toMatch(/fixed/);
    expect(pin.className).toMatch(/bottom-0/);
    expect(pin).toContainElement(screen.getByTestId("tab-bar"));
  });

  it("portals the pin onto document.body outside transformed ancestors", () => {
    const trap = document.createElement("div");
    trap.style.transform = "translateY(0)";
    document.body.appendChild(trap);

    const { unmount } = render(
      <TabBarPin>
        <nav data-testid="tab-bar" aria-label="TabBar" />
      </TabBarPin>,
      { container: trap },
    );

    const pin = screen.getByTestId("tab-bar-pin");
    expect(pin.parentElement).toBe(document.body);
    expect(trap.contains(pin)).toBe(false);

    unmount();
    trap.remove();
  });
});
