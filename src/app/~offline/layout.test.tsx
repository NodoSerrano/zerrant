import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/TabBarClient", () => ({
  TabBarClient: () => <nav data-testid="tab-bar" aria-label="TabBar" />,
}));

import OfflineLayout from "./layout";

describe("/~offline layout chrome", () => {
  it("keeps TabBar shell chrome on the public offline fallback", () => {
    render(
      <OfflineLayout>
        <div>offline body</div>
      </OfflineLayout>,
    );

    expect(screen.getByTestId("tab-bar")).toBeInTheDocument();
    expect(screen.getByText("offline body")).toBeInTheDocument();
  });
});
